import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity.js';
import { WatchlistItem } from '../entities/watchlist-item.entity.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'database.sqlite',
      entities: [User, WatchlistItem],
      synchronize: true,
    }),
  ],
})
export class DatabaseModule {}
