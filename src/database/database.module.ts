import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../entities/user.entity.js';
import { WatchlistItem } from '../entities/watchlist-item.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const sslEnabled = configService.get<boolean>('DB_SSL', false);
        // SSL is on by default — only allow disabling cert validation when
        // explicitly opted-out via DB_SSL_REJECT_UNAUTHORIZED=false (dev only).
        const rejectUnauthorized = configService.get<boolean>(
          'DB_SSL_REJECT_UNAUTHORIZED',
          true,
        );

        return {
          type: 'postgres',
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          username: configService.get<string>('DB_USERNAME', 'postgres'),
          password: configService.get<string>('DB_PASSWORD', 'postgres'),
          database: configService.get<string>('DB_DATABASE', 'film_randomized'),
          entities: [User, WatchlistItem],
          synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
          ssl: sslEnabled ? { rejectUnauthorized } : false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
