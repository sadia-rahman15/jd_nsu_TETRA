require("dotenv").config();

const nodemailer = require("nodemailer");

const mailTransporter =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_SECURE).toLowerCase() === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null;

const sendMail = async ({ to, subject, text, html }) => {
  if (!mailTransporter) {
    console.log("");
    console.log(`Development email to ${to} (${subject}):`);
    console.log(text);
    console.log("");

    return;
  }

  await mailTransporter.sendMail({
    from: process.env.MAIL_FROM || "AmarCure <no-reply@example.com>",
    to,
    subject,
    text,
    html,
  });
};

const sendResetEmail = async (email, resetUrl) =>
  sendMail({
    to: email,
    subject: "Reset your AmarCure password",
    text:
      `A password reset was requested for your AmarCure account.\n\n` +
      `Open this link within 20 minutes:\n${resetUrl}\n\n` +
      `Ignore this email if you did not request this change.`,
    html:
      `<h2>Reset your AmarCure password</h2>` +
      `<p>A password reset was requested for your account.</p>` +
      `<p><a href="${resetUrl}">Reset Password</a></p>` +
      `<p>This link expires in 20 minutes.</p>` +
      `<p>Ignore this email if you did not request it.</p>`,
  });

module.exports = { sendMail, sendResetEmail, mailTransporter };
