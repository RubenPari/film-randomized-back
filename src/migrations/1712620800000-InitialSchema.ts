import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Initial schema migration. Mirrors the structure that was previously created
 * via TypeORM's `synchronize: true` for the `users` and `watchlist_items` tables.
 */
export class InitialSchema1712620800000 implements MigrationInterface {
  name = 'InitialSchema1712620800000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "resetToken" character varying DEFAULT NULL,
        "resetTokenExpiry" TIMESTAMP DEFAULT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_users_username" UNIQUE ("username"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email"),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "watchlist_items" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "tmdbId" integer NOT NULL,
        "mediaType" character varying NOT NULL,
        "title" character varying NOT NULL,
        "originalTitle" character varying DEFAULT NULL,
        "overview" text DEFAULT NULL,
        "posterPath" character varying DEFAULT NULL,
        "backdropPath" character varying DEFAULT NULL,
        "voteAverage" double precision DEFAULT NULL,
        "voteCount" integer DEFAULT NULL,
        "releaseDate" character varying DEFAULT NULL,
        "genres" text DEFAULT NULL,
        "runtime" integer DEFAULT NULL,
        "numberOfSeasons" integer DEFAULT NULL,
        "numberOfEpisodes" integer DEFAULT NULL,
        "userId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_watchlist_items_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE UNIQUE INDEX "IDX_watchlist_user_tmdb_media"
        ON "watchlist_items" ("userId", "tmdbId", "mediaType")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_watchlist_user" ON "watchlist_items" ("userId")
    `);

    await queryRunner.query(`
      ALTER TABLE "watchlist_items"
      ADD CONSTRAINT "FK_watchlist_items_user"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "watchlist_items" DROP CONSTRAINT "FK_watchlist_items_user"`,
    );
    await queryRunner.query(`DROP INDEX "IDX_watchlist_user"`);
    await queryRunner.query(`DROP INDEX "IDX_watchlist_user_tmdb_media"`);
    await queryRunner.query(`DROP TABLE "watchlist_items"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
