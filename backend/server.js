require("dotenv").config();

const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const path = require("path");
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");

const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");

const {
  getSignedUrl,
} = require("@aws-sdk/s3-request-presigner");

const { PORT, PUBLIC_API_URL, FRONTEND_URL } = require("./config");
const db = require("./db");
const { b2Client, B2_BUCKET } = require("./storage");
const authenticateUser = require("./middleware/auth");
const { sendMail, sendResetEmail, mailTransporter } = require("./mailer");

const app = express();

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : true;

app.use(
  cors({
    origin: allowedOrigins,
  })
);

app.use(
  express.json({
    limit: "15mb",
  })
);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Too many login attempts. Please try again later.",
  },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Too many password-reset requests. Please try again later.",
  },
});

const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error:
      "Too many report requests. Please try again later.",
  },
});

const allowedReportMimeTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
]);

const isValidBase64 = (value) => {
  const normalized = String(value || "").replace(/\s/g, "");

  if (!normalized || normalized.length % 4 !== 0) {
    return false;
  }

  return /^[A-Za-z0-9+/]+={0,2}$/.test(normalized);
};

const fileMatchesMimeType = (buffer, mimeType) => {
  if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
    return false;
  }

  if (mimeType === "application/pdf") {
    return buffer.subarray(0, 4).toString("ascii") === "%PDF";
  }

  if (mimeType === "image/jpeg" || mimeType === "image/jpg") {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }

  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  }

  if (mimeType === "image/gif") {
    const signature = buffer.subarray(0, 6).toString("ascii");
    return signature === "GIF87a" || signature === "GIF89a";
  }

  if (mimeType === "image/webp") {
    return (
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  // BMP, TIFF, HEIC and HEIF signatures vary; they remain MIME allow-listed
  // and are stored privately, but executable and SVG formats are not accepted.
  return [
    "image/bmp",
    "image/tiff",
    "image/heic",
    "image/heif",
  ].includes(mimeType);
};

const sanitizeFilename = (filename) => {
  const originalFilename = path.basename(
    String(filename || "report")
  );

  const sanitizedFilename = originalFilename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);

  return sanitizedFilename || "report";
};

const hashToken = (token) =>
  crypto
    .createHash("sha256")
    .update(String(token))
    .digest("hex");

const EMAIL_CODE_EXPIRES_MINUTES = Number(
  process.env.EMAIL_CODE_EXPIRES_MINUTES || 10
);

const EMAIL_CODE_RESEND_SECONDS = Number(
  process.env.EMAIL_CODE_RESEND_SECONDS || 60
);

const generateVerificationCode = () =>
  String(crypto.randomInt(0, 1000000)).padStart(6, "0");

const createAndSendVerificationCode = async (user) => {
  const code = generateVerificationCode();
  const codeHash = hashToken(code);

  const expiresAt = new Date(
    Date.now() + EMAIL_CODE_EXPIRES_MINUTES * 60 * 1000
  );

  await db.execute(
    `INSERT INTO email_verification_codes (
      user_id, code_hash, expires_at
    ) VALUES (?, ?, ?)`,
    [user.id, codeHash, expiresAt]
  );

  await sendMail({
    to: user.email,
    subject: "Verify your AmarCure email address",
    text:
      `Your AmarCure verification code is: ${code}\n\n` +
      `This code expires in ${EMAIL_CODE_EXPIRES_MINUTES} minutes.\n\n` +
      `If you did not create an AmarCure account, you can ignore this email.`,
    html:
      `<h2>Verify your AmarCure email address</h2>` +
      `<p>Your verification code is:</p>` +
      `<p style="font-size:28px;font-weight:800;letter-spacing:6px;">${code}</p>` +
      `<p>This code expires in ${EMAIL_CODE_EXPIRES_MINUTES} minutes.</p>` +
      `<p>If you did not create an AmarCure account, you can ignore this email.</p>`,
  });
};

const reportResponse = (report) => ({
  id: Number(report.id),
  originalName: report.original_name,
  mimeType: report.mime_type,
  fileSize: Number(report.file_size),
  createdAt: report.created_at,
});

const createAccessToken = (user) =>
  jwt.sign(
    {
      sub: String(user.id),
      tokenVersion: Number(
        user.token_version || 0
      ),
      type: "access",
    },
    process.env.JWT_ACCESS_SECRET,
    {
      expiresIn:
        process.env.JWT_ACCESS_EXPIRES_IN ||
        "30m",
      issuer: "amarcure-api",
      audience: "amarcure-app",
    }
  );

