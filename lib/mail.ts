import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || 'no-reply@ratiotuta.com';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

function getClient() {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY is not set');
  return new Resend(RESEND_API_KEY);
}

export async function sendVerificationEmail(params: {
  to: string;
  name: string;
  token: string;
}) {
  const resend = getClient();
  const verifyUrl = `${APP_URL}/api/verify-email?token=${encodeURIComponent(params.token)}`;

  // Very simple HTML (keep it plain for now)
  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">
      <h2>Verify your email</h2>
      <p>Hi ${escapeHtml(params.name)},</p>
      <p>Thanks for signing up. Please confirm your email address by clicking the button below:</p>
      <p>
        <a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a>
      </p>
      <p>Or copy and paste this link in your browser:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>If you didn't create an account, you can ignore this email.</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: 'Confirm your email',
    html,
  });

  if (error) {
    // Surface the error so callers can log/handle it
    throw new Error(
      `Resend send error: ${typeof error === 'string' ? error : JSON.stringify(error)}`,
    );
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
