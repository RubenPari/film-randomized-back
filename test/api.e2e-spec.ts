import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/entities/user.entity.js';
import { WatchlistItem } from '../src/entities/watchlist-item.entity.js';

describe('Film Randomized API (e2e)', () => {
  let app: INestApplication<App>;
  let userRepository: Repository<User>;
  let watchlistRepository: Repository<WatchlistItem>;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    userRepository = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    watchlistRepository = moduleFixture.get<Repository<WatchlistItem>>(getRepositoryToken(WatchlistItem));
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Clean up data before each test
    await watchlistRepository.clear();
    await userRepository.clear();
    authToken = '';
    userId = '';
  });

  // ==================== AUTH TESTS ====================

  describe('POST /api/auth/register', () => {
    it('should register a new user and return token + user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'securePassword123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.token).toBeDefined();
          expect(res.body.user).toBeDefined();
          expect(res.body.user.username).toBe('testuser');
          expect(res.body.user.email).toBe('test@example.com');
          expect(res.body.user.id).toBeDefined();
        });
    });

    it('should reject duplicate username', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          email: 'dup1@example.com',
          password: 'securePassword123',
        });

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'duplicateuser',
          email: 'dup2@example.com',
          password: 'securePassword123',
        })
        .expect(409);
    });

    it('should reject duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'user1',
          email: 'same@example.com',
          password: 'securePassword123',
        });

      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'user2',
          email: 'same@example.com',
          password: 'securePassword123',
        })
        .expect(409);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'loginuser',
          email: 'login@example.com',
          password: 'securePassword123',
        });
    });

    it('should login with correct credentials', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'securePassword123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.token).toBeDefined();
          expect(res.body.user.username).toBe('loginuser');
          expect(res.body.user.email).toBe('login@example.com');
        });
    });

    it('should reject incorrect password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'loginuser',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('should reject nonexistent user', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'somepassword',
        })
        .expect(401);
    });
  });

  describe('GET /api/auth/me', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'meuser',
          email: 'me@example.com',
          password: 'securePassword123',
        });
      authToken = response.body.token;
      userId = response.body.user.id;
    });

    it('should return current user with valid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.username).toBe('meuser');
          expect(res.body.email).toBe('me@example.com');
        });
    });

    it('should reject request without token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(401);
    });

    it('should reject request with invalid token', () => {
      return request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken')
        .expect(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'changepassuser',
          email: 'changepass@example.com',
          password: 'oldPassword123',
        });
      authToken = response.body.token;
    });

    it('should change password with correct current password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'oldPassword123',
          newPassword: 'newPassword456',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBe('Password changed successfully');
        });
    });

    it('should reject change password with incorrect current password', () => {
      return request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newPassword456',
        })
        .expect(400);
    });

    it('should allow login with new password after change', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentPassword: 'oldPassword123',
          newPassword: 'newPassword456',
        });

      return request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          username: 'changepassuser',
          password: 'newPassword456',
        })
        .expect(200);
    });
  });

  // ==================== WATCHLIST TESTS ====================

  describe('Watchlist CRUD', () => {
    const testMovie = {
      tmdb_id: 12345,
      media_type: 'movie',
      title: 'Test Movie',
      original_title: 'Test Movie Original',
      overview: 'A test movie overview',
      poster_path: '/poster.jpg',
      backdrop_path: '/backdrop.jpg',
      vote_average: 7.5,
      vote_count: 100,
      release_date: '2024-01-01',
      genres: JSON.stringify([{ id: 1, name: 'Action' }]),
      runtime: 120,
    };

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'watchlistuser',
          email: 'watchlist@example.com',
          password: 'securePassword123',
        });
      authToken = response.body.token;
      userId = response.body.user.id;
    });

    describe('POST /api/watchlist', () => {
      it('should add item to watchlist', () => {
        return request(app.getHttpServer())
          .post('/api/watchlist')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testMovie)
          .expect(200)
          .expect((res) => {
            expect(res.body.tmdbId).toBe(12345);
            expect(res.body.title).toBe('Test Movie');
            expect(res.body.mediaType).toBe('movie');
          });
      });

      it('should reject duplicate item in watchlist', async () => {
        await request(app.getHttpServer())
          .post('/api/watchlist')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testMovie);

        return request(app.getHttpServer())
          .post('/api/watchlist')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testMovie)
          .expect(409);
      });

      it('should reject request without token', () => {
        return request(app.getHttpServer())
          .post('/api/watchlist')
          .send(testMovie)
          .expect(401);
      });
    });

    describe('GET /api/watchlist', () => {
      beforeEach(async () => {
        await request(app.getHttpServer())
          .post('/api/watchlist')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testMovie);
      });

      it('should return all watchlist items for user', () => {
        return request(app.getHttpServer())
          .get('/api/watchlist')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
            expect(res.body[0].title).toBe('Test Movie');
          });
      });

      it('should reject request without token', () => {
        return request(app.getHttpServer())
          .get('/api/watchlist')
          .expect(401);
      });
    });

    describe('GET /api/watchlist/:tmdbId', () => {
      beforeEach(async () => {
        await request(app.getHttpServer())
          .post('/api/watchlist')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testMovie);
      });

      it('should return specific watchlist item', () => {
        return request(app.getHttpServer())
          .get('/api/watchlist/12345')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.tmdbId).toBe(12345);
            expect(res.body.title).toBe('Test Movie');
          });
      });

      it('should return 404 for nonexistent item', () => {
        return request(app.getHttpServer())
          .get('/api/watchlist/99999')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });

    describe('DELETE /api/watchlist/:tmdbId', () => {
      beforeEach(async () => {
        await request(app.getHttpServer())
          .post('/api/watchlist')
          .set('Authorization', `Bearer ${authToken}`)
          .send(testMovie);
      });

      it('should remove item from watchlist', () => {
        return request(app.getHttpServer())
          .delete('/api/watchlist/12345')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.message).toBe('Item removed from watchlist');
          });
      });

      it('should return 404 for already removed item', async () => {
        await request(app.getHttpServer())
          .delete('/api/watchlist/12345')
          .set('Authorization', `Bearer ${authToken}`);

        return request(app.getHttpServer())
          .delete('/api/watchlist/12345')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(404);
      });
    });
  });

  // ==================== FORGOT PASSWORD TESTS ====================

  describe('POST /api/auth/forgot-password', () => {
    it('should return success message even for nonexistent email', () => {
      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' })
        .expect(200)
        .expect((res) => {
          expect(res.body.message).toBeDefined();
        });
    });

    it('should return success message for existing email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'forgotuser',
          email: 'forgot@example.com',
          password: 'securePassword123',
        });

      return request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send({ email: 'forgot@example.com' })
        .expect(200);
    });
  });
});
