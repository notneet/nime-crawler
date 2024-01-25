import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMediaDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  id: number;

  @ApiProperty({ example: 'Otakudesu', maxLength: 128 })
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  name: string;

  @ApiProperty({ example: 'otakudesu.cam', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  url: string;
}
