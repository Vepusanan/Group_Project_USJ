import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to, subject, text) => {
    // Development fallback or missing credentials
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log(`\n📧 [DEV EMAIL] To: ${to}`);
        console.log(`   Subject: ${subject}`);
        console.log(`   Body: ${text}\n`);
        return;
    }

    try {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to,
            subject,
            text,
        });
        console.log(`✅ Email sent to ${to}`);
    } catch (error) {
        console.error('❌ Error sending email:', error.message);
    }
};