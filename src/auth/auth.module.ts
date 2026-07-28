import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PasswordHasher } from './services/password-hasher.service';

export function parseAccessTokenLifetime(value: string | undefined): number {
  if (value === undefined) {
    return 900;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error('JWT_ACCESS_EXPIRES_IN_SECONDS must be a positive integer');
  }

  return parsed;
}

export function requireJwtSecret(value: string | undefined): string {
  if (value === undefined || value.trim().length === 0) {
    throw new Error('JWT_SECRET must be a non-empty string');
  }

  return value;
}

@Module({
  imports: [
    ConfigModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const expiresIn = parseAccessTokenLifetime(
          config.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS'),
        );

        return {
          secret: requireJwtSecret(config.get<string>('JWT_SECRET')),
          signOptions: { expiresIn },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordHasher,
    {
      provide: 'JWT_ACCESS_EXPIRES_IN_SECONDS',
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        parseAccessTokenLifetime(
          config.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS'),
        ),
    },
  ],
})
export class AuthModule {}
