import { AuthModule } from '@commons/auth/auth.module';
import { JwtAuthGuard } from '@commons/auth/guards/jwt-auth.guard';
import { AnimeSourceModule } from '@data-access/anime-source/anime-source.module';
import { MediaModule } from '@data-access/media/media.module';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PatternDashboardController } from './pattern-dashboard.controller';
import { PatternDashboardService } from './pattern-dashboard.service';

@Module({
  imports: [AuthModule, AnimeSourceModule, MediaModule],
  controllers: [PatternDashboardController],
  providers: [PatternDashboardService, JwtAuthGuard, JwtService],
})
export class PatternDashboardModule {}
