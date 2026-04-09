import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * NOTE: snake_case field names are intentional and must NOT be renamed.
 * The frontend (`watchlistApi.js`) sends payloads using snake_case so the
 * mapping in `WatchlistService.create` can stay as-is.
 */
export class CreateWatchlistDto {
  @IsInt()
  @Min(1)
  tmdb_id!: number;

  @IsString()
  @IsIn(['movie', 'tv'])
  media_type!: string;

  @IsString()
  @MaxLength(500)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  original_title?: string | null;

  @IsOptional()
  @IsString()
  overview?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  poster_path?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  backdrop_path?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  vote_average?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  vote_count?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  release_date?: string | null;

  @IsOptional()
  @IsString()
  genres?: string | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  runtime?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  number_of_seasons?: number | null;

  @IsOptional()
  @IsInt()
  @Min(0)
  number_of_episodes?: number | null;
}
