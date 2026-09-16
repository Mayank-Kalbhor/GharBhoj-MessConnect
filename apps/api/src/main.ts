import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    rawBody: true // Required for Razorpay HMAC webhook verification
  });

  // Global prefix: /v1 matching API contract
  app.setGlobalPrefix('v1');

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true
  });

  // Global Exception Filter formatting every error into { error: { code, message, details } }
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Interceptors
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: false
      }
    })
  );

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('MessConnect (GharBhoj) API')
    .setDescription('Production-ready REST API for MessConnect aggregator platform')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`GharBhoj API server listening at http://localhost:${port}/v1`);
  logger.log(`Swagger OpenAPI documentation at http://localhost:${port}/docs`);
}

bootstrap();
