import { Stream } from '@libs/commons/entities/stream.entity';
import { EnvKey } from '@libs/commons/helper/constant';
import { ObscloudhostModule } from '@libs/commons/obscloudhost/obscloudhost.module';
import { StringHelperModule } from '@libs/commons/string-helper/string-helper.module';
import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StreamController } from './stream.controller';
import { StreamService } from './stream.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Stream]),
    HttpModule,
    ObscloudhostModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        return {
          endpointUrl: config.get<string>(EnvKey.OBS_ENDPOINT_URL, ''),
          accessKey: config.get<string>(EnvKey.ACCESS_KEY, ''),
          secretKey: config.get<string>(EnvKey.SECRET_KEY, ''),
          bucketName: config.get<string>(EnvKey.BUCKET_NAME, ''),
        };
      },
    }),
    StringHelperModule,
  ],
  controllers: [StreamController],
  providers: [StreamService],
  exports: [StreamService],
})
export class StreamModule {}
