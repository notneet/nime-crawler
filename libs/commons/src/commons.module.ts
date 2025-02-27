import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CommonsService } from './commons.service';
import { HtmlModule } from './html/html.module';

@Module({
  providers: [CommonsService],
  exports: [CommonsService],
  imports: [HtmlModule, AuthModule],
})
export class CommonsModule {}
