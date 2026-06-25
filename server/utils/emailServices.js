import nodemailer from "nodemailer";
import {
  createEmailTransporter,
  getEmailFromAddress,
  hasEmailCredentials,
} from "./emailTransport.js";
import { buildVerifyEmailCallbackUrl, getBackendBaseUrl, getFrontendBaseUrl } from "./appUrls.js";

export { getFrontendBaseUrl } from "./appUrls.js";

const isDev = process.env.NODE_ENV === "development";
const devLogOnly = process.env.EMAIL_DEV_LOG_ONLY === "true";

const transporter = createEmailTransporter();
const emailFrom = () => `"Startup Connect" <${getEmailFromAddress()}>`;

const buildVerificationLink = (token) => buildVerifyEmailCallbackUrl(token);

const logDevVerificationLink = (email, link) => {
  if (!isDev) return;
  console.log(
    `\n📧 Verification link for ${email} (copy from server terminal if email did not arrive):\n${link}\n`,
  );
};

export const sendVerificationEmail = async (email, token) => {
  const verificationLink = buildVerificationLink(token);
  logDevVerificationLink(email, verificationLink);

  if (devLogOnly) {
    console.log("EMAIL_DEV_LOG_ONLY=true — skipping SMTP send.");
    return true;
  }

  if (!hasEmailCredentials()) {
    console.error(
      "Email credentials missing — set EMAIL_SMTP_* (Brevo) or EMAIL_USER + EMAIL_PASS in server/.env",
    );
    return isDev;
  }

  const mailOptions = {
    from: emailFrom(),
    to: email,
    subject: "Verify Your Email Address",
    html: `
      <h2>Welcome!</h2>
      <p>Thank you for registering. Please verify your email by clicking the link below:</p>
      <p><a href="${verificationLink}">Verify Email Address</a></p>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not register for this account, please ignore this email.</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${email}`);
    return true;
  } catch (error) {
    console.error("Error sending verification email:", error.message);
    if (error.code === "EAUTH") {
      console.error(
        "Gmail rejected the login. Use a Google App Password (not your normal password) in EMAIL_PASS.",
      );
    }
    // In development, registration can continue — link is printed above.
    return isDev;
  }
};

