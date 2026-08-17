const express = require("express");
const crypto = require("crypto");
const path = require("path");
const rateLimit = require("express-rate-limit");
const { GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const db = require("../db");
const authenticateUser = require("../middleware/auth");
const { sendMail } = require("../mailer");
const { sendPushToUser } = require("../push");
const { b2Client, B2_BUCKET } = require("../storage");
const { FRONTEND_URL } = require("../config");

const router = express.Router();

const familyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many family-access requests. Please try again later." },
});

const emergencyCardPublicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const MAX_FAMILY_MEMBERS = 5;
const RELATIONSHIP_TYPES = new Set([
  "child",
  "parent",
  "spouse",
  "sibling",
  "guardian",
  "other",
]);
const ACCESS_LEVELS = new Set(["view_only", "manage", "emergency"]);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const hashToken = (token) =>
  crypto.createHash("sha256").update(String(token)).digest("hex");

const sanitizeFilename = (filename) => {
  const originalFilename = path.basename(String(filename || "report"));
  const sanitizedFilename = originalFilename
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 180);
  return sanitizedFilename || "report";
};

const fullName = (user) =>
  `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email;

// Fire-and-forget email notification, matching the invite email's pattern.
// Never throws, never blocks/fails the caller's request.
const sendFamilyEventEmail = ({ to, subject, heading, bodyLines }) => {
  const text = bodyLines.join("\n\n");
  const html =
    `<h3>${heading}</h3>` + bodyLines.map((line) => `<p>${line}</p>`).join("");

  sendMail({ to, subject, text, html }).catch((error) =>
    console.error(`Family event email failed (${subject}):`, error)
  );
};

// Fire-and-forget, best-effort audit log. Never fails the caller's request.
const logActivity = async ({
  ownerUserId,
  actorUserId = null,
  relationshipId = null,
  eventType,
  description,
  metadata = null,
}) => {
  try {
    await db.execute(
      `INSERT INTO family_activity_log (
        owner_user_id, actor_user_id, relationship_id, event_type, description, metadata
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        ownerUserId,
        actorUserId,
        relationshipId,
        eventType,
        description,
        metadata ? JSON.stringify(metadata) : null,
      ]
    );
  } catch (error) {
    console.error("Family activity log write failed:", error);
  }
};

const memberResponse = (row) => ({
  id: Number(row.id),
  memberUserId: Number(row.member_user_id),
  firstName: row.first_name,
  lastName: row.last_name,
  email: row.email,
  relationshipType: row.relationship_type,
  accessLevel: row.access_level,
  status: row.status,
  invitedAt: row.invited_at,
  respondedAt: row.responded_at,
});

const invitationResponse = (row) => ({
  id: Number(row.id),
  ownerUserId: Number(row.owner_user_id),
  ownerFirstName: row.first_name,
  ownerLastName: row.last_name,
  ownerEmail: row.email,
  relationshipType: row.relationship_type,
  accessLevel: row.access_level,
  invitedAt: row.invited_at,
});

const accessibleProfileResponse = (row) => ({
  relationshipId: Number(row.id),
  ownerUserId: Number(row.owner_user_id),
  ownerFirstName: row.first_name,
  ownerLastName: row.last_name,
  ownerEmail: row.email,
  relationshipType: row.relationship_type,
  accessLevel: row.access_level,
});

const profileFields = (user) => ({
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  phone: user.phone,
  heightUnit: user.height_unit,
  heightValue: user.height_value,
  weight: user.weight,
  address: user.address,
  bloodGroup: user.blood_group,
  chronicDisease: user.chronic_disease,
  otherDisease: user.other_disease,
});

const reportResponse = (report) => ({
  id: Number(report.id),
  originalName: report.original_name,
  mimeType: report.mime_type,
  fileSize: Number(report.file_size),
  createdAt: report.created_at,
});

// ---------------------------------------------------------------------
// Family members (owner's own list + invite management)
// ---------------------------------------------------------------------

router.get("/members", familyLimiter, authenticateUser, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT fr.id, fr.member_user_id, u.first_name, u.last_name, u.email,
              fr.relationship_type, fr.access_level, fr.status, fr.invited_at, fr.responded_at
       FROM family_relationships fr
       JOIN users u ON u.id = fr.member_user_id
       WHERE fr.owner_user_id = ?
       ORDER BY fr.created_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({ members: rows.map(memberResponse) });
  } catch (error) {
    console.error("Load family members error:", error);
    return res.status(500).json({ error: "Could not load family members." });
  }
});

