import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { EmailService } from '../email/email.service.js';
import { User } from '../entities/user.entity.js';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

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

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-jwt-secret'),
  };

  const mockEmailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: EmailService, useValue: mockEmailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);

    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await service.register('testuser', 'test@example.com', 'password123');

      expect(result).toHaveProperty('token', 'mock-jwt-token');
      expect(result.user).toHaveProperty('username', 'testuser');
      expect(result.user).toHaveProperty('email', 'test@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockUsersService.create).toHaveBeenCalledWith(
        'testuser',
        'test@example.com',
        'hashedpassword',
      );
    });

    it('should throw ConflictException if username exists', async () => {
      mockUsersService.findByUsername.mockResolvedValue(mockUser);

      await expect(
        service.register('testuser', 'test@example.com', 'password123'),
      ).rejects.toThrow('Username already exists');
    });

    it('should throw ConflictException if email exists', async () => {
      mockUsersService.findByUsername.mockResolvedValue(null);
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register('testuser', 'test@example.com', 'password123'),
      ).rejects.toThrow('Email already exists');
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
});