const migrateLegacyPasswords =
  async () => {
    try {
      const [users] = await db.execute(
        `SELECT id, password
         FROM users
         WHERE password_hash IS NULL
           AND password IS NOT NULL
           AND password <> ''`
      );

      for (const user of users) {
        const passwordHash =
          await argon2.hash(
            String(user.password),
            {
              type: argon2.argon2id,
            }
          );

        await db.execute(
          `UPDATE users
           SET password_hash = ?
           WHERE id = ?`,
          [passwordHash, user.id]
        );
      }

      if (users.length > 0) {
        console.log(
          `Migrated ${users.length} legacy password(s) to Argon2id.`
        );
      }
    } catch (error) {
      console.error(
        "Legacy password migration failed:",
        error
      );
    }
  };

app.get("/", (req, res) => {
  return res
    .status(200)
    .send(
      "AmarCure backend is running."
    );
});

// --- USER PROFILE ENDPOINT ---
app.get(
  "/api/user/profile",
  authenticateUser,
  async (req, res) => {
    try {
      const [users] = await db.execute(
        `SELECT
           first_name AS firstName,
           last_name AS lastName,
           email,
           phone AS phone,
           height_unit AS heightUnit,
           height_value AS heightValue,
           weight,
           address,
           blood_group AS bloodGroup,
           chronic_disease AS chronicDisease,
           other_disease AS otherDisease
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [req.user.id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          error: "User profile not found.",
        });
      }

      return res.status(200).json(users[0]);
    } catch (error) {
      console.error("Load user profile error:", error);
      return res.status(500).json({
        error: "Could not load user profile.",
      });
    }
  }
);

const allowedBloodGroups = new Set([
  "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
]);

app.put(
  "/api/user/profile",
  authenticateUser,
  async (req, res) => {
    const {
      firstName,
      lastName,
      phone,
      bloodGroup,
      heightValue,
      weight,
    } = req.body || {};

    const normalizedFirstName = String(firstName || "").trim();
    const normalizedLastName = String(lastName || "").trim();
    const normalizedPhone = String(phone || "").replace(/\s+/g, "").trim();
    const normalizedBloodGroup = String(bloodGroup || "").trim().toUpperCase();
    const normalizedHeightValue = String(heightValue || "").trim();
    const normalizedWeight = String(weight || "").trim();

    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedPhone ||
      !normalizedBloodGroup ||
      !normalizedHeightValue ||
      !normalizedWeight
    ) {
      return res.status(400).json({
        error: "Please complete all required fields.",
      });
    }

    if (!/^\+?[0-9]{10,15}$/.test(normalizedPhone)) {
      return res.status(400).json({
        error: "Please enter a valid phone number containing 10 to 15 digits.",
      });
    }

    if (!allowedBloodGroups.has(normalizedBloodGroup)) {
      return res.status(400).json({
        error: "Please select a valid blood group.",
      });
    }

    const numericHeight = Number(normalizedHeightValue);
    const numericWeight = Number(normalizedWeight);

    if (!Number.isFinite(numericHeight) || numericHeight < 20 || numericHeight > 300) {
      return res.status(400).json({
        error: "Please enter a valid height.",
      });
    }

    if (!Number.isFinite(numericWeight) || numericWeight < 2 || numericWeight > 500) {
      return res.status(400).json({
        error: "Weight must be between 2 kg and 500 kg.",
      });
    }

    try {
      const [existingPhoneUsers] = await db.execute(
        `SELECT id FROM users WHERE phone = ? AND id <> ? LIMIT 1`,
        [normalizedPhone, req.user.id]
      );

      if (existingPhoneUsers.length > 0) {
        return res.status(409).json({
          error: "That phone number is already used by another account.",
        });
      }

      await db.execute(
        `UPDATE users
         SET first_name = ?,
             last_name = ?,
             phone = ?,
             blood_group = ?,
             height_value = ?,
             weight = ?
         WHERE id = ?`,
        [
          normalizedFirstName,
          normalizedLastName,
          normalizedPhone,
          normalizedBloodGroup,
          normalizedHeightValue,
          normalizedWeight,
          req.user.id,
        ]
      );

      const [users] = await db.execute(
        `SELECT
           first_name AS firstName,
           last_name AS lastName,
           email,
           phone AS phone,
           height_unit AS heightUnit,
           height_value AS heightValue,
           weight,
           address,
           blood_group AS bloodGroup,
           chronic_disease AS chronicDisease,
           other_disease AS otherDisease
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [req.user.id]
      );

      return res.status(200).json(users[0]);
    } catch (error) {
      console.error("Update user profile error:", error);
      return res.status(500).json({
        error: "Could not update your profile.",
      });
    }
  }
);

