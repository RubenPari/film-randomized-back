import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.js';
import { CreateWatchlistDto } from './dto/create-watchlist.dto.js';
import { WatchlistService } from './watchlist.service.js';

@Controller('watchlist')
@UseGuards(AuthGuard('jwt'))
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateWatchlistDto) {
    return this.watchlistService.create(user.id, dto);
  }

  @Get()
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.watchlistService.findAll(user.id);
  }

  @Get(':tmdbId')
  async findOne(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.watchlistService.findOneByTmdbId(tmdbId, user.id);
  }

  @Delete(':tmdbId')
  @HttpCode(HttpStatus.OK)
  async remove(
    @Param('tmdbId', ParseIntPipe) tmdbId: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    await this.watchlistService.remove(tmdbId, user.id);
    return { message: 'Item removed from watchlist' };
  }
}
