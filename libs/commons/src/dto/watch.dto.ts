import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { StreamDto } from './stream.dto';

export class WatchDto {
  @ApiProperty({ example: 445 })
  @Expose()
  @Type(() => Number)
  id: number;

  @ApiProperty({ example: 'c7559de12ff6ea4b14bc24eb8cfc0674', nullable: true })
  @Expose()
  object_id: string | null;

  @ApiProperty({ example: 1 })
  @Expose()
  media_id: number;

  @ApiProperty({
    example: 'https://otakudesu.cam/anime/k-n-subtitle-indonesia/',
  })
  @Expose()
  url: string;

  @ApiProperty({
    example: 'K-On! BD (Episode 1 - 13) Subtitle Indonesia + OVA',
    nullable: true,
  })
  @Expose()
  title: string | null;

  @ApiProperty({ example: 'けいおん!', nullable: true })
  @Expose()
  title_jp: string | null;

  @ApiProperty({ example: 'K-On!', nullable: true })
  @Expose()
  title_en: string | null;

  @ApiProperty({ example: 'BD', nullable: true })
  @Expose()
  type: string | null;

  @ApiProperty({ example: 7.86, nullable: true })
  @Expose()
  @Type(() => Number)
  score: number | null;

  @ApiProperty({ example: 'Completed', nullable: true })
  @Expose()
  status: string | null;

  @ApiProperty({ example: 24, nullable: true })
  @Expose()
  duration: number | null;

  @ApiProperty({ example: 13, nullable: true })
  @Expose()
  total_episode: number | null;

  @ApiProperty({ example: '2009-04-03 12:00:00', nullable: true })
  @Expose()
  published: Date | null;

  @ApiProperty({ example: 1238734800, nullable: true })
  @Type(() => Number)
  @Expose()
  published_ts: number | null;

  @ApiProperty({ example: 'Spring' })
  @Expose()
  season: string | null;

  @ApiProperty({ example: 'Comedy,Music,School,Slice of Life', nullable: true })
  @Expose()
  genres: string | null;

  @ApiProperty({
    example: 'Pony Canyon,TBS,Movic,Rakuonsha,Animation Do',
    nullable: true,
  })
  @Expose()
  producers: string | null;

  @ApiProperty({
    example: `Yui Hirasawa saat ini mulai memasuki kehidupan masa-masa SMA-nya. Terlebih lagi saat ia melihat sebuah poster “klub musik ringan” yang terpampang di dinding sekolah. Entah alasan apa yang membuat dirinya tertarik, tapi secara cepat ia mendaftar ke klub tersebut padahal Yui sama sekali tak dapat memainkan alat musik.
  Saat sampai disana, klub musik benar-benar menyambut Yui sebagai anggota baru, walaupun mereka sedikit kecewa karena Yui tak dapat memainkan alat musik. Namun anggota klub musik lainnya yakni Mio, Tsumugi, & Ritsu tetap berusaha mempertahankan Yui di klub musik (K-On) dan mengajari Yui cara bermain gitar serta musik. Tujuan mereka juga yakni agar dapat membatalkan rencana pembubaran klub K-On! akibat kekurangan anggota.
  Seiring dengan tugas sekolah dan pekerjaan rumah, Yui mulai belajar cara memainkan gitar dibantu oleh anggota lainnya. Walaupun hal tersebut bukanlah hal mudah, mereka tetap berusaha dan pantang menyerah. Terlebih lagi, festival sekolah yang sebentar lagi akan digelar. Akankah K-On! dapat memulai debut pertama mereka?
  Tonton juga kelanjutannya disini, 
  .`,
  })
  @Expose()
  description: string | null;

  @ApiProperty({
    example:
      'https://otakudesu.cam/wp-content/uploads/2019/03/K-On-Sub-Indo.jpg',
  })
  @Expose()
  cover_url: string | null;

  @Expose()
  @Type(() => StreamDto)
  streams: StreamDto[] | null | undefined;
}
