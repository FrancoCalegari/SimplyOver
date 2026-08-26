import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let transporter;

if (process.env.SMTP_USER === 'tu-email@gmail.com' || !process.env.SMTP_USER) {
  console.log('[Email] Usando credenciales de prueba (Ethereal)...');
  const testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });
} else {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

const defaultFrom = process.env.SMTP_FROM || '"SimplyOver" <no-reply@simplyover.com>';

/**
 * Envía un correo electrónico de verificación de cuenta.
 * @param {string} toEmail - Correo del destinatario
 * @param {string} username - Nombre de usuario
 * @param {string} token - Token de verificación
 */
export async function sendVerificationEmail(toEmail, username, token) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify/${token}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a24; color: #fff; padding: 30px; border-radius: 12px;">
      <h2 style="color: #d2bbff; text-align: center;">Welcome to SimplyOver!</h2>
      <p style="font-size: 16px; color: #e4e4e9;">Hi <strong>${username}</strong>,</p>
      <p style="font-size: 16px; color: #e4e4e9;">Thank you for registering at SimplyOver. Please verify your email address to activate your account and start creating amazing overlays.</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verifyUrl}" style="background: linear-gradient(45deg, #7c3aed, #ddb7ff); color: #000; text-decoration: none; padding: 14px 28px; font-weight: bold; border-radius: 8px; display: inline-block;">Verify Email</a>
      </div>
      <p style="font-size: 14px; color: #a1a1aa; text-align: center;">If the button doesn't work, copy and paste this link in your browser:</p>
      <p style="font-size: 14px; color: #7c3aed; text-align: center; word-break: break-all;">${verifyUrl}</p>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: defaultFrom,
      to: toEmail,
      subject: 'Verify your SimplyOver Account',
      html,
    });
    console.log(`[Email] Verification email sent to ${toEmail}`);
    if (info.messageId && process.env.SMTP_USER === 'tu-email@gmail.com') {
      console.log(`[Email Preview] URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.error(`[Email] Error sending verification to ${toEmail}:`, error);
  }
}

/**
 * Envía un correo de notificación general (ej. actualización de la página).
 * @param {string|string[]} to - Destinatario(s)
 * @param {string} subject - Asunto
 * @param {string} text - Contenido en texto plano
 * @param {string} htmlContent - Contenido HTML
 */
export async function sendNotificationEmail(to, subject, text, htmlContent) {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a24; color: #fff; padding: 30px; border-radius: 12px;">
      <h2 style="color: #4cd7f6; text-align: center;">SimplyOver Update</h2>
      <div style="font-size: 16px; color: #e4e4e9; line-height: 1.6;">
        ${htmlContent}
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: defaultFrom,
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email] Notification sent to ${Array.isArray(to) ? to.length + ' users' : to}`);
    if (info.messageId && process.env.SMTP_USER === 'tu-email@gmail.com') {
      console.log(`[Email Preview] URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    console.error('[Email] Error sending notification:', error);
  }
}
