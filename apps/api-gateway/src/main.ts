import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway.module';

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);
  
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  const config = new DocumentBuilder()
    .setTitle('NIME Crawler API')
    .setDescription('A sophisticated anime aggregation and crawling service API')
    .setVersion('1.0')
    .addTag('anime', 'Anime content management')
    .addTag('crawler', 'Crawling job management')
    .addTag('sources', 'Source management')
    .addTag('health', 'Health and status endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
