import nodemailer from 'nodemailer';
import { getSiteSettings } from '@/lib/siteSettings';
import { decryptSecret } from '@/lib/secretCrypto';

export type MailSendResult = { ok: true } | { ok: false; error: string };

export interface SmtpRuntimeConfig {
  host: string;
  port: number;
  secure: boolean;
  requireTLS: boolean;
  authEnabled: boolean;
  user?: string;
  pass?: string;
  fromName?: string;
  fromEmail?: string;
}

export async function getSmtpRuntimeConfig(): Promise<{ configured: boolean; config?: SmtpRuntimeConfig; error?: string }> {
  const settings = await getSiteSettings();

  const host = (settings.smtpHost || process.env.SMTP_HOST || '').trim();
  const port = Number(settings.smtpPort || process.env.SMTP_PORT || 587);
  const secure = Boolean(settings.smtpSecure ?? (port === 465));
  const requireTLS = Boolean(settings.smtpRequireTLS ?? true);
  const authEnabled = Boolean(settings.smtpAuthEnabled ?? true);
  const user = (settings.smtpUser || process.env.SMTP_USER || '').trim() || undefined;
  const passEnc = (settings.smtpPasswordEnc || process.env.SMTP_PASSWORD || '').trim() || undefined;
  const pass = passEnc ? decryptSecret(passEnc) : undefined;

  const fromName = settings.smtpFromName || process.env.SMTP_FROM_NAME || 'ScamGuard';
  const fromEmail = settings.smtpFromEmail || process.env.SMTP_FROM_EMAIL || user || undefined;

  if (!host) return { configured: false, error: 'SMTP host chưa được cấu hình' };
  if (!Number.isFinite(port) || port <= 0) return { configured: false, error: 'SMTP port không hợp lệ' };
  if (!fromEmail) return { configured: false, error: 'From email chưa được cấu hình' };
  if (authEnabled && (!user || !pass)) {
    return { configured: false, error: 'SMTP auth được bật nhưng thiếu username/password' };
  }

  return {
    configured: true,
    config: {
      host,
      port,
      secure,
      requireTLS,
      authEnabled,
      user,
      pass,
      fromName,
      fromEmail,
    },
  };
}

function buildTransport(config: SmtpRuntimeConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: config.requireTLS,
    auth: config.authEnabled
      ? {
          user: config.user,
          pass: config.pass,
        }
      : undefined,
  });
}

export async function verifySmtp(): Promise<MailSendResult> {
  try {
    const { configured, config, error } = await getSmtpRuntimeConfig();
    if (!configured || !config) return { ok: false, error: error || 'SMTP chưa cấu hình' };
    const transporter = buildTransport(config);
    await transporter.verify();
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'SMTP verify failed' };
  }
}

export async function sendEmail(options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<MailSendResult> {
  try {
    const { configured, config, error } = await getSmtpRuntimeConfig();
    if (!configured || !config) return { ok: false, error: error || 'SMTP chưa cấu hình' };

    const transporter = buildTransport(config);
    const from = config.fromName ? `"${config.fromName}" <${config.fromEmail}>` : config.fromEmail!;
    await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Send mail failed' };
  }
}

