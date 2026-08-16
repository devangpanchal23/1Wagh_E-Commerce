const nodemailer = require('nodemailer');
const { Resend } = require('resend');

// Built on demand, never at import time: the Resend constructor throws when no
// API key is set, and this module sits on the require chain behind
// authController -> authRoutes -> server.js. Constructing it eagerly took the
// entire API process down at boot whenever RESEND_API_KEY was absent.
let resendClient = null;
const getResend = () => {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resendClient) resendClient = new Resend(process.env.RESEND_API_KEY);
  return resendClient;
};

/**
 * Delivers 6-digit OTP verification email to target recipient.
 * Supports:
 * 1. Nodemailer SMTP (Gmail / Brevo / SendGrid / Custom SMTP) - Delivers to ANY email address worldwide.
 * 2. Resend API
 */
async function sendOtpEmail(toEmail, otp) {
  const cleanEmail = String(toEmail).trim().toLowerCase();
  const subject = `${otp} is your WAGH account verification code`;
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <h2 style="color: #0D9488; text-align: center; margin-top: 0;">WAGH Mobile Accessories</h2>
      <p style="font-size: 14px; color: #334155; line-height: 1.5;">Hello,</p>
      <p style="font-size: 14px; color: #334155; line-height: 1.5;">Your email verification code for updating your account is:</p>
      <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; text-align: center; padding: 18px; border-radius: 12px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #0D9488; font-family: monospace;">${otp}</span>
      </div>
      <p style="font-size: 12px; color: #64748b;">This code expires in <strong>5 minutes</strong>. Do not share this OTP with anyone.</p>
      <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px;" />
      <p style="font-size: 11px; color: #94a3b8; text-align: center;">© 2026 WAGH Mobile Accessories. All rights reserved.</p>
    </div>
  `;

  // 1. Check if SMTP credentials are configured (Delivers to ANY recipient without domain restriction)
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
      });

      console.log(`[SMTP EMAIL DELIVERED] OTP email sent to ${cleanEmail} via SMTP:`, info.messageId);
      return { success: true, provider: 'SMTP', messageId: info.messageId };
    } catch (smtpErr) {
      console.error('[SMTP EMAIL ERROR]:', smtpErr.message);
    }
  }

  // 2. Fallback to Resend API
  const resend = getResend();
  if (!resend) {
    console.warn(
      `[EMAIL OTP NOT DELIVERED] No email provider configured for ${cleanEmail}. ` +
        'Set SMTP_USER & SMTP_PASS (preferred) or RESEND_API_KEY in server/.env.'
    );
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email delivery is not configured. Please contact support.');
    }
    console.log(`[EMAIL OTP GENERATED] Verification OTP for ${cleanEmail} is: ${otp}`);
    return { success: true, delivered: false, devOtp: otp, provider: 'none' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Wagh Mobile Accessories <onboarding@resend.dev>',
      to: cleanEmail,
      subject,
      html: htmlContent,
    });

    if (error) {
      if (error.message && (error.message.includes('only send testing emails') || error.message.includes('resend.com/domains'))) {
        console.warn(`[RESEND TEST MODE RESTRICTION]: Resend free test key restricts sending to unverified domain address ${cleanEmail}.`);
        console.log(`[EMAIL OTP GENERATED] Verification OTP for ${cleanEmail} is: ${otp}`);
        return {
          success: true,
          delivered: false,
          devOtp: otp,
          provider: 'Resend-TestMode',
          message: 'Resend free testing key restricts unverified recipient domains. Set SMTP_USER & SMTP_PASS in server/.env for unrestricted live delivery.',
        };
      }
      throw new Error(error.message || 'Failed to send OTP email via Resend');
    }

    console.log(`[RESEND EMAIL DELIVERED] OTP email sent to ${cleanEmail} via Resend:`, data);
    return { success: true, provider: 'Resend', data };
  } catch (err) {
    if (err.message && (err.message.includes('only send testing emails') || err.message.includes('resend.com/domains'))) {
      console.warn(`[RESEND TEST RESTRICTION CATCH]: Cannot deliver directly to ${cleanEmail} on Resend free tier.`);
      console.log(`[EMAIL OTP GENERATED] Verification OTP for ${cleanEmail} is: ${otp}`);
      return {
        success: true,
        delivered: false,
        devOtp: otp,
        provider: 'Resend-TestMode',
      };
    }
    console.error(`[EMAIL DISPATCH EXCEPTION]:`, err.message);
    throw err;
  }
}

module.exports = { sendOtpEmail };
