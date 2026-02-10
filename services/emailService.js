/**
 * Email Service using Resend HTTP API
 * Resend is used instead of Nodemailer/SMTP because Render's free tier
 * blocks all outbound SMTP connections (ports 25, 465, 587).
 */

/**
 * Send OTP verification email via Resend HTTP API
 * @param {string} email - Recipient email address
 * @param {string} otp - 6-digit OTP code
 */
const sendOTP = async (email, otp) => {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        throw new Error('RESEND_API_KEY environment variable is required');
    }

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: 'Sydney Events <onboarding@resend.dev>',
            to: [email],
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
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Resend API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
    }

    console.log(`📧 OTP sent to ${email}`);
};

module.exports = { sendOTP };
