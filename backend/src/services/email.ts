import nodemailer from 'nodemailer';
import { config } from '../config';

// Best-effort notification, not a transactional dependency - sendEmail never
// throws. A failed email must never block or roll back the real action
// (a booking/cancellation) it's attached to; it only logs clearly so the
// failure is visible without affecting anything else.
let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!config.smtp.user || !config.smtp.pass) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, text: string): Promise<boolean> {
  const client = getTransporter();
  if (!client) {
    console.warn(`[email] SMTP not configured - skipping "${subject}" to ${to}`);
    return false;
  }

  try {
    await client.sendMail({ from: config.smtp.user, to, subject, text });
    console.log(`[email] sent "${subject}" to ${to}`);
    return true;
  } catch (err) {
    console.error(`[email] failed to send "${subject}" to ${to} - continuing without it`, err);
    return false;
  }
}
