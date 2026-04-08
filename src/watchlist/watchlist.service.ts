import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchlistItem } from '../entities/watchlist-item.entity.js';
import { CreateWatchlistDto } from './dto/create-watchlist.dto.js';

@Injectable()
export class WatchlistService {
  constructor(
    @InjectRepository(WatchlistItem)
    private readonly watchlistRepository: Repository<WatchlistItem>,
  ) {}

  async create(userId: string, dto: CreateWatchlistDto): Promise<WatchlistItem> {
    const existing = await this.watchlistRepository.findOne({
      where: { tmdbId: dto.tmdb_id, userId },
    });

    if (existing) {
      throw new ConflictException('Item already in watchlist');
    }

    const item = new WatchlistItem();
    item.tmdbId = dto.tmdb_id;
    item.mediaType = dto.media_type;
    item.title = dto.title;
    item.originalTitle = dto.original_title ?? null;
    item.overview = dto.overview ?? null;
    item.posterPath = dto.poster_path ?? null;
    item.backdropPath = dto.backdrop_path ?? null;
    item.voteAverage = dto.vote_average ?? null;
    item.voteCount = dto.vote_count ?? null;
    item.releaseDate = dto.release_date ?? null;
    item.genres = dto.genres ?? null;
    item.runtime = dto.runtime ?? null;
    item.numberOfSeasons = dto.number_of_seasons ?? null;
    item.numberOfEpisodes = dto.number_of_episodes ?? null;
    item.userId = userId;

    return this.watchlistRepository.save(item);
  }

  async findAll(userId: string): Promise<WatchlistItem[]> {
    return this.watchlistRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOneByTmdbId(tmdbId: number, userId: string): Promise<WatchlistItem> {
    const item = await this.watchlistRepository.findOne({
      where: { tmdbId, userId },
    });

    if (!item) {
      throw new NotFoundException('Item not found in watchlist');
    }

    return item;
  }

  async remove(tmdbId: number, userId: string): Promise<void> {
    const item = await this.watchlistRepository.findOne({
      where: { tmdbId, userId },
    });

    if (!item) {
      throw new NotFoundException('Item not found in watchlist');
    }

    await this.watchlistRepository.remove(item);
  }
}
