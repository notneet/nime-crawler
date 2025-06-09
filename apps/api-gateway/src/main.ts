import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiGatewayModule } from './api-gateway.module';

let port: number = 3000;

async function bootstrap() {
  const app = await NestFactory.create(ApiGatewayModule);

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: '1',
  });

  const config = new DocumentBuilder()
    .setTitle('NIME Crawler API')
    .setDescription(
      'A sophisticated anime aggregation and crawling service API',
    )
    .setVersion('1.0')
    .addTag('anime', 'Anime content management')
    .addTag('crawler', 'Crawling job management')
    .addTag('sources', 'Source management')
    .addTag('health', 'Health and status endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(port);
  console.log(`API Gateway is running on port ${port}`);
}
bootstrap().catch(console.error);