export const sendPasswordResetEmail = async (email, token) => {
  const resetLink = `${getFrontendBaseUrl()}/reset-password?token=${encodeURIComponent(token)}`;

  const mailOptions = {
    from: emailFrom(),
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
    from: emailFrom(),
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
    from: emailFrom(),
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
    from: emailFrom(),
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
  {
    requesterName,
    requesterPhotoUrl = null,
    profileUrl = null,
    message = null,
  } = {},
) => {
  const connectionsLink = `${getFrontendBaseUrl()}/connections`;
  const profileLink = profileUrl || connectionsLink;
  const safeMessage = (message || "").trim().slice(0, 300);
  const photoBlock = requesterPhotoUrl
    ? `<p><img src="${requesterPhotoUrl}" alt="${requesterName || "User"}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;" /></p>`
    : "";

  const mailOptions = {
    from: emailFrom(),
    to: recipientEmail,
    subject: `New connection request from ${requesterName || "a user"}`,
    html: `
      <h2>Hi ${recipientName || "there"},</h2>
      ${photoBlock}
      <p>You have a new connection request from <strong>${requesterName || "a user"}</strong>.</p>
      ${safeMessage ? `<blockquote style="border-left:3px solid #6366f1;padding-left:12px;color:#555;font-style:italic;">${safeMessage}</blockquote>` : ""}
      <p><a href="${profileLink}">View their profile</a> · <a href="${connectionsLink}">Review pending requests</a></p>
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

export const sendDataRoomAccessGrantedEmail = async (
  recipientEmail,
  recipientName,
  {
    companyName,
    dataRoomUrl = null,
    profileUrl = null,
  } = {},
) => {
  const roomLink = dataRoomUrl || `${getFrontendBaseUrl()}/startups`;
  const startupLink = profileUrl || roomLink;

  const mailOptions = {
    from: emailFrom(),
    to: recipientEmail,
    subject: `${companyName || "A startup"} granted you data room access`,
    html: `
      <h2>Hi ${recipientName || "there"},</h2>
      <p><strong>${companyName || "A startup"}</strong> has granted you access to their private data room.</p>
      <p>You can review confidential due diligence documents shared with connected investors.</p>
      <p><a href="${roomLink}">Open data room</a> · <a href="${startupLink}">View startup profile</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Data room access email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending data room access email:", error);
    return false;
  }
};

export const sendDdChecklistSharedEmail = async (
  recipientEmail,
  recipientName,
  {
    investorName,
    connectionsUrl = null,
  } = {},
) => {
  const link = connectionsUrl || `${getFrontendBaseUrl()}/connections`;

  const mailOptions = {
    from: emailFrom(),
    to: recipientEmail,
    subject: `${investorName || "An investor"} shared a due diligence checklist`,
    html: `
      <h2>Hi ${recipientName || "there"},</h2>
      <p><strong>${investorName || "An investor"}</strong> has shared a due diligence checklist with you.</p>
      <p>Review each item and upload documents or link files from your data room to fulfil the requests.</p>
      <p><a href="${link}">Open connections</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`DD checklist shared email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending DD checklist shared email:", error);
    return false;
  }
};

export const sendDdChecklistResponseEmail = async (
  recipientEmail,
  recipientName,
  {
    companyName,
    itemDescription,
    connectionsUrl = null,
  } = {},
) => {
  const link = connectionsUrl || `${getFrontendBaseUrl()}/connections`;

  const mailOptions = {
    from: emailFrom(),
    to: recipientEmail,
    subject: `${companyName || "A startup"} responded to a due diligence item`,
    html: `
      <h2>Hi ${recipientName || "there"},</h2>
      <p><strong>${companyName || "A startup"}</strong> submitted a response for a due diligence checklist item.</p>
      ${itemDescription ? `<p><em>${itemDescription}</em></p>` : ""}
      <p>Review the submission and update the item status when satisfied.</p>
      <p><a href="${link}">Open connections</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`DD checklist response email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending DD checklist response email:", error);
    return false;
  }
};

export const sendConnectionAcceptedEmail = async (
  recipientEmail,
  recipientName,
  {
    otherPartyName,
    profileUrl = null,
  } = {},
) => {
  const connectionsLink = `${getFrontendBaseUrl()}/connections`;
  const profileLink = profileUrl || connectionsLink;

  const mailOptions = {
    from: emailFrom(),
    to: recipientEmail,
    subject: `You are now connected with ${otherPartyName || "a user"}`,
    html: `
      <h2>Hi ${recipientName || "there"},</h2>
      <p>Your connection with <strong>${otherPartyName || "a user"}</strong> is now active.</p>
      <p>You can message each other and access private profile sections.</p>
      <p><a href="${profileLink}">View their profile</a> · <a href="${connectionsLink}">Open My Connections</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Connection accepted email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error("Error sending connection accepted email:", error);
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
    from: emailFrom(),
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
    from: emailFrom(),
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

export const sendVerificationDecisionEmail = async ({
  email,
  fullName,
  approved,
  tier,
  rejectionReason = null,
}) => {
  const subject = approved
    ? `Your ${tier === "BUSINESS_VERIFIED" ? "Business" : "Identity"} verification was approved`
    : "Your verification request was not approved";

  const body = approved
    ? `<p>Congratulations! Your account has been upgraded to <strong>${tier === "BUSINESS_VERIFIED" ? "Business Verified" : "Identity Verified"}</strong> status.</p>`
    : `<p>Your verification request could not be approved at this time.</p>
       ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ""}
       <p>You may update your submission and resubmit from Settings.</p>`;

  const mailOptions = {
    from: emailFrom(),
    to: email,
    subject,
    html: `<h2>Hi ${fullName || "there"},</h2>${body}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending verification decision email:", error);
    return false;
  }
};

