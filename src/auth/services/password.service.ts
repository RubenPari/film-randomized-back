import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { EmailService } from '../../email/email.service.js';
import { UsersService } from '../../users/users.service.js';

const BCRYPT_SALT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class PasswordService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    // Always return the same payload to prevent email enumeration attacks.
    const genericResponse = {
      message: 'If an account with that email exists, a reset link has been sent.',
    };

    if (!user) {
      return genericResponse;
    }

    const resetToken = this.jwtService.sign({ sub: user.id }, { expiresIn: '1h' });
    await this.usersService.updateResetToken(
      user.id,
      resetToken,
      new Date(Date.now() + RESET_TOKEN_TTL_MS),
    );
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return genericResponse;
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user || user.resetToken !== token || !user.resetTokenExpiry) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      if (new Date() > new Date(user.resetTokenExpiry)) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
      await this.usersService.updatePasswordAndClearResetToken(user.id, hashedPassword);

      return { message: 'Password has been reset successfully' };
    } catch (err) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException('Invalid or expired reset token');
    }
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isCurrentValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await this.usersService.updatePassword(userId, hashedNewPassword);

    return { message: 'Password changed successfully' };
  }
}