router.post("/members", familyLimiter, authenticateUser, async (req, res) => {
  const { email, relationshipType, accessLevel } = req.body || {};
  const normalizedEmail = String(email || "").trim().toLowerCase();

  if (!emailPattern.test(normalizedEmail)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  if (!RELATIONSHIP_TYPES.has(relationshipType)) {
    return res.status(400).json({ error: "Please select a valid relationship." });
  }

  if (!ACCESS_LEVELS.has(accessLevel)) {
    return res.status(400).json({ error: "Please select a valid access level." });
  }

  try {
    const [owners] = await db.execute(
      `SELECT id, first_name, last_name, email FROM users WHERE id = ? LIMIT 1`,
      [req.user.id]
    );

    if (!owners.length) {
      return res.status(401).json({ error: "Invalid login session." });
    }

    const owner = owners[0];

    if (owner.email.toLowerCase() === normalizedEmail) {
      return res.status(400).json({ error: "You cannot invite yourself." });
    }

    const [targets] = await db.execute(
      `SELECT id, first_name, last_name, email FROM users WHERE email = ? LIMIT 1`,
      [normalizedEmail]
    );

    if (!targets.length) {
      return res.status(404).json({
        error: "No AmarCure account found with that email. Ask them to register first.",
      });
    }

    const target = targets[0];

    const [existingRows] = await db.execute(
      `SELECT id, status FROM family_relationships
       WHERE owner_user_id = ? AND member_user_id = ? LIMIT 1`,
      [req.user.id, target.id]
    );

    const existing = existingRows[0] || null;

    if (existing && (existing.status === "pending" || existing.status === "active")) {
      return res.status(409).json({ error: "This person is already a family member." });
    }

    if (!existing || existing.status === "revoked" || existing.status === "declined") {
      const [activeCountRows] = await db.execute(
        `SELECT COUNT(*) AS count FROM family_relationships
         WHERE owner_user_id = ? AND status IN ('pending','active')`,
        [req.user.id]
      );

      if (Number(activeCountRows[0].count) >= MAX_FAMILY_MEMBERS) {
        return res.status(409).json({
          error: `Maximum ${MAX_FAMILY_MEMBERS} family members allowed.`,
        });
      }
    }

    let relationshipId;

    if (existing) {
      await db.execute(
        `UPDATE family_relationships
         SET relationship_type = ?, access_level = ?, status = 'pending',
             invited_at = CURRENT_TIMESTAMP, responded_at = NULL, revoked_at = NULL
         WHERE id = ?`,
        [relationshipType, accessLevel, existing.id]
      );
      relationshipId = existing.id;
    } else {
      const [result] = await db.execute(
        `INSERT INTO family_relationships (
          owner_user_id, member_user_id, relationship_type, access_level, status
        ) VALUES (?, ?, ?, ?, 'pending')`,
        [req.user.id, target.id, relationshipType, accessLevel]
      );
      relationshipId = result.insertId;
    }

    const [memberRows] = await db.execute(
      `SELECT fr.id, fr.member_user_id, u.first_name, u.last_name, u.email,
              fr.relationship_type, fr.access_level, fr.status, fr.invited_at, fr.responded_at
       FROM family_relationships fr
       JOIN users u ON u.id = fr.member_user_id
       WHERE fr.id = ?`,
      [relationshipId]
    );

    sendMail({
      to: target.email,
      subject: `${fullName(owner)} invited you on AmarCure`,
      text:
        `${fullName(owner)} (${owner.email}) invited you to their family health access ` +
        `on AmarCure with ${accessLevel.replace("_", " ")} access. Log in to AmarCure to respond.`,
      html:
        `<p><strong>${fullName(owner)}</strong> (${owner.email}) invited you to their family ` +
        `health access on AmarCure with <strong>${accessLevel.replace("_", " ")}</strong> access.</p>` +
        `<p>Log in to AmarCure to accept or decline.</p>`,
    }).catch((error) => console.error("Family invite email failed:", error));

    sendPushToUser(target.id, {
      title: "New family invitation",
      body: `${fullName(owner)} invited you to their family health access.`,
      data: { type: "family_invite", relationshipId },
    });

    await logActivity({
      ownerUserId: req.user.id,
      actorUserId: req.user.id,
      relationshipId,
      eventType: "INVITE_SENT",
      description: `Invited ${target.email} as ${relationshipType} (${accessLevel.replace("_", " ")} access)`,
    });

    return res.status(201).json({ member: memberResponse(memberRows[0]) });
  } catch (error) {
    console.error("Send family invitation error:", error);
    return res.status(500).json({ error: "Could not send the invitation." });
  }
});

router.post(
  "/members/:relationshipId/resend",
  familyLimiter,
  authenticateUser,
  async (req, res) => {
    const relationshipId = Number(req.params.relationshipId);

    if (!Number.isInteger(relationshipId) || relationshipId <= 0) {
      return res.status(400).json({ error: "A valid relationship ID is required." });
    }

    try {
      const [rows] = await db.execute(
        `SELECT fr.id, fr.status, fr.access_level, u.id AS member_id, u.first_name, u.last_name, u.email
         FROM family_relationships fr
         JOIN users u ON u.id = fr.member_user_id
         WHERE fr.id = ? AND fr.owner_user_id = ? LIMIT 1`,
        [relationshipId, req.user.id]
      );

      if (!rows.length || rows[0].status !== "pending") {
        return res.status(404).json({ error: "Pending invitation not found." });
      }

      const [owners] = await db.execute(
        `SELECT first_name, last_name, email FROM users WHERE id = ? LIMIT 1`,
        [req.user.id]
      );

      const target = rows[0];
      const owner = owners[0];

      sendMail({
        to: target.email,
        subject: `${fullName(owner)} invited you on AmarCure`,
        text:
          `Reminder: ${fullName(owner)} (${owner.email}) invited you to their family health ` +
          `access on AmarCure with ${target.access_level.replace("_", " ")} access.`,
        html:
          `<p>Reminder: <strong>${fullName(owner)}</strong> (${owner.email}) invited you to ` +
          `their family health access on AmarCure with <strong>${target.access_level.replace("_", " ")}</strong> access.</p>`,
      }).catch((error) => console.error("Family invite resend email failed:", error));

      sendPushToUser(target.member_id, {
        title: "Family invitation reminder",
        body: `${fullName(owner)} invited you to their family health access.`,
        data: { type: "family_invite", relationshipId },
      });

      await logActivity({
        ownerUserId: req.user.id,
        actorUserId: req.user.id,
        relationshipId,
        eventType: "INVITE_SENT",
        description: `Resent invitation to ${target.email}`,
      });

      return res.status(200).json({ message: "Invitation resent." });
    } catch (error) {
      console.error("Resend family invitation error:", error);
      return res.status(500).json({ error: "Could not resend the invitation." });
    }
  }
);

router.patch("/members/:relationshipId", familyLimiter, authenticateUser, async (req, res) => {
  const relationshipId = Number(req.params.relationshipId);
  const { accessLevel } = req.body || {};

  if (!Number.isInteger(relationshipId) || relationshipId <= 0) {
    return res.status(400).json({ error: "A valid relationship ID is required." });
  }

  if (!ACCESS_LEVELS.has(accessLevel)) {
    return res.status(400).json({ error: "Please select a valid access level." });
  }

  try {
    const [rows] = await db.execute(
      `SELECT fr.id, fr.status, fr.access_level, u.id AS member_id, u.email
       FROM family_relationships fr
       JOIN users u ON u.id = fr.member_user_id
       WHERE fr.id = ? AND fr.owner_user_id = ? LIMIT 1`,
      [relationshipId, req.user.id]
    );

    if (!rows.length || !["pending", "active"].includes(rows[0].status)) {
      return res.status(404).json({ error: "Family member not found." });
    }

    const previousLevel = rows[0].access_level;

    await db.execute(`UPDATE family_relationships SET access_level = ? WHERE id = ?`, [
      accessLevel,
      relationshipId,
    ]);

    const [memberRows] = await db.execute(
      `SELECT fr.id, fr.member_user_id, u.first_name, u.last_name, u.email,
              fr.relationship_type, fr.access_level, fr.status, fr.invited_at, fr.responded_at
       FROM family_relationships fr
       JOIN users u ON u.id = fr.member_user_id
       WHERE fr.id = ?`,
      [relationshipId]
    );

    sendPushToUser(rows[0].member_id, {
      title: "Family access level updated",
      body: `Your access level was changed to ${accessLevel.replace("_", " ")}.`,
      data: { type: "family_access_updated", relationshipId },
    });

    sendFamilyEventEmail({
      to: rows[0].email,
      subject: "Your AmarCure family access level was updated",
      heading: "Access level updated",
      bodyLines: [
        `Your access level was changed from ${previousLevel.replace("_", " ")} to ${accessLevel.replace("_", " ")}.`,
        "Log in to AmarCure to see what this now lets you view or manage.",
      ],
    });

    await logActivity({
      ownerUserId: req.user.id,
      actorUserId: req.user.id,
      relationshipId,
      eventType: "ACCESS_LEVEL_CHANGED",
      description: `Changed ${rows[0].email}'s access level from ${previousLevel} to ${accessLevel}`,
      metadata: { previousLevel, newLevel: accessLevel },
    });

    return res.status(200).json({ member: memberResponse(memberRows[0]) });
  } catch (error) {
    console.error("Update family access level error:", error);
    return res.status(500).json({ error: "Could not update the access level." });
  }
});

router.delete("/members/:relationshipId", familyLimiter, authenticateUser, async (req, res) => {
  const relationshipId = Number(req.params.relationshipId);

  if (!Number.isInteger(relationshipId) || relationshipId <= 0) {
    return res.status(400).json({ error: "A valid relationship ID is required." });
  }

  try {
    const [rows] = await db.execute(
      `SELECT fr.id, fr.status, u.id AS member_id, u.email
       FROM family_relationships fr
       JOIN users u ON u.id = fr.member_user_id
       WHERE fr.id = ? AND fr.owner_user_id = ? LIMIT 1`,
      [relationshipId, req.user.id]
    );

    if (!rows.length || !["pending", "active"].includes(rows[0].status)) {
      return res.status(404).json({ error: "Family member not found." });
    }

    await db.execute(
      `UPDATE family_relationships SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [relationshipId]
    );

    sendPushToUser(rows[0].member_id, {
      title: "Family access removed",
      body: "Your access to a family member's health profile was removed.",
      data: { type: "family_access_removed", relationshipId },
    });

    sendFamilyEventEmail({
      to: rows[0].email,
      subject: "Your AmarCure family access was removed",
      heading: "Access removed",
      bodyLines: ["Your access to a family member's health profile on AmarCure was removed."],
    });

    await logActivity({
      ownerUserId: req.user.id,
      actorUserId: req.user.id,
      relationshipId,
      eventType: "MEMBER_REMOVED",
      description: `Removed ${rows[0].email} from family access`,
    });

    return res.status(200).json({ message: "Family member removed." });
  } catch (error) {
    console.error("Remove family member error:", error);
    return res.status(500).json({ error: "Could not remove the family member." });
  }
});

// ---------------------------------------------------------------------
// Invitations received + accessible profiles
// ---------------------------------------------------------------------

router.get("/invitations", familyLimiter, authenticateUser, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT fr.id, fr.owner_user_id, u.first_name, u.last_name, u.email,
              fr.relationship_type, fr.access_level, fr.invited_at
       FROM family_relationships fr
       JOIN users u ON u.id = fr.owner_user_id
       WHERE fr.member_user_id = ? AND fr.status = 'pending'
       ORDER BY fr.invited_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({ invitations: rows.map(invitationResponse) });
  } catch (error) {
    console.error("Load family invitations error:", error);
    return res.status(500).json({ error: "Could not load invitations." });
  }
});

router.post(
  "/invitations/:relationshipId/accept",
  familyLimiter,
  authenticateUser,
  async (req, res) => {
    const relationshipId = Number(req.params.relationshipId);

    try {
      const [rows] = await db.execute(
        `SELECT id, owner_user_id, status FROM family_relationships
         WHERE id = ? AND member_user_id = ? LIMIT 1`,
        [relationshipId, req.user.id]
      );

      if (!rows.length || rows[0].status !== "pending") {
        return res.status(404).json({ error: "Invitation not found." });
      }

      await db.execute(
        `UPDATE family_relationships SET status = 'active', responded_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [relationshipId]
      );

      const [members] = await db.execute(
        `SELECT first_name, last_name, email FROM users WHERE id = ? LIMIT 1`,
        [req.user.id]
      );

      const [owners] = await db.execute(
        `SELECT email FROM users WHERE id = ? LIMIT 1`,
        [rows[0].owner_user_id]
      );

      sendPushToUser(rows[0].owner_user_id, {
        title: "Family invitation accepted",
        body: `${fullName(members[0])} accepted your family invitation.`,
        data: { type: "family_invite_accepted", relationshipId },
      });

      if (owners.length) {
        sendFamilyEventEmail({
          to: owners[0].email,
          subject: "Your AmarCure family invitation was accepted",
          heading: "Invitation accepted",
          bodyLines: [`${fullName(members[0])} accepted your family invitation.`],
        });
      }

      await logActivity({
        ownerUserId: rows[0].owner_user_id,
        actorUserId: req.user.id,
        relationshipId,
        eventType: "INVITE_ACCEPTED",
        description: `${fullName(members[0])} accepted the family invitation`,
      });

      return res.status(200).json({ message: "Invitation accepted." });
    } catch (error) {
      console.error("Accept family invitation error:", error);
      return res.status(500).json({ error: "Could not accept the invitation." });
    }
  }
);

router.post(
  "/invitations/:relationshipId/decline",
  familyLimiter,
  authenticateUser,
  async (req, res) => {
    const relationshipId = Number(req.params.relationshipId);

    try {
      const [rows] = await db.execute(
        `SELECT id, owner_user_id, status FROM family_relationships
         WHERE id = ? AND member_user_id = ? LIMIT 1`,
        [relationshipId, req.user.id]
      );

      if (!rows.length || rows[0].status !== "pending") {
        return res.status(404).json({ error: "Invitation not found." });
      }

      await db.execute(
        `UPDATE family_relationships SET status = 'declined', responded_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [relationshipId]
      );

      const [members] = await db.execute(
        `SELECT first_name, last_name, email FROM users WHERE id = ? LIMIT 1`,
        [req.user.id]
      );

      const [owners] = await db.execute(
        `SELECT email FROM users WHERE id = ? LIMIT 1`,
        [rows[0].owner_user_id]
      );

      sendPushToUser(rows[0].owner_user_id, {
        title: "Family invitation declined",
        body: `${fullName(members[0])} declined your family invitation.`,
        data: { type: "family_invite_declined", relationshipId },
      });

      if (owners.length) {
        sendFamilyEventEmail({
          to: owners[0].email,
          subject: "Your AmarCure family invitation was declined",
          heading: "Invitation declined",
          bodyLines: [`${fullName(members[0])} declined your family invitation.`],
        });
      }

      await logActivity({
        ownerUserId: rows[0].owner_user_id,
        actorUserId: req.user.id,
        relationshipId,
        eventType: "INVITE_DECLINED",
        description: `${fullName(members[0])} declined the family invitation`,
      });

      return res.status(200).json({ message: "Invitation declined." });
    } catch (error) {
      console.error("Decline family invitation error:", error);
      return res.status(500).json({ error: "Could not decline the invitation." });
    }
  }
);

router.get("/accessible-profiles", familyLimiter, authenticateUser, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT fr.id, fr.owner_user_id, u.first_name, u.last_name, u.email,
              fr.relationship_type, fr.access_level
       FROM family_relationships fr
       JOIN users u ON u.id = fr.owner_user_id
       WHERE fr.member_user_id = ? AND fr.status = 'active'
       ORDER BY fr.responded_at DESC`,
      [req.user.id]
    );

    return res.status(200).json({ profiles: rows.map(accessibleProfileResponse) });
  } catch (error) {
    console.error("Load accessible profiles error:", error);
    return res.status(500).json({ error: "Could not load accessible profiles." });
  }
});

// ---------------------------------------------------------------------
// Profile view / edit
// ---------------------------------------------------------------------

router.get("/profile/:relationshipId", familyLimiter, authenticateUser, async (req, res) => {
  const relationshipId = Number(req.params.relationshipId);

  try {
    const [rows] = await db.execute(
      `SELECT id, owner_user_id, access_level FROM family_relationships
       WHERE id = ? AND member_user_id = ? AND status = 'active' LIMIT 1`,
      [relationshipId, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Profile not found or access not active." });
    }

    const relationship = rows[0];

    const [owners] = await db.execute(`SELECT * FROM users WHERE id = ? LIMIT 1`, [
      relationship.owner_user_id,
    ]);

    if (!owners.length) {
      return res.status(404).json({ error: "Profile not found." });
    }

    await logActivity({
      ownerUserId: relationship.owner_user_id,
      actorUserId: req.user.id,
      relationshipId,
      eventType: "PROFILE_VIEWED",
      description: "Viewed the health profile",
    });

    return res.status(200).json({
      profile: {
        relationshipId,
        accessLevel: relationship.access_level,
        ownerUserId: Number(relationship.owner_user_id),
        ...profileFields(owners[0]),
      },
    });
  } catch (error) {
    console.error("Load family profile error:", error);
    return res.status(500).json({ error: "Could not load the profile." });
  }
});

const EDITABLE_PROFILE_FIELDS = {
  phone: "phone",
  heightUnit: "height_unit",
  heightValue: "height_value",
  weight: "weight",
  address: "address",
  bloodGroup: "blood_group",
  chronicDisease: "chronic_disease",
  otherDisease: "other_disease",
};

router.put("/profile/:relationshipId", familyLimiter, authenticateUser, async (req, res) => {
  const relationshipId = Number(req.params.relationshipId);

  try {
    const [rows] = await db.execute(
      `SELECT id, owner_user_id, access_level FROM family_relationships
       WHERE id = ? AND member_user_id = ? AND status = 'active' LIMIT 1`,
      [relationshipId, req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Profile not found or access not active." });
    }

    const relationship = rows[0];

    if (relationship.access_level !== "manage") {
      return res.status(403).json({ error: "You do not have permission to edit this profile." });
    }

    const updates = [];
    const values = [];
    const changedFields = [];

    for (const [bodyKey, column] of Object.entries(EDITABLE_PROFILE_FIELDS)) {
      if (Object.prototype.hasOwnProperty.call(req.body || {}, bodyKey)) {
        const value = String(req.body[bodyKey] ?? "").trim();

        if (!value) {
          return res.status(400).json({ error: "Fields cannot be left empty." });
        }

        updates.push(`${column} = ?`);
        values.push(value);
        changedFields.push(bodyKey);
      }
    }

    if (!updates.length) {
      return res.status(400).json({ error: "No fields to update were provided." });
    }

    values.push(relationship.owner_user_id);

    await db.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, values);

    const [owners] = await db.execute(`SELECT * FROM users WHERE id = ? LIMIT 1`, [
      relationship.owner_user_id,
    ]);

    sendPushToUser(relationship.owner_user_id, {
      title: "Your health profile was updated",
      body: "A family member updated your health information.",
      data: { type: "family_profile_updated", relationshipId },
    });

    sendFamilyEventEmail({
      to: owners[0].email,
      subject: "Your AmarCure health profile was updated",
      heading: "Profile updated",
      bodyLines: [
        "A family member with Manage access updated your health information.",
        `Fields changed: ${changedFields.join(", ")}.`,
      ],
    });

    await logActivity({
      ownerUserId: relationship.owner_user_id,
      actorUserId: req.user.id,
      relationshipId,
      eventType: "PROFILE_UPDATED",
      description: "Updated the health profile",
      metadata: { changedFields },
    });

    return res.status(200).json({
      profile: {
        relationshipId,
        accessLevel: relationship.access_level,
        ownerUserId: Number(relationship.owner_user_id),
        ...profileFields(owners[0]),
      },
    });
  } catch (error) {
    console.error("Update family profile error:", error);
    return res.status(500).json({ error: "Could not update the profile." });
  }
});

// ---------------------------------------------------------------------
// Emergency access (no live approval — must already hold 'emergency' level)
// ---------------------------------------------------------------------

router.get("/emergency/:ownerUserId", familyLimiter, authenticateUser, async (req, res) => {
  const ownerUserId = Number(req.params.ownerUserId);

  if (!Number.isInteger(ownerUserId) || ownerUserId <= 0) {
    return res.status(400).json({ error: "A valid owner ID is required." });
  }

  try {
    const [rows] = await db.execute(
      `SELECT id FROM family_relationships
       WHERE owner_user_id = ? AND member_user_id = ? AND status = 'active' AND access_level = 'emergency'
       LIMIT 1`,
      [ownerUserId, req.user.id]
    );

    if (!rows.length) {
      return res.status(403).json({ error: "You do not have emergency access to this profile." });
    }

    const relationshipId = rows[0].id;

    const [owners] = await db.execute(
      `SELECT first_name, last_name, email, blood_group, chronic_disease, other_disease, phone, address
       FROM users WHERE id = ? LIMIT 1`,
      [ownerUserId]
    );

    if (!owners.length) {
      return res.status(404).json({ error: "Profile not found." });
    }

    const owner = owners[0];

    const [members] = await db.execute(
      `SELECT first_name, last_name, email FROM users WHERE id = ? LIMIT 1`,
      [req.user.id]
    );

    // Always logged, never suppressed or throttled — this is the audit trail
    // that substitutes for a live approval step.
    await logActivity({
      ownerUserId,
      actorUserId: req.user.id,
      relationshipId,
      eventType: "EMERGENCY_ACCESS_USED",
      description: `${fullName(members[0])} used emergency access`,
    });

    sendPushToUser(ownerUserId, {
      title: "Emergency access used",
      body: `${fullName(members[0])} just viewed your emergency health information.`,
      data: { type: "family_emergency_access", relationshipId },
    });

    sendFamilyEventEmail({
      to: owner.email,
      subject: "Emergency access was used on your AmarCure account",
      heading: "Emergency access used",
      bodyLines: [
        `${fullName(members[0])} just used their emergency access to view your critical health information (blood group, conditions, phone, address).`,
        `This happened at ${new Date().toLocaleString()} and has been recorded in your family activity log.`,
      ],
    });

    return res.status(200).json({
      profile: {
        firstName: owner.first_name,
        lastName: owner.last_name,
        bloodGroup: owner.blood_group,
        chronicDisease: owner.chronic_disease,
        otherDisease: owner.other_disease,
        phone: owner.phone,
        address: owner.address,
      },
      accessedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Emergency access error:", error);
    return res.status(500).json({ error: "Could not load emergency information." });
  }
});

// ---------------------------------------------------------------------
// Activity log
// ---------------------------------------------------------------------

router.get("/activity", familyLimiter, authenticateUser, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, owner_user_id, actor_user_id, event_type, description, created_at
       FROM family_activity_log
       WHERE owner_user_id = ? OR actor_user_id = ?
       ORDER BY created_at DESC
       LIMIT 100`,
      [req.user.id, req.user.id]
    );

    return res.status(200).json({
      activity: rows.map((row) => ({
        id: Number(row.id),
        eventType: row.event_type,
        description: row.description,
        createdAt: row.created_at,
        ownerUserId: Number(row.owner_user_id),
        actorUserId: row.actor_user_id ? Number(row.actor_user_id) : null,
      })),
    });
  } catch (error) {
    console.error("Load family activity error:", error);
    return res.status(500).json({ error: "Could not load activity." });
  }
});

// ---------------------------------------------------------------------
// Emergency QR card (public, token-gated)
// ---------------------------------------------------------------------

router.post("/emergency-card", familyLimiter, authenticateUser, async (req, res) => {
  const requestedDays = Number(req.body?.expiresInDays);
  const expiresInDays = Number.isFinite(requestedDays)
    ? Math.min(365, Math.max(1, Math.round(requestedDays)))
    : 90;

  try {
    await db.execute(
      `UPDATE emergency_card_tokens SET revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND revoked_at IS NULL`,
      [req.user.id]
    );

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await db.execute(
      `INSERT INTO emergency_card_tokens (user_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [req.user.id, tokenHash, expiresAt]
    );

    await logActivity({
      ownerUserId: req.user.id,
      actorUserId: req.user.id,
      eventType: "QR_CARD_GENERATED",
      description: "Generated a new emergency QR card",
    });

    return res.status(201).json({
      cardUrl: `${FRONTEND_URL}/emergency/${rawToken}`,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error("Generate emergency card error:", error);
    return res.status(500).json({ error: "Could not generate the emergency card." });
  }
});

router.delete("/emergency-card", familyLimiter, authenticateUser, async (req, res) => {
  try {
    await db.execute(
      `UPDATE emergency_card_tokens SET revoked_at = CURRENT_TIMESTAMP
       WHERE user_id = ? AND revoked_at IS NULL`,
      [req.user.id]
    );

    await logActivity({
      ownerUserId: req.user.id,
      actorUserId: req.user.id,
      eventType: "QR_CARD_REVOKED",
      description: "Revoked the emergency QR card",
    });

    return res.status(200).json({ message: "Emergency card revoked." });
  } catch (error) {
    console.error("Revoke emergency card error:", error);
    return res.status(500).json({ error: "Could not revoke the emergency card." });
  }
});

router.get("/emergency-card/:token", emergencyCardPublicLimiter, async (req, res) => {
  const tokenHash = hashToken(req.params.token);

  try {
    const [rows] = await db.execute(
      `SELECT id, user_id, expires_at, revoked_at FROM emergency_card_tokens
       WHERE token_hash = ? LIMIT 1`,
      [tokenHash]
    );

    if (
      !rows.length ||
      rows[0].revoked_at !== null ||
      new Date(rows[0].expires_at).getTime() <= Date.now()
    ) {
      return res.status(404).json({ error: "This emergency card link is invalid or has expired." });
    }

    const cardToken = rows[0];

    const [owners] = await db.execute(
      `SELECT first_name, last_name, blood_group, chronic_disease, other_disease, phone
       FROM users WHERE id = ? LIMIT 1`,
      [cardToken.user_id]
    );

    if (!owners.length) {
      return res.status(404).json({ error: "This emergency card link is invalid or has expired." });
    }

    await db.execute(
      `UPDATE emergency_card_tokens
       SET access_count = access_count + 1, last_accessed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [cardToken.id]
    );

    await logActivity({
      ownerUserId: cardToken.user_id,
      actorUserId: null,
      eventType: "QR_CARD_SCANNED",
      description: "Emergency QR card was scanned",
    });

    const owner = owners[0];

    return res.status(200).json({
      card: {
        firstName: owner.first_name,
        lastName: owner.last_name,
        bloodGroup: owner.blood_group,
        chronicDisease: owner.chronic_disease,
        otherDisease: owner.other_disease,
        phone: owner.phone,
      },
    });
  } catch (error) {
    console.error("Read emergency card error:", error);
    return res.status(500).json({ error: "Could not load the emergency card." });
  }
});

// ---------------------------------------------------------------------
// Push token registration
// ---------------------------------------------------------------------

router.post("/push-token", familyLimiter, authenticateUser, async (req, res) => {
  const { expoPushToken, deviceInfo } = req.body || {};

  if (
    typeof expoPushToken !== "string" ||
    !/^Expo(nent)?PushToken\[.+\]$/.test(expoPushToken.trim())
  ) {
    return res.status(400).json({ error: "A valid Expo push token is required." });
  }

  try {
    await db.execute(
      `INSERT INTO device_push_tokens (user_id, expo_push_token, device_info)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE
         user_id = VALUES(user_id),
         device_info = VALUES(device_info),
         last_seen_at = CURRENT_TIMESTAMP`,
      [req.user.id, expoPushToken.trim(), deviceInfo ? String(deviceInfo).slice(0, 255) : null]
    );

    return res.status(200).json({ message: "Push token registered." });
  } catch (error) {
    console.error("Register push token error:", error);
    return res.status(500).json({ error: "Could not register the push token." });
  }
});

// ---------------------------------------------------------------------
// Shared medical reports (manage-level access only, coarse — all reports)
// ---------------------------------------------------------------------

const requireManageAccess = async (ownerUserId, memberUserId) => {
  const [rows] = await db.execute(
    `SELECT id FROM family_relationships
     WHERE owner_user_id = ? AND member_user_id = ? AND status = 'active' AND access_level = 'manage'
     LIMIT 1`,
    [ownerUserId, memberUserId]
  );

  return rows[0] || null;
};

router.get("/reports/:ownerUserId", familyLimiter, authenticateUser, async (req, res) => {
  const ownerUserId = Number(req.params.ownerUserId);

  if (!Number.isInteger(ownerUserId) || ownerUserId <= 0) {
    return res.status(400).json({ error: "A valid owner ID is required." });
  }

  try {
    const relationship = await requireManageAccess(ownerUserId, req.user.id);

    if (!relationship) {
      return res.status(403).json({ error: "You do not have access to this family member's reports." });
    }

    const [reports] = await db.execute(
      `SELECT * FROM medical_reports WHERE user_id = ? ORDER BY created_at DESC`,
      [ownerUserId]
    );

    return res.status(200).json({ reports: reports.map(reportResponse) });
  } catch (error) {
    console.error("Load family reports error:", error);
    return res.status(500).json({ error: "Could not load reports." });
  }
});

router.post(
  "/reports/:ownerUserId/:reportId/view-url",
  familyLimiter,
  authenticateUser,
  async (req, res) => {
    const ownerUserId = Number(req.params.ownerUserId);
    const reportId = Number(req.params.reportId);

    if (
      !Number.isInteger(ownerUserId) ||
      ownerUserId <= 0 ||
      !Number.isInteger(reportId) ||
      reportId <= 0
    ) {
      return res.status(400).json({ error: "A valid owner ID and report ID are required." });
    }

    try {
      const relationship = await requireManageAccess(ownerUserId, req.user.id);

      if (!relationship) {
        return res.status(403).json({ error: "You do not have access to this family member's reports." });
      }

      const [reports] = await db.execute(
        `SELECT * FROM medical_reports WHERE id = ? AND user_id = ? LIMIT 1`,
        [reportId, ownerUserId]
      );

      if (!reports.length) {
        return res.status(404).json({ error: "Report not found." });
      }

      const report = reports[0];

      if (!report.storage_key) {
        return res.status(409).json({
          error: "This older report is still stored locally and has not been migrated to Backblaze B2.",
        });
      }

      const command = new GetObjectCommand({
        Bucket: B2_BUCKET,
        Key: report.storage_key,
        ResponseContentType: report.mime_type,
        ResponseContentDisposition: `inline; filename="${sanitizeFilename(report.original_name)}"`,
      });

      const signedUrl = await getSignedUrl(b2Client, command, { expiresIn: 300 });

      await logActivity({
        ownerUserId,
        actorUserId: req.user.id,
        relationshipId: relationship.id,
        eventType: "REPORT_VIEWED",
        description: `Viewed a shared medical report (${report.original_name})`,
      });

      return res.status(200).json({ url: signedUrl, expiresInSeconds: 300 });
    } catch (error) {
      console.error("Family report viewing URL error:", error);
      return res.status(500).json({ error: "Could not create the report viewing link." });
    }
  }
);

module.exports = router;
