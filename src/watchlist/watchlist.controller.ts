import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { WatchlistService } from './watchlist.service.js';
import { CreateWatchlistDto } from './dto/create-watchlist.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';

@Controller('watchlist')
@UseGuards(JwtAuthGuard)
export class WatchlistController {
  constructor(private readonly watchlistService: WatchlistService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  async create(@Request() req: any, @Body() dto: CreateWatchlistDto) {
    return this.watchlistService.create(req.user.id, dto);
  }

  @Get()
  async findAll(@Request() req: any) {
    return this.watchlistService.findAll(req.user.id);
  }

  @Get(':tmdbId')
  async findOne(@Param('tmdbId', ParseIntPipe) tmdbId: number, @Request() req: any) {
    return this.watchlistService.findOneByTmdbId(tmdbId, req.user.id);
  }

  @Delete(':tmdbId')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('tmdbId', ParseIntPipe) tmdbId: number, @Request() req: any) {
    await this.watchlistService.remove(tmdbId, req.user.id);
    return { message: 'Item removed from watchlist' };
  }
}
