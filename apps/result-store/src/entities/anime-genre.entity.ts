import { Entity, PrimaryColumn } from 'typeorm';

@Entity('anime_genre')
export class AnimeGenre {
  @PrimaryColumn()
  animeId!: number;

  @PrimaryColumn()
  genreId!: number;
}
