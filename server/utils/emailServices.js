

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