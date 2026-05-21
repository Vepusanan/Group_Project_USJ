import nodemailer from "nodemailer";

const getFrontendBaseUrl = () => {
  const url =
    process.env.FRONTEND_URL || process.env.BASE_URL || "http://localhost:5173";
  return url.replace(/\/+$/, "");
};

const getBackendBaseUrl = () => {
  const url =
    process.env.BASE_URL || process.env.FRONTEND_URL || "http://localhost:5000";
  return url.replace(/\/+$/, "");
};

// Use environment variables for secure configuration
const transporter = nodemailer.createTransport({
  service: "gmail", // You can use any service (e.g., 'outlook', 'sendgrid')
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${getBackendBaseUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`;

  const mailOptions = {
    from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify Your Email Address",
    html: `
      <h2>Welcome!</h2>
      <p>Thank you for registering. Please verify your email by clicking the link below:</p>
      <p><a href="${verificationLink}">Verify Email Address</a></p>
      <p>This link will expire in 24 hours.</p>
      <p>If you did not register for this account, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error);
    // In a real application, you might log the error and decide how to proceed.
    return false;
  }
};

export const sendPasswordResetEmail = async (email, token) => {
  const resetLink = `${getFrontendBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  const mailOptions = {
    from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Password Reset Request",
    html: `
            <h2>Password Reset</h2>
            <p>You requested a password reset for your account. Click the link below to reset your password:</p>
            <p><a href="${resetLink}">Reset My Password</a></p>
            <p>This link is valid for 1 hour. If you did not request this, please ignore this email.</p>
        `,
  };

  // ... (rest of transporter setup and sending logic)
  await transporter.sendMail(mailOptions);
};

export const sendPasswordChangeConfirmationEmail = async (email) => {
  const mailOptions = {
    from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Password Has Been Changed",
    html: `
            <h2>Password Changed Successfully</h2>
            <p>Your password for Startup Connect has been successfully updated.</p>
            <p>If you did not perform this action, please contact support immediately.</p>
        `,
  };

  // ... (rest of transporter setup and sending logic)
  await transporter.sendMail(mailOptions);
};

export const sendEmailChangeVerificationEmail = async (newEmail, token) => {
  const verificationLink = `${process.env.BASE_URL}/api/account/verify-email-change?token=${token}`;

  const mailOptions = {
    from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
    to: newEmail,
    subject: "Verify Your New Email Address",
    html: `
            <h2>Email Change Request</h2>
            <p>You have requested to change your email address. Please verify your new email by clicking the link below:</p>
            <p><a href="${verificationLink}">Verify New Email Address</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you did not request this change, please ignore this email and your email address will remain unchanged.</p>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email change verification sent to ${newEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending email change verification:", error);
    return false;
  }
};

export const sendEmailChangeNotificationToOldEmail = async (
  oldEmail,
  newEmail,
) => {
  const mailOptions = {
    from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
    to: oldEmail,
    subject: "Email Address Change Request",
    html: `
            <h2>Email Change Request Notification</h2>
            <p>A request has been made to change your email address to <strong>${newEmail}</strong>.</p>
            <p>A verification email has been sent to the new email address.</p>
            <p>If you did not request this change, please contact support immediately to secure your account.</p>
            <p>Your current email address will remain active until the new email is verified.</p>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email change notification sent to ${oldEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending email change notification:", error);
    return false;
  }
};

export const sendConnectionRequestEmail = async (
  recipientEmail,
  recipientName,
  requesterName,
) => {
  const link = `${getFrontendBaseUrl()}/connections`;
  const mailOptions = {
    from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `New connection request from ${requesterName}`,
    html: `
      <h2>Hi ${recipientName || "there"},</h2>
      <p>You have a new connection request from <strong>${requesterName}</strong>.</p>
      <p><a href="${link}">View pending requests</a></p>
      <p>If you do not recognize this user, you can decline the request safely from your dashboard.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Connection request email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending connection request email:", error);
    return false;
  }
};

export const sendNewMessageEmail = async (
  recipientEmail,
  recipientName,
  senderName,
  preview,
) => {
  const link = `${getFrontendBaseUrl()}/messages`;
  const safePreview = (preview || "").slice(0, 200);
  const mailOptions = {
    from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: `New message from ${senderName}`,
    html: `
      <h2>Hi ${recipientName || "there"},</h2>
      <p><strong>${senderName}</strong> sent you a new message:</p>
      ${safePreview ? `<blockquote style="border-left:3px solid #6366f1;padding-left:12px;color:#555;">${safePreview}</blockquote>` : ""}
      <p><a href="${link}">Open your inbox</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`New-message email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending new-message email:", error);
    return false;
  }
};

export const sendFailedLoginAttemptEmail = async (
  email,
  fullName,
  attempts,
  clientIp,
) => {
  const mailOptions = {
    from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Unusual sign-in activity on your account",
    html: `
      <h2>Hi ${fullName || "there"},</h2>
      <p>We noticed <strong>${attempts}</strong> recent failed sign-in attempts on your account from IP address <code>${clientIp || "unknown"}</code>.</p>
      <p>If this was you, you can ignore this notice. If it wasn't, we strongly recommend:</p>
      <ul>
        <li>Resetting your password from the forgot-password page.</li>
        <li>Reviewing your active sessions in Settings.</li>
      </ul>
      <p>For your security, your account will be temporarily locked after 5 consecutive failed attempts.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Failed-login email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending failed-login email:", error);
    return false;
  }
};

export const sendAccountDeletionConfirmationEmail = async (
  email,
  deletionDate,
) => {
  const mailOptions = {
    from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Account Deletion Scheduled",
    html: `
            <h2>Account Deletion Request</h2>
            <p>Your account deletion has been initiated. Your account will be permanently deleted on <strong>${deletionDate}</strong>.</p>
            <p>During this 30-day grace period, you can cancel the deletion by logging in to your account.</p>
            <p>If you did not request this, please log in immediately and contact support.</p>
            <p>After the grace period, all your data will be permanently removed and cannot be recovered.</p>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Account deletion confirmation sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending account deletion confirmation:", error);
    return false;
  }
};
