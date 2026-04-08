import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { EmailService } from '../email/email.service.js';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async register(username: string, email: string, password: string) {
    const existingUser = await this.usersService.findByUsername(username);
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const existingEmail = await this.usersService.findByEmail(email);
    if (existingEmail) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.usersService.create(username, email, hashedPassword);

    const token = this.generateToken(user.id, user.username);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async login(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.username);

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
    };
  }

  async getMe(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      return null;
    }
    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      // Return success even if user not found to prevent email enumeration
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id },
      { expiresIn: '1h' },
    );

    await this.usersService.updateResetToken(user.id, resetToken, new Date(Date.now() + 3600000));
    await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    return { message: 'If an account with that email exists, a reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user || user.resetToken !== token || !user.resetTokenExpiry) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      if (new Date() > new Date(user.resetTokenExpiry)) {
        throw new BadRequestException('Invalid or expired reset token');
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
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

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.updatePassword(userId, hashedNewPassword);

    return { message: 'Password changed successfully' };
  }

  private generateToken(userId: string, username: string): string {
    return this.jwtService.sign({ sub: userId, username });
  }
}
