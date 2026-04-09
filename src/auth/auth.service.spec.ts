import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service.js';
import { PasswordService } from './services/password.service.js';
import { RegistrationService } from './services/registration.service.js';
import { UsersService } from '../users/users.service.js';
import { User } from '../entities/user.entity.js';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;

  const mockUser: Partial<User> = {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashedpassword',
    resetToken: null,
    resetTokenExpiry: null,
  };

  const mockUsersService = {
    create: jest.fn(),
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    updateResetToken: jest.fn(),
    updatePassword: jest.fn(),
    updatePasswordAndClearResetToken: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
    verify: jest.fn(),
  };

  const mockRegistrationService = {
    register: jest.fn(),
  };

  const mockPasswordService = {
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RegistrationService, useValue: mockRegistrationService },
        { provide: PasswordService, useValue: mockPasswordService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('delegates to RegistrationService', async () => {
      mockRegistrationService.register.mockResolvedValue({
        token: 'mock-jwt-token',
        user: { id: 'test-user-id', username: 'testuser', email: 'test@example.com' },
      });

      const result = await service.register('testuser', 'test@example.com', 'password123');

      expect(mockRegistrationService.register).toHaveBeenCalledWith(
        'testuser',
        'test@example.com',
        'password123',
      );
      expect(result).toHaveProperty('token', 'mock-jwt-token');
    });
  });

  describe('login', () => {
    it('should login with correct credentials', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login('testuser', 'password123');

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user).toHaveProperty('username', 'testuser');
    });

    it('should throw UnauthorizedException if user not found', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);

      await expect(service.login('testuser', 'password123')).rejects.toThrow(
        'Invalid credentials',
      );
    });

    it('should throw UnauthorizedException if password is wrong', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('testuser', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('getMe', () => {
    it('should return user data', async () => {
      mockUsersService.findById.mockResolvedValue(mockUser);

      const result = await service.getMe('test-user-id');

      expect(result).toHaveProperty('username', 'testuser');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(result).not.toHaveProperty('password');
    });

    it('should return null if user not found', async () => {
      mockUsersService.findById.mockResolvedValue(null);

      const result = await service.getMe('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('password operations delegate', () => {
    it('forgotPassword delegates to PasswordService', async () => {
      mockPasswordService.forgotPassword.mockResolvedValue({ message: 'sent' });
      await service.forgotPassword('a@b.com');
      expect(mockPasswordService.forgotPassword).toHaveBeenCalledWith('a@b.com');
    });

    it('resetPassword delegates to PasswordService', async () => {
      mockPasswordService.resetPassword.mockResolvedValue({ message: 'ok' });
      await service.resetPassword('token', 'newPassword12345');
      expect(mockPasswordService.resetPassword).toHaveBeenCalledWith(
        'token',
        'newPassword12345',
      );
    });

    it('changePassword delegates to PasswordService', async () => {
      mockPasswordService.changePassword.mockResolvedValue({ message: 'ok' });
      await service.changePassword('user-id', 'old', 'newPassword12345');
      expect(mockPasswordService.changePassword).toHaveBeenCalledWith(
        'user-id',
        'old',
        'newPassword12345',
      );
    });
  });
});