app.post(
  "/api/register",
  loginLimiter,
  async (req, res) => {
    const {
      firstName,
      lastName,
      email,
      phone,
      heightUnit,
      heightValue,
      weight,
      address,
      bloodGroup,
      chronicDisease,
      otherDisease,
      password,
    } = req.body;

    const normalizedEmail = String(
      email || ""
    )
      .trim()
      .toLowerCase();

    const normalizedPhone = String(
      phone || ""
    ).trim();

    if (
      !String(firstName || "").trim() ||
      !String(lastName || "").trim() ||
      !normalizedEmail ||
      !normalizedPhone ||
      !String(heightUnit || "").trim() ||
      !String(heightValue || "").trim() ||
      !String(weight || "").trim() ||
      !String(address || "").trim() ||
      !String(bloodGroup || "").trim() ||
      !String(
        chronicDisease || ""
      ).trim() ||
      !String(password || "")
    ) {
      return res.status(400).json({
        error:
          "Please complete all required fields.",
      });
    }

    const emailPattern =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (
      !emailPattern.test(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        error:
          "Please enter a valid email address.",
      });
    }

    if (
      String(password).length < 12
    ) {
      return res.status(400).json({
        error:
          "Password must contain at least 12 characters.",
      });
    }

    try {
      const [existingUsers] =
        await db.execute(
          `SELECT id
           FROM users
           WHERE email = ?
              OR phone = ?
           LIMIT 1`,
          [
            normalizedEmail,
            normalizedPhone,
          ]
        );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          error:
            "An account already exists with that email or phone number.",
        });
      }

      const passwordHash =
        await argon2.hash(
          String(password),
          {
            type: argon2.argon2id,
          }
        );

      const [result] =
        await db.execute(
          `INSERT INTO users (
            first_name,
            last_name,
            email,
            phone,
            height_unit,
            height_value,
            weight,
            address,
            blood_group,
            chronic_disease,
            other_disease,
            password,
            password_hash,
            token_version
          )
          VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', ?, 0
          )`,
          [
            String(firstName).trim(),
            String(lastName).trim(),
            normalizedEmail,
            normalizedPhone,
            String(heightUnit).trim(),
            String(heightValue).trim(),
            String(weight).trim(),
            String(address).trim(),
            String(bloodGroup).trim(),
            String(
              chronicDisease
            ).trim(),
            String(
              otherDisease || ""
            ).trim(),
            passwordHash,
          ]
        );

      try {
        await createAndSendVerificationCode({
          id: result.insertId,
          email: normalizedEmail,
        });
      } catch (verificationError) {
        console.error(
          "Sending verification code failed:",
          verificationError
        );
      }

      return res.status(201).json({
        message:
          "User registered successfully.",
        userId: result.insertId,
      });
    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      return res.status(500).json({
        error:
          "Could not create the account.",
      });
    }
  }
);

