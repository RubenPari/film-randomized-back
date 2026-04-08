import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(username: string, email: string, password: string): Promise<User> {
    const user = new User();
    user.username = username;
    user.email = email;
    user.password = password;
    return this.userRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async updateResetToken(
    userId: string,
    resetToken: string | null,
    resetTokenExpiry: Date | null,
  ): Promise<void> {
    await this.userRepository.update(userId, { resetToken, resetTokenExpiry });
  }

  async updatePassword(userId: string, newPassword: string): Promise<void> {
    await this.userRepository.update(userId, { password: newPassword });
  }

  async updatePasswordAndClearResetToken(
    userId: string,
    newPassword: string,
  ): Promise<void> {
    await this.userRepository.update(userId, {
      password: newPassword,
      resetToken: null,
      resetTokenExpiry: null,
    });
  }
}
