export class CreateWatchlistDto {
  tmdb_id!: number;
  media_type!: string;
  title!: string;
  original_title?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number | null;
  vote_count?: number | null;
  release_date?: string | null;
  genres?: string | null;
  runtime?: number | null;
  number_of_seasons?: number | null;
  number_of_episodes?: number | null;
}
