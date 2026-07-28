import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { EmailAlreadyExistsError } from '../users/errors/email-already-exists.error';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { RegistrationResponse } from './responses/registration.response';
import { PasswordHasher } from './services/password-hasher.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    @Inject('JWT_ACCESS_EXPIRES_IN_SECONDS')
    private readonly accessExpiresIn: number,
  ) {}

  async register(dto: RegisterDto): Promise<RegistrationResponse> {
    const email = dto.email.trim().toLowerCase();
    const existing = await this.usersService.findByEmail(email, {
      withDeleted: true,
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);

    let user: User;
    try {
      user = await this.usersService.create({
        name: dto.name,
        email,
        passwordHash,
      });
    } catch (error: unknown) {
      if (error instanceof EmailAlreadyExistsError) {
        throw new ConflictException('Email already registered');
      }
      throw error;
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      email: user.email,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.accessExpiresIn,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    };
  }
}
