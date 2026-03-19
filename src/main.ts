import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  // Security
  app.use(helmet());

  // CORS – allow the Android APK on LAN
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Swagger UI
  const config = new DocumentBuilder()
    .setTitle('GothiTech Pi Controller API')
    .setDescription(
      'Raspberry Pi backend for Android controller app. ' +
      'Manages ADB device control, WiFi, and diagnostics.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('auth', 'Device pairing & authentication')
    .addTag('device', 'Pi system status')
    .addTag('adb', 'Android Debug Bridge control')
    .addTag('wifi', 'WiFi & hotspot management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`\n🍓 GothiTech Pi API running on http://0.0.0.0:${port}`);
  console.log(`📚 Swagger docs at  http://0.0.0.0:${port}/docs\n`);
}

bootstrap();