app.post(
  "/api/login",
  loginLimiter,
  async (req, res) => {
    const identifier = String(
      req.body.identifier || ""
    ).trim();

    const password = String(
      req.body.password || ""
    );

    if (!identifier || !password) {
      return res.status(400).json({
        error:
          "Email/phone and password are required.",
      });
    }

    try {
      const [users] =
        await db.execute(
          `SELECT *
           FROM users
           WHERE email = ?
              OR phone = ?
           LIMIT 1`,
          [
            identifier.toLowerCase(),
            identifier,
          ]
        );

      if (
        users.length === 0 ||
        !users[0].password_hash
      ) {
        return res.status(401).json({
          error:
            "Invalid email/phone or password.",
        });
      }

      const user = users[0];

      const passwordMatches =
        await argon2.verify(
          user.password_hash,
          password
        );

      if (!passwordMatches) {
        return res.status(401).json({
          error:
            "Invalid email/phone or password.",
        });
      }

      if (!user.email_verified_at) {
        return res.status(403).json({
          error:
            "Please verify your email before logging in.",
          code: "EMAIL_NOT_VERIFIED",
          email: user.email,
        });
      }

      const accessToken =
        createAccessToken(user);

      try {
        await db.execute(
          `INSERT INTO session_logs (
            user_id,
            email_or_phone,
            event_type
          )
          VALUES (?, ?, 'LOGIN')`,
          [user.id, identifier]
        );
      } catch (loggingError) {
        console.error(
          "Login logging failed:",
          loggingError
        );
      }

      return res.status(200).json({
        message:
          "Login successful.",
        accessToken,
        user: {
          id: Number(user.id),
          firstName:
            user.first_name,
          lastName:
            user.last_name,
          email: user.email,
        },
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      return res.status(500).json({
        error:
          "Database authentication error.",
      });
    }
  }
);

app.post(
  "/api/auth/verify-email",
  loginLimiter,
  async (req, res) => {
    const normalizedEmail = String(req.body.email || "")
      .trim()
      .toLowerCase();

    const normalizedCode = String(req.body.code || "")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (!normalizedEmail || normalizedCode.length !== 6) {
      return res.status(400).json({
        error: "A valid email and six-digit code are required.",
      });
    }

    try {
      const [users] = await db.execute(
        `SELECT id, email_verified_at FROM users WHERE email = ? LIMIT 1`,
        [normalizedEmail]
      );

      if (users.length === 0) {
        return res.status(400).json({
          error: "Invalid or expired verification code.",
        });
      }

      const user = users[0];

      if (user.email_verified_at) {
        return res.status(200).json({
          message: "Your email is already verified.",
        });
      }

      const [codes] = await db.execute(
        `SELECT *
         FROM email_verification_codes
         WHERE user_id = ?
           AND used_at IS NULL
           AND expires_at > NOW()
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.id]
      );

      if (codes.length === 0) {
        return res.status(400).json({
          error:
            "This code has expired. Please request a new one.",
        });
      }

      const codeRecord = codes[0];

      if (Number(codeRecord.attempts || 0) >= 5) {
        return res.status(400).json({
          error:
            "Too many incorrect attempts. Please request a new code.",
        });
      }

      if (hashToken(normalizedCode) !== codeRecord.code_hash) {
        await db.execute(
          `UPDATE email_verification_codes SET attempts = attempts + 1 WHERE id = ?`,
          [codeRecord.id]
        );

        return res.status(400).json({
          error: "Incorrect verification code.",
        });
      }

      await db.execute(
        `UPDATE email_verification_codes SET used_at = NOW() WHERE id = ?`,
        [codeRecord.id]
      );

      await db.execute(
        `UPDATE users SET email_verified_at = NOW() WHERE id = ?`,
        [user.id]
      );

      return res.status(200).json({
        message: "Your email has been verified successfully.",
      });
    } catch (error) {
      console.error("Verify email error:", error);

      return res.status(500).json({
        error: "Could not verify the email address.",
      });
    }
  }
);

app.post(
  "/api/auth/resend-verification",
  passwordResetLimiter,
  async (req, res) => {
    const normalizedEmail = String(req.body.email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail) {
      return res.status(400).json({
        error: "An email address is required.",
      });
    }

    try {
      const [users] = await db.execute(
        `SELECT id, email, email_verified_at FROM users WHERE email = ? LIMIT 1`,
        [normalizedEmail]
      );

      if (users.length === 0) {
        return res.status(404).json({
          error: "No account found with that email address.",
        });
      }

      const user = users[0];

      if (user.email_verified_at) {
        return res.status(400).json({
          error: "This email is already verified. Please log in.",
        });
      }

      const [recentCodes] = await db.execute(
        `SELECT created_at
         FROM email_verification_codes
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.id]
      );

      if (recentCodes.length > 0) {
        const secondsSinceLastCode =
          (Date.now() - new Date(recentCodes[0].created_at).getTime()) / 1000;

        if (secondsSinceLastCode < EMAIL_CODE_RESEND_SECONDS) {
          const waitSeconds = Math.ceil(
            EMAIL_CODE_RESEND_SECONDS - secondsSinceLastCode
          );

          return res.status(429).json({
            error: `Please wait ${waitSeconds} seconds before requesting another code.`,
          });
        }
      }

      await createAndSendVerificationCode(user);

      return res.status(200).json({
        message: "A new verification code was sent.",
      });
    } catch (error) {
      console.error("Resend verification error:", error);

      return res.status(500).json({
        error: "Could not resend the verification code.",
      });
    }
  }
);

app.post(
  "/api/auth/forgot-password",
  passwordResetLimiter,
  async (req, res) => {
    const email = String(
      req.body.email || ""
    )
      .trim()
      .toLowerCase();

    const genericMessage =
      "If an account exists for this email, a password reset link has been sent.";

    if (!email) {
      return res.status(200).json({
        message: genericMessage,
      });
    }

    try {
      const [users] =
        await db.execute(
          `SELECT id, email
           FROM users
           WHERE email = ?
           LIMIT 1`,
          [email]
        );

      if (users.length === 0) {
        return res.status(200).json({
          message: genericMessage,
        });
      }

      const user = users[0];

      await db.execute(
        `UPDATE password_reset_tokens
         SET used_at = NOW()
         WHERE user_id = ?
           AND used_at IS NULL`,
        [user.id]
      );

      const rawToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      const tokenHash =
        hashToken(rawToken);

      const expiresAt =
        new Date(
          Date.now() +
            20 * 60 * 1000
        );

      await db.execute(
        `INSERT INTO password_reset_tokens (
          user_id,
          token_hash,
          expires_at
        )
        VALUES (?, ?, ?)`,
        [
          user.id,
          tokenHash,
          expiresAt,
        ]
      );

      const resetUrl =
        `${FRONTEND_URL}/reset-password?token=` +
        encodeURIComponent(rawToken);

      await sendResetEmail(
        user.email,
        resetUrl
      );

      const responseBody = {
        message: genericMessage,
      };

      if (
        !mailTransporter &&
        process.env.NODE_ENV !==
          "production"
      ) {
        responseBody.developmentResetUrl =
          resetUrl;
      }

      return res
        .status(200)
        .json(responseBody);
    } catch (error) {
      console.error(
        "Forgot-password error:",
        error
      );

      return res.status(200).json({
        message: genericMessage,
      });
    }
  }
);

app.post(
  "/api/auth/reset-password",
  passwordResetLimiter,
  async (req, res) => {
    const token = String(
      req.body.token || ""
    );

    const newPassword = String(
      req.body.newPassword || ""
    );

    const confirmPassword = String(
      req.body.confirmPassword || ""
    );

    if (!token) {
      return res.status(400).json({
        error:
          "The reset token is missing.",
      });
    }

    if (
      newPassword.length < 12
    ) {
      return res.status(400).json({
        error:
          "Password must contain at least 12 characters.",
      });
    }

    if (
      newPassword !== confirmPassword
    ) {
      return res.status(400).json({
        error:
          "The passwords do not match.",
      });
    }

    const tokenHash =
      hashToken(token);

    const connection =
      await db.getConnection();

    let transactionStarted = false;

    try {
      const [resetRecords] =
        await connection.execute(
          `SELECT *
           FROM password_reset_tokens
           WHERE token_hash = ?
             AND used_at IS NULL
             AND expires_at > NOW()
           LIMIT 1`,
          [tokenHash]
        );

      if (
        resetRecords.length === 0
      ) {
        return res.status(400).json({
          error:
            "The reset link is invalid or has expired.",
        });
      }

      const resetRecord =
        resetRecords[0];

      const [users] =
        await connection.execute(
          `SELECT password_hash
           FROM users
           WHERE id = ?
           LIMIT 1`,
          [resetRecord.user_id]
        );

      if (users.length === 0) {
        return res.status(400).json({
          error:
            "The account no longer exists.",
        });
      }

      if (
        users[0].password_hash
      ) {
        const isOldPassword =
          await argon2.verify(
            users[0].password_hash,
            newPassword
          );

        if (isOldPassword) {
          return res.status(400).json({
            error:
              "Please choose a password different from your old password.",
          });
        }
      }

      const newPasswordHash =
        await argon2.hash(
          newPassword,
          {
            type: argon2.argon2id,
          }
        );

      await connection.beginTransaction();
      transactionStarted = true;

      await connection.execute(
        `UPDATE users
         SET password_hash = ?,
             password = '',
             token_version =
               token_version + 1
         WHERE id = ?`,
        [
          newPasswordHash,
          resetRecord.user_id,
        ]
      );

      await connection.execute(
        `UPDATE password_reset_tokens
         SET used_at = NOW()
         WHERE id = ?`,
        [resetRecord.id]
      );

      await connection.execute(
        `UPDATE password_reset_tokens
         SET used_at = NOW()
         WHERE user_id = ?
           AND used_at IS NULL`,
        [resetRecord.user_id]
      );

      await connection.commit();
      transactionStarted = false;

      return res.status(200).json({
        message:
          "Password reset successfully. Please log in with your new password.",
      });
    } catch (error) {
      if (transactionStarted) {
        await connection.rollback();
      }

      console.error(
        "Reset-password error:",
        error
      );

      return res.status(500).json({
        error:
          "Could not reset the password.",
      });
    } finally {
      connection.release();
    }
  }
);

app.get(
  "/api/reports",
  reportLimiter,
  authenticateUser,
  async (req, res) => {
    try {
      const [reports] =
        await db.execute(
          `SELECT *
           FROM medical_reports
           WHERE user_id = ?
           ORDER BY created_at DESC`,
          [req.user.id]
        );

      return res.status(200).json({
        reports:
          reports.map(
            reportResponse
          ),
      });
    } catch (error) {
      console.error(
        "Load reports error:",
        error
      );

      return res.status(500).json({
        error:
          "Could not load reports.",
      });
    }
  }
);

app.post(
  "/api/reports",
  reportLimiter,
  authenticateUser,
  async (req, res) => {
    const {
      originalName,
      mimeType,
      base64,
    } = req.body;

    if (
      !originalName ||
      !mimeType ||
      !base64
    ) {
      return res.status(400).json({
        error:
          "Report name, file type and file data are required.",
      });
    }

    const normalizedMimeType = String(mimeType).trim().toLowerCase();

    if (!allowedReportMimeTypes.has(normalizedMimeType)) {
      return res.status(415).json({
        error:
          "Only PDF and image reports are supported.",
      });
    }

    if (!isValidBase64(base64)) {
      return res.status(400).json({
        error: "The report data is invalid.",
      });
    }

    const normalizedBase64 = String(base64).replace(/\s/g, "");
    const fileBuffer = Buffer.from(normalizedBase64, "base64");

    if (!fileBuffer.length) {
      return res.status(400).json({
        error:
          "The report file is empty.",
      });
    }

    if (!fileMatchesMimeType(fileBuffer, normalizedMimeType)) {
      return res.status(415).json({
        error: "The uploaded file content does not match its declared type.",
      });
    }

    if (
      fileBuffer.length >
      10 * 1024 * 1024
    ) {
      return res.status(413).json({
        error:
          "The maximum report size is 10 MB.",
      });
    }

    const safeOriginalName =
      sanitizeFilename(originalName);

    const fileExtension =
      path.extname(
        safeOriginalName
      );

    const storageKey =
      `users/${req.user.id}/reports/` +
      `${Date.now()}-` +
      `${crypto
        .randomBytes(12)
        .toString("hex")}` +
      `${fileExtension}`;

    let b2UploadCompleted = false;

    try {
      await b2Client.send(
        new PutObjectCommand({
          Bucket: B2_BUCKET,
          Key: storageKey,
          Body: fileBuffer,
          ContentType: normalizedMimeType,
          Metadata: {
            originalname:
              safeOriginalName,
            userid: String(
              req.user.id
            ),
          },
        })
      );

      b2UploadCompleted = true;

      const [result] =
        await db.execute(
          `INSERT INTO medical_reports (
            user_id,
            original_name,
            stored_name,
            storage_key,
            mime_type,
            file_size,
            share_token
          )
          VALUES (
            ?, ?, NULL, ?, ?, ?, NULL
          )`,
          [
            req.user.id,
            safeOriginalName,
            storageKey,
            normalizedMimeType,
            fileBuffer.length,
          ]
        );

      const [reports] =
        await db.execute(
          `SELECT *
           FROM medical_reports
           WHERE id = ?
             AND user_id = ?
           LIMIT 1`,
          [
            result.insertId,
            req.user.id,
          ]
        );

      return res.status(201).json({
        report:
          reportResponse(
            reports[0]
          ),
      });
    } catch (error) {
      console.error(
        "Report upload error:",
        error
      );

      if (b2UploadCompleted) {
        try {
          await b2Client.send(
            new DeleteObjectCommand({
              Bucket: B2_BUCKET,
              Key: storageKey,
            })
          );
        } catch (
          deleteError
        ) {
          console.error(
            "Could not remove failed B2 upload:",
            deleteError
          );
        }
      }

      return res.status(500).json({
        error:
          "Could not store the report.",
      });
    }
  }
);

app.post(
  "/api/reports/:reportId/view-url",
  reportLimiter,
  authenticateUser,
  async (req, res) => {
    const reportId = Number(
      req.params.reportId
    );

    if (
      !Number.isInteger(reportId) ||
      reportId <= 0
    ) {
      return res.status(400).json({
        error:
          "A valid report ID is required.",
      });
    }

    try {
      const [reports] =
        await db.execute(
          `SELECT *
           FROM medical_reports
           WHERE id = ?
             AND user_id = ?
           LIMIT 1`,
          [
            reportId,
            req.user.id,
          ]
        );

      if (reports.length === 0) {
        return res.status(404).json({
          error:
            "Report not found.",
        });
      }

      const report = reports[0];

      if (!report.storage_key) {
        return res.status(409).json({
          error:
            "This older report is still stored locally and has not been migrated to Backblaze B2.",
        });
      }

      const command =
        new GetObjectCommand({
          Bucket: B2_BUCKET,
          Key: report.storage_key,
          ResponseContentType:
            report.mime_type,
          ResponseContentDisposition:
            `inline; filename="${sanitizeFilename(
              report.original_name
            )}"`,
        });

      const signedUrl =
        await getSignedUrl(
          b2Client,
          command,
          {
            expiresIn: 300,
          }
        );

      return res.status(200).json({
        url: signedUrl,
        expiresInSeconds: 300,
      });
    } catch (error) {
      console.error(
        "Report viewing URL error:",
        error
      );

      return res.status(500).json({
        error:
          "Could not create the report viewing link.",
      });
    }
  }
);

app.post(
  "/api/reports/:reportId/share",
  reportLimiter,
  authenticateUser,
  async (req, res) => {
    const reportId = Number(
      req.params.reportId
    );

    if (
      !Number.isInteger(reportId) ||
      reportId <= 0
    ) {
      return res.status(400).json({
        error:
          "A valid report ID is required.",
      });
    }

    const requestedHours = Number(
      req.body.expiresInHours ||
        24
    );

    const expiresInHours =
      Math.min(
        Math.max(
          requestedHours,
          1
        ),
        168
      );

    try {
      const [reports] =
        await db.execute(
          `SELECT id, storage_key
           FROM medical_reports
           WHERE id = ?
             AND user_id = ?
           LIMIT 1`,
          [
            reportId,
            req.user.id,
          ]
        );

      if (reports.length === 0) {
        return res.status(404).json({
          error:
            "Report not found.",
        });
      }

      if (!reports[0].storage_key) {
        return res.status(409).json({
          error:
            "This older report has not been migrated to Backblaze B2.",
        });
      }

      await db.execute(
        `UPDATE report_share_links
         SET revoked_at = NOW()
         WHERE report_id = ?
           AND user_id = ?
           AND revoked_at IS NULL`,
        [
          reportId,
          req.user.id,
        ]
      );

      const rawShareToken =
        crypto
          .randomBytes(32)
          .toString("hex");

      const shareTokenHash =
        hashToken(
          rawShareToken
        );

      const expiresAt =
        new Date(
          Date.now() +
            expiresInHours *
              60 *
              60 *
              1000
        );

      await db.execute(
        `INSERT INTO report_share_links (
          report_id,
          user_id,
          token_hash,
          expires_at
        )
        VALUES (?, ?, ?, ?)`,
        [
          reportId,
          req.user.id,
          shareTokenHash,
          expiresAt,
        ]
      );

      const shareUrl =
        `${PUBLIC_API_URL}/api/shared-reports/` +
        encodeURIComponent(
          rawShareToken
        );

      return res.status(200).json({
        shareUrl,
        expiresAt,
      });
    } catch (error) {
      console.error(
        "Create report share link error:",
        error
      );

      return res.status(500).json({
        error:
          "Could not create the sharing link.",
      });
    }
  }
);


app.delete(
  "/api/reports/:reportId/share",
  reportLimiter,
  authenticateUser,
  async (req, res) => {
    const reportId = Number(req.params.reportId);

    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({
        error: "A valid report ID is required.",
      });
    }

    try {
      const [result] = await db.execute(
        `UPDATE report_share_links
         SET revoked_at = NOW()
         WHERE report_id = ?
           AND user_id = ?
           AND revoked_at IS NULL
           AND expires_at > NOW()`,
        [reportId, req.user.id]
      );

      return res.status(200).json({
        message:
          Number(result.affectedRows || 0) > 0
            ? "The QR sharing link was revoked."
            : "There was no active QR sharing link to revoke.",
      });
    } catch (error) {
      console.error("Revoke report share link error:", error);

      return res.status(500).json({
        error: "Could not revoke the sharing link.",
      });
    }
  }
);

