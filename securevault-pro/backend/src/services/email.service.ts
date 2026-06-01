import nodemailer, { Transporter } from 'nodemailer';
import { logger } from '../utils/logger';

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: Transporter | null = null;
  private readonly devMode: boolean;

  constructor() {
    this.devMode = process.env.EMAIL_DEV_MODE === 'true';

    if (!this.devMode && process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host:   process.env.SMTP_HOST,
        port:   parseInt(process.env.SMTP_PORT ?? '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    }
  }

  async send(opts: SendMailOptions): Promise<void> {
    if (this.devMode) {
      logger.info(`[EMAIL DEV] To: ${opts.to} | Subject: ${opts.subject}`);
      return;
    }

    if (!this.transporter) {
      logger.warn('[EMAIL] No SMTP configured — email not sent');
      return;
    }

    try {
      await this.transporter.sendMail({
        from:    process.env.EMAIL_FROM ?? 'SecureVault Pro <noreply@securevault.pro>',
        to:      opts.to,
        subject: opts.subject,
        html:    opts.html,
        text:    opts.text,
      });
    } catch (err) {
      logger.error('[EMAIL] Failed to send:', err);
      // Don't throw — email failure should not break the API response
    }
  }

  async sendPasswordReset(to: string, firstName: string, token: string): Promise<void> {
    const resetUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/reset-password?token=${token}`;
    const expiresIn = '1 hour';

    if (this.devMode) {
      logger.info(`[EMAIL DEV] Password reset for ${to}: ${resetUrl}`);
    }

    await this.send({
      to,
      subject: 'Reset your SecureVault Pro password',
      text: `Hi ${firstName},\n\nClick this link to reset your password:\n${resetUrl}\n\nThis link expires in ${expiresIn}. If you didn't request a reset, ignore this email.\n\n— SecureVault Pro`,
      html: `
        <!DOCTYPE html>
        <html>
        <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
        <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;">
          <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
            <!-- Header -->
            <div style="background:linear-gradient(135deg,#1d4ed8,#4f46e5);padding:32px 40px;text-align:center;">
              <div style="width:48px;height:48px;background:rgba(255,255,255,0.15);border-radius:12px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:12px;">
                <span style="font-size:24px;">🔐</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">SecureVault Pro</h1>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">Password Reset Request</p>
            </div>
            <!-- Body -->
            <div style="padding:36px 40px;">
              <p style="margin:0 0 8px;color:#0f172a;font-size:18px;font-weight:600;">Hi ${firstName},</p>
              <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6;">
                We received a request to reset the password for your SecureVault Pro account.
                Click the button below to set a new password.
              </p>
              <div style="text-align:center;margin:32px 0;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:linear-gradient(135deg,#1d4ed8,#4f46e5);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:600;letter-spacing:0.2px;">
                  Reset Password
                </a>
              </div>
              <p style="margin:0 0 8px;color:#64748b;font-size:12px;text-align:center;">
                Or copy this link into your browser:
              </p>
              <p style="margin:0 0 24px;color:#3b82f6;font-size:11px;word-break:break-all;text-align:center;">${resetUrl}</p>
              <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;margin-bottom:24px;">
                <p style="margin:0;color:#92400e;font-size:12px;">
                  ⏱ This link expires in <strong>${expiresIn}</strong>. If you didn't request a password reset, you can safely ignore this email.
                </p>
              </div>
            </div>
            <!-- Footer -->
            <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 40px;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:11px;">
                © ${new Date().getFullYear()} SecureVault Pro. For security questions, contact your administrator.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendWelcome(to: string, firstName: string): Promise<void> {
    await this.send({
      to,
      subject: 'Welcome to SecureVault Pro',
      text: `Hi ${firstName},\n\nWelcome to SecureVault Pro! Your account has been created.\n\nLog in at: ${process.env.FRONTEND_URL ?? 'http://localhost:5173'}\n\n— SecureVault Pro`,
      html: `
        <div style="font-family:-apple-system,sans-serif;max-width:500px;margin:auto;padding:32px;">
          <h2 style="color:#1d4ed8;">Welcome to SecureVault Pro, ${firstName}!</h2>
          <p style="color:#475569;">Your account has been created. You can now securely manage your passwords and expenses.</p>
          <a href="${process.env.FRONTEND_URL ?? 'http://localhost:5173'}"
             style="display:inline-block;background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;">
            Log In Now
          </a>
        </div>
      `,
    });
  }
}

export const emailService = new EmailService();
