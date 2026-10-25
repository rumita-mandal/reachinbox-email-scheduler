import * as nodemailer from 'nodemailer';
import { EmailJobPayload } from '../types';

let cachedTransporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (cachedTransporter) return cachedTransporter;

  const account = await nodemailer.createTestAccount();
  console.log('[Email] Ethereal account created:', account.user);

  cachedTransporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: { user: account.user, pass: account.pass },
  });

  return cachedTransporter;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string;
}

export async function sendEmail(payload: EmailJobPayload): Promise<SendEmailResult> {
  const transporter = await getTransporter();

  const info = await transporter.sendMail({
    from: `"${payload.senderName}" <${payload.senderEmail}>`,
    to: payload.recipientEmail,
    subject: payload.subject,
    html: payload.body,
  });

  const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
  console.log('[Email] Sent to', payload.recipientEmail, '| Preview:', previewUrl);

  return {
    success: true,
    messageId: info.messageId,
    previewUrl: typeof previewUrl === 'string' ? previewUrl : undefined,
  };
}
