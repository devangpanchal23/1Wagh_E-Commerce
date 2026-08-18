const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Built on demand, never at import time
let resendClient = null;
const getResend = () => {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
};

// Helper to mask email address in logs (e.g. "w***9@gmail.com")
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return '***';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user[0]}***@${domain}`;
  return `${user[0]}***${user[user.length - 1]}@${domain}`;
};

/**
 * Delivers 6-digit OTP email to target recipient.
 * Supports:
 * 1. Nodemailer SMTP (Gmail / Brevo / SendGrid / Custom SMTP)
 * 2. Resend API
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} otp - 6-digit verification / reset OTP
 * @param {object} options - Delivery options e.g. { type: 'reset_password' | 'verify_email' }
 */
async function sendOtpEmail(toEmail, otp, options = {}) {
  const cleanEmail = String(toEmail).trim().toLowerCase();
  const isResetPassword = options.type === 'reset_password';

  const subject = isResetPassword
    ? 'WAGH Mobile - Password Reset OTP'
    : `${otp} is your WAGH Mobile verification code`;

  const htmlContent = isResetPassword
    ? `
    <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 20px; background-color: #ffffff; color: #1e293b;">
      <div style="text-align: center; padding-bottom: 20px; border-b: 1px solid #f1f5f9;">
        <h2 style="color: #0D9488; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">WAGH Mobile</h2>
        <span style="font-size: 11px; color: #64748b; font-weight: 700; uppercase; tracking-wider;">Premium Accessories</span>
      </div>

      <div style="padding: 24px 0 12px;">
        <h3 style="font-size: 18px; font-weight: 700; color: #0f172a; margin-top: 0; margin-bottom: 12px;">Password Reset Request</h3>
        <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 16px;">Hello,</p>
        <p style="font-size: 14px; color: #334155; line-height: 1.6; margin-bottom: 20px;">
          We received a request to reset the password for your <strong>WAGH Mobile</strong> account.
        </p>

        <div style="background: linear-gradient(135deg, #f0fdfa 0%, #e6fffa 100%); border: 1.5px solid #99f6e4; text-align: center; padding: 20px; border-radius: 16px; margin: 24px 0;">
          <span style="font-size: 11px; font-weight: 700; color: #0d9488; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 6px;">Your Password Reset OTP</span>
          <span style="font-size: 34px; font-weight: 900; letter-spacing: 8px; color: #0f766e; font-family: 'Courier New', Courier, monospace; display: inline-block;">${otp}</span>
        </div>

        <p style="font-size: 13px; color: #475569; line-height: 1.5;">
          Please enter this OTP on the WAGH Mobile website to continue resetting your password.
        </p>

        <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 8px; margin: 20px 0;">
          <p style="font-size: 12px; color: #92400e; margin: 0; font-weight: 600; line-height: 1.5;">
            <strong>Security Notices:</strong>
          </p>
          <ul style="font-size: 12px; color: #92400e; margin: 4px 0 0; padding-left: 18px; line-height: 1.5;">
            <li>This OTP is valid for <strong>10 minutes</strong>.</li>
            <li>Do not share this OTP with anyone.</li>
            <li>WAGH Mobile will never ask for your password or OTP over calls or messages.</li>
            <li>If you did not request a password reset, you can safely ignore this email.</li>
          </ul>
        </div>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
        <p style="font-size: 12px; color: #64748b; margin-bottom: 8px;">Regards,<br><strong style="color: #0f172a;">WAGH Mobile Team</strong></p>
        <p style="font-size: 10px; color: #94a3b8; margin: 0;">This is an automated security email. Please do not reply directly to this message.</p>
        <p style="font-size: 10px; color: #cbd5e1; margin-top: 4px;">© 2026 WAGH Mobile Accessories. All rights reserved.</p>
      </div>
    </div>
  `
    : `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #0D9488; text-align: center; margin-top: 0;">WAGH Mobile Accessories</h2>
      <p style="font-size: 14px; color: #334155; line-height: 1.5;">Hello,</p>
      <p style="font-size: 14px; color: #334155; line-height: 1.5;">Your email verification code for your account is:</p>
      <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; text-align: center; padding: 18px; border-radius: 12px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0D9488; font-family: monospace;">${otp}</span>
      </div>
      <p style="font-size: 12px; color: #64748b;">This code expires in <strong>10 minutes</strong>. Do not share this OTP with anyone.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">© 2026 WAGH Mobile Accessories. All rights reserved.</p>
    </div>
  `;

  const textContent = isResetPassword
    ? `Hello,\n\nWe received a request to reset the password for your WAGH Mobile account.\n\nYour One-Time Password (OTP) is: ${otp}\n\nPlease enter this OTP on the WAGH Mobile website to continue resetting your password.\n\nFor your security:\n- This OTP is valid for 10 minutes.\n- Do not share this OTP with anyone.\n- WAGH Mobile will never ask for your password or OTP.\n- If you did not request a password reset, you can safely ignore this email.\n\nRegards,\nWAGH Mobile Team`
    : `Hello,\n\nYour verification code for your WAGH Mobile account is: ${otp}\n\nThis code expires in 10 minutes. Do not share this code with anyone.\n\nRegards,\nWAGH Mobile Team`;

  // 1. Try Nodemailer SMTP (preferred worldwide delivery)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || `WAGH Mobile Accessories <${process.env.SMTP_USER}>`,
        to: cleanEmail,
        subject,
        html: htmlContent,
        text: textContent,
      });

      console.log(`[SMTP EMAIL DELIVERED] OTP email sent to ${maskEmail(cleanEmail)} via SMTP:`, info.messageId);
      return { success: true, delivered: true, provider: 'SMTP', messageId: info.messageId };
    } catch (smtpErr) {
      console.error(`[SMTP EMAIL ERROR] Failed to send email to ${maskEmail(cleanEmail)} via SMTP:`, smtpErr.message);
      // Fall through to Resend if available
    }
  }

  // 2. Fallback to Resend API
  const resend = getResend();
  if (resend) {
    try {
      const { data, error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Wagh Mobile Accessories <onboarding@resend.dev>',
        to: cleanEmail,
        subject,
        html: htmlContent,
        text: textContent,
      });

      if (error) {
        console.error(`[RESEND EMAIL ERROR]:`, error.message);
      } else {
        console.log(`[RESEND EMAIL DELIVERED] OTP email sent to ${maskEmail(cleanEmail)} via Resend:`, data);
        return { success: true, delivered: true, provider: 'Resend', data };
      }
    } catch (err) {
      console.error(`[RESEND EMAIL DISPATCH ERROR]:`, err.message);
    }
  }

  // 3. In development mode fallback to server terminal console output so testing is never blocked by bad SMTP credentials
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV OTP CONSOLE] Real email dispatch failed due to SMTP/provider credentials. Use this OTP for local dev testing: ${otp}`);
    return { success: true, delivered: false, provider: 'console-dev' };
  }

  // If no email service was able to deliver the email in production
  console.error(`[EMAIL DELIVERY FAILED] Could not deliver email to ${maskEmail(cleanEmail)}. Check SMTP credentials.`);
  return {
    success: false,
    delivered: false,
    message: 'Email delivery failed. Please check SMTP configuration on server.',
  };
}

module.exports = { sendOtpEmail };