app.get(
  "/api/shared-reports/:token",
  reportLimiter,
  async (req, res) => {
    const rawShareToken =
      String(
        req.params.token || ""
      );

    if (!rawShareToken) {
      return res
        .status(404)
        .send(
          "This shared report link is invalid."
        );
    }

    const shareTokenHash =
      hashToken(
        rawShareToken
      );

    try {
      const [reports] =
        await db.execute(
          `SELECT r.*
           FROM report_share_links s
           INNER JOIN medical_reports r
             ON r.id = s.report_id
           WHERE s.token_hash = ?
             AND s.revoked_at IS NULL
             AND s.expires_at > NOW()
           LIMIT 1`,
          [shareTokenHash]
        );

      if (reports.length === 0) {
        return res
          .status(404)
          .send(
            "This shared report link is invalid or has expired."
          );
      }

      const report = reports[0];

      await db.execute(
        `UPDATE report_share_links
         SET access_count = access_count + 1,
             last_accessed_at = NOW()
         WHERE token_hash = ?`,
        [shareTokenHash]
      );

      if (!report.storage_key) {
        return res
          .status(404)
          .send(
            "This report is not available in cloud storage."
          );
      }

      const command =
        new GetObjectCommand({
          Bucket: B2_BUCKET,
          Key: report.storage_key,
          ResponseContentType:
            report.mime_type,
          ResponseContentDisposition:
            `inline; filename="${sanitizeFilename(
              report.original_name
            )}"`,
        });

      const signedUrl =
        await getSignedUrl(
          b2Client,
          command,
          {
            expiresIn: 300,
          }
        );

      return res.redirect(
        signedUrl
      );
    } catch (error) {
      console.error(
        "Shared report error:",
        error
      );

      return res
        .status(500)
        .send(
          "Could not open the shared report."
        );
    }
  }
);

