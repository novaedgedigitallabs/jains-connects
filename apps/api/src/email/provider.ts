/**
 * Email provider abstraction.
 *
 * Real production implementations should delegate to an approved SMTP or
 * transactional-email service (e.g. AWS SES, Postmark, SendGrid). The
 * interface decouples the auth/recovery flows from a specific provider so
 * that the logic can be unit-tested with a test double and the provider
 * can be swapped without touching auth code.
 *
 * When SMTP_HOST is absent from the environment the NoopEmailProvider is
 * used, which logs a structured warning and does not send any mail.
 * This prevents the API from crashing in development while making it
 * explicit that email delivery is not configured.
 *
 * NEVER log the raw token — log only the tokenId or a safe summary.
 */

import { createTransport, type Transporter } from 'nodemailer';

export interface EmailProvider {
  sendEmailVerification(input: {
    toEmail: string;
    toDisplayName: string;
    tokenId: string;
    /** Raw token — embed in the verification URL. Never log. */
    rawToken: string;
    expiresAt: Date;
  }): Promise<void>;

  sendPasswordReset(input: {
    toEmail: string;
    toDisplayName: string;
    tokenId: string;
    /** Raw token — embed in the reset URL. Never log. */
    rawToken: string;
    expiresAt: Date;
  }): Promise<void>;
}

/**
 * No-op provider used when SMTP is not configured.
 * Logs a warning so the omission is visible in server logs.
 */
export class NoopEmailProvider implements EmailProvider {
  public async sendEmailVerification(input: {
    toEmail: string;
    tokenId: string;
    expiresAt: Date;
  }) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        event: 'email_not_configured',
        type: 'email_verification',
        tokenId: input.tokenId,
        expiresAt: input.expiresAt.toISOString(),
        message: 'SMTP is not configured; verification email was not sent',
      }),
    );
  }

  public async sendPasswordReset(input: { toEmail: string; tokenId: string; expiresAt: Date }) {
    console.warn(
      JSON.stringify({
        level: 'warn',
        event: 'email_not_configured',
        type: 'password_reset',
        tokenId: input.tokenId,
        expiresAt: input.expiresAt.toISOString(),
        message: 'SMTP is not configured; password reset email was not sent',
      }),
    );
  }
}

/**
 * SMTP provider backed by nodemailer. Used when SMTP_HOST is configured.
 *
 * Delivery failures are thrown so the caller can decide whether the
 * surrounding operation should fail (e.g. registration) — callers must not
 * swallow provider errors silently.
 *
 * The raw token is only ever placed into the message body/URL; it is never
 * logged.
 */
export class SmtpEmailProvider implements EmailProvider {
  private readonly transporter: Transporter;
  private readonly fromAddress: string;
  private readonly siteUrl: string;

  constructor(
    options: {
      host: string;
      port: number;
      secure: boolean;
      user?: string | undefined;
      pass?: string | undefined;
    },
    fromAddress: string,
    siteUrl: string,
  ) {
    this.transporter = createTransport({
      host: options.host,
      port: options.port,
      secure: options.secure,
      auth:
        options.user && options.pass
          ? { user: options.user, pass: options.pass }
          : undefined,
    });
    this.fromAddress = fromAddress;
    this.siteUrl = siteUrl.replace(/\/+$/, '');
  }

  public async sendEmailVerification(input: {
    toEmail: string;
    toDisplayName: string;
    expiresAt: Date;
    rawToken: string;
  }): Promise<void> {
    const verifyUrl = `${this.siteUrl}/verify-email?token=${encodeURIComponent(input.rawToken)}`;
    await this.transporter.sendMail({
      from: this.fromAddress,
      to: `"${input.toDisplayName}" <${input.toEmail}>`,
      subject: 'Verify your JainConnect email address',
      text: [
        `Hello ${input.toDisplayName},`,
        '',
        'Please confirm your email address for JainConnect by opening the link below:',
        verifyUrl,
        '',
        `This link expires at ${input.expiresAt.toISOString()} and can be used once.`,
        'If you did not create a JainConnect account, you can ignore this message.',
      ].join('\n'),
      // A verified HTML body is intentionally minimal; the text part carries
      // the same content for clients that do not render HTML.
      html: [
        `<p>Hello ${escapeHtml(input.toDisplayName)},</p>`,
        `<p>Please confirm your email address for JainConnect:</p>`,
        `<p><a href="${verifyUrl}">Verify email address</a></p>`,
        `<p>This link expires at ${input.expiresAt.toISOString()} and can be used once.</p>`,
        `<p>If you did not create a JainConnect account, you can ignore this message.</p>`,
      ].join('\n'),
    });
  }

  public async sendPasswordReset(input: {
    toEmail: string;
    toDisplayName: string;
    expiresAt: Date;
    rawToken: string;
  }): Promise<void> {
    const resetUrl = `${this.siteUrl}/reset-password?token=${encodeURIComponent(input.rawToken)}`;
    await this.transporter.sendMail({
      from: this.fromAddress,
      to: `"${input.toDisplayName}" <${input.toEmail}>`,
      subject: 'Reset your JainConnect password',
      text: [
        `Hello ${input.toDisplayName},`,
        '',
        'A password reset was requested for your JainConnect account. Open the link below to choose a new password:',
        resetUrl,
        '',
        `This link expires at ${input.expiresAt.toISOString()} and can be used once.`,
        'If you did not request a reset, your password remains unchanged and you can ignore this message.',
      ].join('\n'),
      html: [
        `<p>Hello ${escapeHtml(input.toDisplayName)},</p>`,
        `<p>A password reset was requested for your JainConnect account:</p>`,
        `<p><a href="${resetUrl}">Choose a new password</a></p>`,
        `<p>This link expires at ${input.expiresAt.toISOString()} and can be used once.</p>`,
        `<p>If you did not request a reset, your password remains unchanged.</p>`,
      ].join('\n'),
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Builds the email provider from validated configuration. SMTP is opt-in via
 * SMTP_HOST; without it the NoopEmailProvider makes the omission explicit.
 */
export function createEmailProvider(config: {
  smtp: {
    host?: string | undefined;
    port: number;
    secure: boolean;
    user?: string | undefined;
    pass?: string | undefined;
    from?: string | undefined;
  };
  publicSiteUrl?: string | undefined;
}): EmailProvider {
  if (!config.smtp.host) {
    return new NoopEmailProvider();
  }

  if (!config.smtp.from) {
    throw new Error('SMTP_FROM is required when SMTP_HOST is configured');
  }

  if (!config.publicSiteUrl) {
    throw new Error('PUBLIC_SITE_URL is required when SMTP_HOST is configured');
  }

  return new SmtpEmailProvider(
    {
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
    config.smtp.from,
    config.publicSiteUrl,
  );
}
