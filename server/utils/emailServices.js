

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