app.delete(
  "/api/reports/:reportId",
  reportLimiter,
  authenticateUser,
  async (req, res) => {
    const reportId = Number(
      req.params.reportId
    );

    if (
      !Number.isInteger(reportId) ||
      reportId <= 0
    ) {
      return res.status(400).json({
        error:
          "A valid report ID is required.",
      });
    }

    const connection =
      await db.getConnection();

    let transactionStarted = false;

    try {
      const [reports] =
        await connection.execute(
          `SELECT *
           FROM medical_reports
           WHERE id = ?
             AND user_id = ?
           LIMIT 1`,
          [
            reportId,
            req.user.id,
          ]
        );

      if (reports.length === 0) {
        return res.status(404).json({
          error:
            "Report not found.",
        });
      }

      const report = reports[0];

      if (report.storage_key) {
        await b2Client.send(
          new DeleteObjectCommand({
            Bucket: B2_BUCKET,
            Key:
              report.storage_key,
          })
        );
      }

      await connection.beginTransaction();
      transactionStarted = true;

      await connection.execute(
        `DELETE FROM report_share_links
         WHERE report_id = ?
           AND user_id = ?`,
        [
          reportId,
          req.user.id,
        ]
      );

      await connection.execute(
        `DELETE FROM medical_reports
         WHERE id = ?
           AND user_id = ?`,
        [
          reportId,
          req.user.id,
        ]
      );

      await connection.commit();
      transactionStarted = false;

      return res.status(200).json({
        message:
          "Report deleted successfully.",
      });
    } catch (error) {
      if (transactionStarted) {
        await connection.rollback();
      }

      console.error(
        "Delete report error:",
        error
      );

      return res.status(500).json({
        error:
          "Could not delete the report.",
      });
    } finally {
      connection.release();
    }
  }
);

