import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WatchlistService } from './watchlist.service.js';
import { WatchlistItem } from '../entities/watchlist-item.entity.js';
import { CreateWatchlistDto } from './dto/create-watchlist.dto.js';

describe('WatchlistService', () => {
  let service: WatchlistService;
  let repository: Repository<WatchlistItem>;

  const mockWatchlistRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    create: jest.fn(),
  };

  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WatchlistService,
        {
          provide: getRepositoryToken(WatchlistItem),
          useValue: mockWatchlistRepository,
        },
      ],
    }).compile();

    service = module.get<WatchlistService>(WatchlistService);
    repository = module.get<Repository<WatchlistItem>>(getRepositoryToken(WatchlistItem));

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createDto: CreateWatchlistDto = {
      tmdb_id: 12345,
      media_type: 'movie',
      title: 'Test Movie',
      original_title: 'Test Movie Original',
      overview: 'Test overview',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      vote_average: 7.5,
      vote_count: 100,
      release_date: '2024-01-01',
      genres: '[]',
      runtime: 120,
    };

    it('should create a watchlist item', async () => {
      mockWatchlistRepository.findOne.mockResolvedValue(null);
      mockWatchlistRepository.save.mockResolvedValue({
        id: 'item-id',
        tmdbId: 12345,
        mediaType: 'movie',
        title: 'Test Movie',
        userId: mockUserId,
      });

      const result = await service.create(mockUserId, createDto);

      expect(result.tmdbId).toBe(12345);
      expect(result.title).toBe('Test Movie');
      expect(mockWatchlistRepository.save).toHaveBeenCalled();
    });

    it('should throw ConflictException if item already exists', async () => {
      mockWatchlistRepository.findOne.mockResolvedValue({ id: 'existing-id' });

      await expect(service.create(mockUserId, createDto)).rejects.toThrow(
        'Item already in watchlist',
      );
    });
  });

  describe('findAll', () => {
    it('should return all watchlist items for a user', async () => {
      const mockItems = [
        { id: '1', tmdbId: 12345, title: 'Movie 1', userId: mockUserId },
        { id: '2', tmdbId: 67890, title: 'Movie 2', userId: mockUserId },
      ];
      mockWatchlistRepository.find.mockResolvedValue(mockItems);

      const result = await service.findAll(mockUserId);

      expect(result).toHaveLength(2);
      expect(mockWatchlistRepository.find).toHaveBeenCalledWith({
        where: { userId: mockUserId },
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOneByTmdbId', () => {
    it('should return a watchlist item by tmdbId', async () => {
      const mockItem = { id: '1', tmdbId: 12345, title: 'Test Movie', userId: mockUserId };
      mockWatchlistRepository.findOne.mockResolvedValue(mockItem);

      const result = await service.findOneByTmdbId(12345, mockUserId);

      expect(result.tmdbId).toBe(12345);
    });

    it('should throw NotFoundException if item not found', async () => {
      mockWatchlistRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneByTmdbId(99999, mockUserId)).rejects.toThrow(
        'Item not found in watchlist',
      );
    });
  });

  describe('remove', () => {
    it('should remove a watchlist item', async () => {
      const mockItem = { id: '1', tmdbId: 12345, title: 'Test Movie', userId: mockUserId };
      mockWatchlistRepository.findOne.mockResolvedValue(mockItem);

      await service.remove(12345, mockUserId);

      expect(mockWatchlistRepository.remove).toHaveBeenCalledWith(mockItem);
    });

    it('should throw NotFoundException if item not found', async () => {
      mockWatchlistRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(99999, mockUserId)).rejects.toThrow(
        'Item not found in watchlist',
      );
    });
  });
});
