const nodemailer = require('nodemailer');

// Create reusable transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send OTP verification email
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: `"Sydney Events" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Verification Code - Sydney Events',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background-color: #171717; border-radius: 12px; color: #ffffff;">
                <h2 style="margin: 0 0 8px 0; font-size: 22px; font-weight: 700;">Sydney Events</h2>
                <p style="color: #a3a3a3; margin: 0 0 24px 0; font-size: 14px;">Email Verification</p>
                <hr style="border: none; border-top: 1px solid #262626; margin: 0 0 24px 0;" />
                <p style="font-size: 15px; color: #e5e5e5; margin: 0 0 16px 0;">Your verification code is:</p>
                <div style="background-color: #0a0a0a; border: 1px solid #404040; border-radius: 10px; padding: 20px; text-align: center; margin: 0 0 24px 0;">
                    <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #10b981;">${otp}</span>
                </div>
                <p style="font-size: 13px; color: #737373; margin: 0;">This code expires in <strong style="color: #a3a3a3;">5 minutes</strong>. Do not share it with anyone.</p>
            </div>
        `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP sent to ${email}`);
};

module.exports = { sendOTP };
