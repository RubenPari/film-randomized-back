import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RegistrationService } from './registration.service.js';
import { UsersService } from '../../users/users.service.js';
import { User } from '../../entities/user.entity.js';

jest.mock('bcryptjs');

describe('RegistrationService', () => {
  let service: RegistrationService;

  const mockUser: Partial<User> = {
    id: 'test-user-id',
    username: 'testuser',
    email: 'test@example.com',
  };

  const mockUsersService = {
    findByUsername: jest.fn(),
    findByEmail: jest.fn(),
    create: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
    jest.clearAllMocks();
  });

  it('registers a new user successfully', async () => {
    mockUsersService.findByUsername.mockResolvedValue(null);
    mockUsersService.findByEmail.mockResolvedValue(null);
    (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword');
    mockUsersService.create.mockResolvedValue(mockUser);

    const result = await service.register('testuser', 'test@example.com', 'password123');

    expect(result.token).toBe('mock-jwt-token');
    expect(result.user.username).toBe('testuser');
    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
  });

  it('throws ConflictException if username exists', async () => {
    mockUsersService.findByUsername.mockResolvedValue(mockUser);

    await expect(
      service.register('testuser', 'test@example.com', 'password123'),
    ).rejects.toThrow('Username already exists');
  });

  it('throws ConflictException if email exists', async () => {
    mockUsersService.findByUsername.mockResolvedValue(null);
    mockUsersService.findByEmail.mockResolvedValue(mockUser);

    await expect(
      service.register('testuser', 'test@example.com', 'password123'),
    ).rejects.toThrow('Email already exists');
  });
});
