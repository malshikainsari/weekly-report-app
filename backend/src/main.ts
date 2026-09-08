import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
  origin: [
    'http://localhost:3000',
    'https://weekly-report-app-lac.vercel.app',
  ],
  credentials: true,
});

  app.setGlobalPrefix('api');
  await app.listen(3001);
  console.log('Backend running on http://localhost:3001');
}
bootstrap();