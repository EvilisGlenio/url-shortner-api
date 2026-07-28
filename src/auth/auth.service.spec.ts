import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailAlreadyExistsError } from '../users/errors/email-already-exists.error';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { PasswordHasher } from './services/password-hasher.service';

describe('AuthService', () => {
  let service: AuthService;

  const usersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
  };
  const passwordHasher = {
    hash: jest.fn(),
  };
  const jwtService = {
    signAsync: jest.fn(),
  };
  const accessExpiresIn = 7200;
  const registeredAt = new Date('2026-07-27T12:34:56.000Z');
  const updatedAt = new Date('2026-07-27T12:35:56.000Z');
  const dto: RegisterDto = {
    name: 'Evilis Gomes',
    email: '  EVILIS@EXAMPLE.COM ',
    password: 'StrongPass123',
  };

  const user: User = {
    id: '8b3e7eeb-0aef-4d40-8bf4-8248ec92f3b1',
    name: 'Evilis Gomes',
    email: 'evilis@example.com',
    passwordHash: 'stored-hash',
    createdAt: registeredAt,
    updatedAt,
    deletedAt: null,
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: usersService,
        },
        {
          provide: PasswordHasher,
          useValue: passwordHasher,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: 'JWT_ACCESS_EXPIRES_IN_SECONDS',
          useValue: accessExpiresIn,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('registers a normalized email and returns only the safe response fields', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('stored-hash');
    usersService.create.mockResolvedValue(user);
    jwtService.signAsync.mockResolvedValue('signed-access-token');

    const result = await service.register(dto);

    expect(usersService.findByEmail).toHaveBeenCalledWith(
      'evilis@example.com',
      { withDeleted: true },
    );
    expect(passwordHasher.hash).toHaveBeenCalledWith('StrongPass123');
    expect(usersService.create).toHaveBeenCalledWith({
      name: 'Evilis Gomes',
      email: 'evilis@example.com',
      passwordHash: 'stored-hash',
    });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: user.id,
      email: user.email,
    });
    expect(result).toStrictEqual({
      accessToken: 'signed-access-token',
      tokenType: 'Bearer',
      expiresIn: 7200,
      user: {
        id: '8b3e7eeb-0aef-4d40-8bf4-8248ec92f3b1',
        name: 'Evilis Gomes',
        email: 'evilis@example.com',
        createdAt: registeredAt,
      },
    });
    expect(result).not.toHaveProperty('password');
    expect(result.user).not.toHaveProperty('passwordHash');
  });

  it('rejects an active email duplicate', async () => {
    usersService.findByEmail.mockResolvedValue(user);

    await expect(service.register(dto)).rejects.toEqual(
      expect.objectContaining({
        message: 'Email already registered',
        status: 409,
      }),
    );
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('rejects a soft-deleted email duplicate', async () => {
    usersService.findByEmail.mockResolvedValue({
      ...user,
      deletedAt: new Date('2026-07-28T00:00:00.000Z'),
    });

    await expect(service.register(dto)).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(passwordHasher.hash).not.toHaveBeenCalled();
    expect(usersService.create).not.toHaveBeenCalled();
  });

  it('converts a race-condition email duplicate to a conflict', async () => {
    usersService.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('stored-hash');
    usersService.create.mockRejectedValue(new EmailAlreadyExistsError());

    await expect(service.register(dto)).rejects.toEqual(
      expect.objectContaining({
        message: 'Email already registered',
        status: 409,
      }),
    );
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rethrows hashing errors unchanged', async () => {
    const hashingError = new Error('hashing unavailable');
    usersService.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockRejectedValue(hashingError);

    await expect(service.register(dto)).rejects.toBe(hashingError);
    expect(usersService.create).not.toHaveBeenCalled();
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });

  it('rethrows signing errors unchanged', async () => {
    const signingError = new EmailAlreadyExistsError();
    usersService.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('stored-hash');
    usersService.create.mockResolvedValue(user);
    jwtService.signAsync.mockRejectedValue(signingError);

    await expect(service.register(dto)).rejects.toBe(signingError);
  });

  it('rethrows unrelated persistence errors unchanged', async () => {
    const databaseError = new Error('database unavailable');
    usersService.findByEmail.mockResolvedValue(null);
    passwordHasher.hash.mockResolvedValue('stored-hash');
    usersService.create.mockRejectedValue(databaseError);

    await expect(service.register(dto)).rejects.toBe(databaseError);
    expect(jwtService.signAsync).not.toHaveBeenCalled();
  });
});
