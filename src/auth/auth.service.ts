import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service.js';
import { PasswordService } from './services/password.service.js';
import { RegistrationService } from './services/registration.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly registrationService: RegistrationService,
    private readonly passwordService: PasswordService,
  ) {}

  register(username: string, email: string, password: string) {
    return this.registrationService.register(username, email, password);
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

    const token = this.jwtService.sign({ sub: user.id, username: user.username });

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

  forgotPassword(email: string) {
    return this.passwordService.forgotPassword(email);
  }

  resetPassword(token: string, newPassword: string) {
    return this.passwordService.resetPassword(token, newPassword);
  }

  changePassword(userId: string, currentPassword: string, newPassword: string) {
    return this.passwordService.changePassword(userId, currentPassword, newPassword);
  }
}