app.post(
  "/api/logout",
  authenticateUser,
  async (req, res) => {
    try {
      await db.execute(
        `INSERT INTO session_logs (
          user_id,
          email_or_phone,
          event_type
        )
        VALUES (
          ?,
          'authenticated-session',
          'LOGOUT'
        )`,
        [req.user.id]
      );
    } catch (error) {
      console.error(
        "Logout logging failed:",
        error
      );
    }

    return res.status(200).json({
      message:
        "Logged out successfully.",
    });
  }
);


app.get(
  "/api/blood-donors/search",
  authenticateUser,
  async (req, res) => {
    const bloodGroup = String(req.query.bloodGroup || "")
      .trim()
      .toUpperCase();

    const allowedGroups = new Set([
      "A+", "A-", "B+", "B-",
      "AB+", "AB-", "O+", "O-",
    ]);

    if (!allowedGroups.has(bloodGroup)) {
      return res.status(400).json({
        error: "Please select a valid blood group.",
      });
    }

    const area = String(req.query.area || "")
      .trim()
      .slice(0, 120);

    try {
      let sql = `
        SELECT
          id,
          donor_name,
          blood_group_normalized,
          phone_normalized,
          phone_raw,
          location_text,
          source_name,
          source_url
        FROM public_blood_donors
        WHERE blood_group_normalized = ?
      `;

      const values = [bloodGroup];

      if (area) {
        const tokens = area
          .split(/[,;]+/)
          .map((item) => item.trim())
          .filter((item) => item.length >= 2)
          .slice(0, 4);

        if (tokens.length > 0) {
          sql += ` AND (${tokens
            .map(() => "location_text LIKE ?")
            .join(" OR ")})`;

          for (const token of tokens) {
            values.push(`%${token}%`);
          }
        }
      }

      sql += `
        ORDER BY
          CASE WHEN phone_normalized IS NULL THEN 1 ELSE 0 END,
          donor_name ASC
        LIMIT 250
      `;

      const [rows] = await db.execute(sql, values);

      return res.status(200).json({
        bloodGroup,
        area,
        count: rows.length,
        results: rows.map((row) => ({
          id: Number(row.id),
          name: row.donor_name,
          bloodGroup: row.blood_group_normalized,
          phone: row.phone_normalized || row.phone_raw || null,
          location: row.location_text || "",
          sourceName: row.source_name,
          sourceUrl: row.source_url,
          availability: "CALL_TO_CONFIRM",
        })),
      });
    } catch (error) {
      console.error("Blood donor search error:", error);

      if (error && error.code === "ER_NO_SUCH_TABLE") {
        return res.status(503).json({
          error:
            "The donor database has not been imported. Import backend/public_blood_donors.sql first.",
        });
      }

      return res.status(500).json({
        error: "Could not search the donor directory.",
      });
    }
  }
);

app.use("/api/family", require("./routes/family"));

const startServer = async () => {
  try {
    const connection =
      await db.getConnection();

    console.log(
      "Connected to MySQL successfully."
    );

    connection.release();

    await migrateLegacyPasswords();

    app.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `AmarCure backend: ${PUBLIC_API_URL}`
        );
      }
    );
  } catch (error) {
    console.error(
      "Could not start the server:",
      error
    );

    process.exit(1);
  }
};

startServer();