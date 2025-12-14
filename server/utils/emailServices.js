

import nodemailer from 'nodemailer';

// Use environment variables for secure configuration
const transporter = nodemailer.createTransport({
  service: 'gmail', // You can use any service (e.g., 'outlook', 'sendgrid')
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendVerificationEmail = async (email, token) => {
  const verificationLink = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Verify Your Email Address',
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
    console.error('Error sending verification email:', error);
    // In a real application, you might log the error and decide how to proceed.
    return false;
  }
};

export const sendPasswordResetEmail = async (email, token) => {
    // Note: The token is often sent raw here, and a link is formed.
    const resetLink = `${process.env.BASE_URL}/reset-password?token=${token}`; 

    const mailOptions = {
        from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset Request',
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
        subject: 'Your Password Has Been Changed',
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
        subject: 'Verify Your New Email Address',
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
        console.error('Error sending email change verification:', error);
        return false;
    }
};

export const sendEmailChangeNotificationToOldEmail = async (oldEmail, newEmail) => {
    const mailOptions = {
        from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
        to: oldEmail,
        subject: 'Email Address Change Request',
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
        console.error('Error sending email change notification:', error);
        return false;
    }
};

export const sendAccountDeletionConfirmationEmail = async (email, deletionDate) => {
    const mailOptions = {
        from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Account Deletion Scheduled',
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
        console.error('Error sending account deletion confirmation:', error);
        return false;
    }
};

export const sendDataExportEmail = async (email, token) => {
    const downloadLink = `${process.env.BASE_URL}/api/account/export/download?token=${token}`;

    const mailOptions = {
        from: `"Startup Connect" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Data Export is Ready',
        html: `
            <h2>Data Export Ready</h2>
            <p>Your requested data export is ready for download.</p>
            <p>Click the link below to download your data:</p>
            <p><a href="${downloadLink}">Download My Data</a></p>
            <p><strong>Important:</strong> This link will expire in 24 hours for security reasons.</p>
            <p>The export includes:</p>
            <ul>
                <li>Your profile information</li>
                <li>Your connections</li>
                <li>Your messages and conversations</li>
                <li>Your privacy and notification settings</li>
            </ul>
            <p>If you did not request this export, please ignore this email or contact support if you have concerns.</p>
        `,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`Data export email sent to ${email}`);
        return true;
    } catch (error) {
        console.error('Error sending data export email:', error);
        return false;
    }
};
