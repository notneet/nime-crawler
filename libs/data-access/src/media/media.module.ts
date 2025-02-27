import { Media } from '@entities/media.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dbConnection } from '../../../commons/src/constants';
import { MediaRepository } from './media.repository';
import { MediaService } from './media.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        ...dbConnection.animeData,
      }),
    }),
    TypeOrmModule.forFeature([Media]),
  ],
  providers: [MediaService, MediaRepository],
  exports: [MediaService],
})
export class MediaModule {}
