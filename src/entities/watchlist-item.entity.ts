import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity.js';

@Entity('watchlist_items')
@Index('IDX_watchlist_user_tmdb_media', ['userId', 'tmdbId', 'mediaType'], {
  unique: true,
})
@Index('IDX_watchlist_user', ['userId'])
export class WatchlistItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tmdbId: number;

  @Column()
  mediaType: string;

  @Column()
  title: string;

  @Column({ type: 'varchar', nullable: true, default: null })
  originalTitle: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  overview: string | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  posterPath: string | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  backdropPath: string | null;

  @Column({ type: 'float', nullable: true, default: null })
  voteAverage: number | null;

  @Column({ type: 'int', nullable: true, default: null })
  voteCount: number | null;

  @Column({ type: 'varchar', nullable: true, default: null })
  releaseDate: string | null;

  @Column({ type: 'text', nullable: true, default: null })
  genres: string | null;

  @Column({ type: 'int', nullable: true, default: null })
  runtime: number | null;

  @Column({ type: 'int', nullable: true, default: null })
  numberOfSeasons: number | null;

  @Column({ type: 'int', nullable: true, default: null })
  numberOfEpisodes: number | null;

  @ManyToOne(() => User, (user) => user.watchlistItems, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
