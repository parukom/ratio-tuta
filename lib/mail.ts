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

// Invitation email used when an admin creates an account for someone.
// Includes the initial password and prompts them to verify and change it in Settings.
export async function sendInviteEmail(params: {
  to: string;
  name: string;
  password: string;
  token: string;
}) {
  const resend = getClient();
  const verifyUrl = `${APP_URL}/api/verify-email?token=${encodeURIComponent(
    params.token,
  )}`;
  const settingsUrl = `${APP_URL}/dashboard/settings`;

  const html = `
    <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #111827;">
      <h2 style="margin:0 0 12px;">Welcome</h2>
      <p style="margin:0 0 12px;">Hi ${escapeHtml(params.name)},</p>
      <p style="margin:0 0 12px;">An administrator created an account for you. Please verify your email and sign in using this initial password:</p>
      <p style="margin:8px 0 16px;"><code style="background:#f3f4f6;padding:8px 10px;border-radius:6px;display:inline-block;">${escapeHtml(
        params.password,
      )}</code></p>
      <p style="margin:0 0 12px;">
        <a href="${verifyUrl}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">Verify Email</a>
      </p>
      <p style="margin:0 0 12px;">After you sign in, go to <a href="${settingsUrl}">Settings</a> to change your password to your own.</p>
      <p style="margin:0 0 12px;">If you didn't expect this, you can ignore this email.</p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: 'Your new account – verify and sign in',
    html,
  });

  if (error) {
    throw new Error(
      `Resend send error: ${typeof error === 'string' ? error : JSON.stringify(error)}`,
    );
  }
}

// Password reset email
export async function sendPasswordResetEmail(params: {
  to: string;
  name: string;
  token: string;
}) {
  const resend = getClient();
  const resetUrl = `${APP_URL}/auth/reset-password?token=${encodeURIComponent(
    params.token,
  )}`;

  const html = `
    <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.6; color:#111827;">
      <h2 style="margin:0 0 12px;">Reset your password</h2>
      <p style="margin:0 0 12px;">Hi ${escapeHtml(params.name)},</p>
      <p style="margin:0 0 12px;">We received a request to reset your password. Click the button below to choose a new one. This link is valid for 60 minutes.</p>
      <p style="margin:16px 0;">
        <a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:6px">Reset Password</a>
      </p>
      <p style="margin:0 0 12px;">If you did not request a password reset, you can safely ignore this email.</p>
      <p style="margin:24px 0 0;font-size:12px;color:#6b7280;">If the button doesn't work, copy and paste this URL:<br /><a href="${resetUrl}">${resetUrl}</a></p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: params.to,
    subject: 'Reset your password',
    html,
  });
  if (error) {
    throw new Error(
      `Resend send error: ${typeof error === 'string' ? error : JSON.stringify(error)}`,
    );
  }
}