export const sendInactiveAccountNoticeEmail = async ({ email, fullName }) => {
  const mailOptions = {
    from: emailFrom(),
    to: email,
    subject: "Action required: your Startup Connect account may be removed",
    html: `
      <h2>Hi ${fullName || "there"},</h2>
      <p>Your Startup Connect account has been inactive for more than 90 days.</p>
      <p>Because your account is still <strong>Unverified</strong>, it will be permanently removed in <strong>7 days</strong> unless you sign in and take any meaningful action on the platform.</p>
      <p><a href="${getFrontendBaseUrl()}/login">Sign in to keep your account</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending inactive account notice:", error);
    return false;
  }
};

export const sendMilestonePublishedEmail = async ({
  email,
  fullName,
  companyName,
  headline,
}) => {
  const link = `${getFrontendBaseUrl()}/startups`;
  const mailOptions = {
    from: emailFrom(),
    to: email,
    subject: `${companyName || "A startup"} published a milestone update`,
    html: `
      <h2>Hi ${fullName || "there"},</h2>
      <p><strong>${companyName || "A startup"}</strong> you are connected with shared a milestone:</p>
      <p><strong>${headline}</strong></p>
      <p><a href="${link}">View on StartHub</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending milestone email:", error);
    return false;
  }
};

const MEETING_FORMAT_LABELS = {
  VIDEO_CALL: "Video call",
  PHONE_CALL: "Phone call",
  IN_PERSON: "In person",
};

export const sendMeetingRequestEmail = async ({
  email,
  fullName,
  requesterName,
  proposedAt,
  format,
  agenda,
  message = null,
  connectionsUrl = null,
}) => {
  const link = connectionsUrl || `${getFrontendBaseUrl()}/connections`;
  const when = new Date(proposedAt).toLocaleString();
  const formatLabel = MEETING_FORMAT_LABELS[format] || format;
  const messageBlock = message
    ? `<p><strong>Message:</strong> ${message}</p>`
    : "";
  const mailOptions = {
    from: emailFrom(),
    to: email,
    subject: `Meeting request from ${requesterName}`,
    html: `
      <h2>Hi ${fullName || "there"},</h2>
      <p><strong>${requesterName}</strong> requested a meeting:</p>
      <ul>
        <li><strong>When:</strong> ${when}</li>
        <li><strong>Format:</strong> ${formatLabel}</li>
        <li><strong>Agenda:</strong> ${agenda}</li>
      </ul>
      ${messageBlock}
      <p><a href="${link}">Review and respond in Connections</a></p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending meeting request email:", error);
    return false;
  }
};

export const sendMeetingConfirmationEmail = async ({
  email,
  fullName,
  proposedAt,
  format,
  agenda,
  message = null,
  accepted,
  connectionsUrl = null,
}) => {
  const link = connectionsUrl || `${getFrontendBaseUrl()}/connections`;
  const when = new Date(proposedAt).toLocaleString();
  const formatLabel = MEETING_FORMAT_LABELS[format] || format;
  const messageBlock = message
    ? `<li><strong>Message:</strong> ${message}</li>`
    : "";
  const mailOptions = {
    from: emailFrom(),
    to: email,
    subject: accepted ? "Meeting confirmed" : "Meeting request declined",
    html: accepted
      ? `<h2>Hi ${fullName || "there"},</h2>
         <p>Your meeting has been confirmed:</p>
         <ul>
           <li><strong>When:</strong> ${when}</li>
           <li><strong>Format:</strong> ${formatLabel}</li>
           <li><strong>Agenda:</strong> ${agenda}</li>
           ${messageBlock}
         </ul>
         <p>Open Connections → Meetings to download a calendar file for your preferred calendar app.</p>
         <p><a href="${link}">View meeting in Connections</a></p>`
      : `<h2>Hi ${fullName || "there"},</h2>
         <p>A meeting request was declined.</p>
         <p><a href="${link}">Open Connections</a> to schedule another time.</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error("Error sending meeting confirmation email:", error);
    return false;
  }
};

export const sendAccountDeletionConfirmationEmail = async (
  email,
  deletionDate,
) => {
  const mailOptions = {
    from: emailFrom(),
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
