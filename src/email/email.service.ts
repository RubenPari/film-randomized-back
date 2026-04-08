import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null;
  private readonly logger = new Logger(EmailService.name);

  constructor(private configService: ConfigService) {
    const mailtrapToken = this.configService.get<string>('MAILTRAP_TOKEN');
    if (mailtrapToken) {
      this.transporter = nodemailer.createTransport({
        host: 'live.smtp.mailtrap.io',
        port: 587,
        auth: {
          user: 'api',
          pass: mailtrapToken,
        },
      });
    } else {
      this.transporter = null;
      this.logger.warn('MAILTRAP_TOKEN not configured. Email sending disabled.');
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`Email sending skipped for ${to}: Mailtrap not configured.`);
      return;
    }

    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    await this.transporter.sendMail({
      from: this.configService.get<string>('MAILTRAP_SENDER_EMAIL') || 'noreply@filmrandomized.com',
      to,
      subject: 'Reset Your Password - Film Randomized',
      html: `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset for your Film Randomized account.</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#007bff;color:#fff;text-decoration:none;border-radius:5px;">Reset Password</a>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
      `,
    });
  }
}
