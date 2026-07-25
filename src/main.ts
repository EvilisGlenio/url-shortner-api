import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  const hostname = '0.0.0.0';
  await app.listen(port, hostname, () => {
    const address = hostname + ':' + port + '/';
    Logger.log(
      `Listening at ${address} | Environment: ${
        process.env.NODE_ENV ?? 'development'
      }`,
    );
  });
}

bootstrap().catch((error: unknown) => {
  Logger.error('Application startup failed', error);
  process.exit(1);
});
