import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WatchlistItem } from '../entities/watchlist-item.entity.js';
import { WatchlistController } from './watchlist.controller.js';
import { WatchlistService } from './watchlist.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([WatchlistItem])],
  controllers: [WatchlistController],
  providers: [WatchlistService],
})
export class WatchlistModule {}
