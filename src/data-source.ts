import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { join } from 'path';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity.js';
import { WatchlistItem } from './entities/watchlist-item.entity.js';

// TypeORM CLI entry point used by `npm run typeorm:generate` / `typeorm:run`.
// Loads .env from the backend dir or the monorepo root, in that order.
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });
dotenv.config({ path: '../.env' });

const sslEnabled = process.env.DB_SSL === 'true';
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

export default new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_DATABASE ?? 'film_randomized',
  entities: [User, WatchlistItem],
  migrations: [
    join(__dirname, 'migrations', '*.ts'),
    join(__dirname, 'migrations', '*.js'),
  ],
  ssl: sslEnabled ? { rejectUnauthorized } : false,
  synchronize: false,
});
