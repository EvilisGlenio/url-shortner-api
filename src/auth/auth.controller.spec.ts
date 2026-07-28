import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RegistrationResponse } from './responses/registration.response';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    register: jest.fn(),
  };

  const dto: RegisterDto = {
    name: 'Evilis Gomes',
    email: 'evilis@example.com',
    password: 'StrongPass123',
  };
  const response: RegistrationResponse = {
    accessToken: 'signed-access-token',
    tokenType: 'Bearer',
    expiresIn: 900,
    user: {
      id: '8b3e7eeb-0aef-4d40-8bf4-8248ec92f3b1',
      name: 'Evilis Gomes',
      email: 'evilis@example.com',
      createdAt: new Date('2026-07-27T12:34:56.000Z'),
    },
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('delegates registration and returns the service response', async () => {
    authService.register.mockResolvedValue(response);

    await expect(controller.register(dto)).resolves.toEqual(response);
    expect(authService.register).toHaveBeenCalledWith(dto);
  });

  it('exposes POST /auth/register with status 201', () => {
    const register = Object.getOwnPropertyDescriptor(
      AuthController.prototype,
      'register',
    )?.value as AuthController['register'];

    expect(Reflect.getMetadata('path', AuthController)).toBe('auth');
    expect(Reflect.getMetadata('path', register)).toBe('register');
    expect(Reflect.getMetadata('__httpCode__', register)).toBe(
      HttpStatus.CREATED,
    );
  });
});
