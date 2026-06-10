import nodemailer from "nodemailer";

export const getEmailFromAddress = () =>
  process.env.EMAIL_FROM || process.env.EMAIL_USER || "noreply@localhost";

export const hasEmailCredentials = () => {
  const pass = process.env.EMAIL_PASS;
  const user = process.env.EMAIL_SMTP_HOST
    ? process.env.EMAIL_SMTP_USER || process.env.EMAIL_USER
    : process.env.EMAIL_USER;
  return Boolean(user && pass);
};

export const createEmailTransporter = () => {
  if (process.env.EMAIL_SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST,
      port: Number(process.env.EMAIL_SMTP_PORT || 587),
      secure: process.env.EMAIL_SMTP_SECURE === "true",
      auth: {
        user: process.env.EMAIL_SMTP_USER || process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};
