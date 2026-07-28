import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailAlreadyExistsError } from './errors/email-already-exists.error';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { CreateUserInput } from './types/create-user.input';

describe('UsersService', () => {
  let service: UsersService;
  const repository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const input: CreateUserInput = {
    name: 'Evilis Gomes',
    email: '  EVILIS@EXAMPLE.COM ',
    passwordHash: 'stored-hash',
  };

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: repository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('looks up a normalized email without deleted users by default', async () => {
    const user = { id: '8b3e7eeb-0aef-4d40-8bf4-8248ec92f3b1' } as User;
    repository.findOne.mockResolvedValue(user);

    await expect(service.findByEmail('  EVILIS@EXAMPLE.COM ')).resolves.toBe(
      user,
    );
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { email: 'evilis@example.com' },
      withDeleted: false,
    });
  });

  it('looks up a normalized email including soft-deleted users when requested', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(
      service.findByEmail('  EVILIS@EXAMPLE.COM ', { withDeleted: true }),
    ).resolves.toBeNull();
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { email: 'evilis@example.com' },
      withDeleted: true,
    });
  });

  it('finds a user by its UUID string', async () => {
    const id = '8b3e7eeb-0aef-4d40-8bf4-8248ec92f3b1';
    const user = { id } as User;
    repository.findOne.mockResolvedValue(user);

    await expect(service.findById(id)).resolves.toBe(user);
    expect(repository.findOne).toHaveBeenCalledWith({ where: { id } });
  });

  it('creates and saves a user with a normalized email', async () => {
    const createdUser = {
      id: '8b3e7eeb-0aef-4d40-8bf4-8248ec92f3b1',
      ...input,
      email: 'evilis@example.com',
    } as User;
    repository.create.mockReturnValue(createdUser);
    repository.save.mockResolvedValue(createdUser);

    await expect(service.create(input)).resolves.toBe(createdUser);
    expect(repository.create).toHaveBeenCalledWith({
      name: 'Evilis Gomes',
      email: 'evilis@example.com',
      passwordHash: 'stored-hash',
    });
    expect(repository.save).toHaveBeenCalledWith(createdUser);
  });

  it('translates the intended email uniqueness violation', async () => {
    const duplicate = Object.assign(new Error('duplicate'), {
      code: '23505',
      constraint: 'IDX_users_email_lower_unique',
    });
    repository.create.mockReturnValue({ ...input });
    repository.save.mockRejectedValue(duplicate);

    await expect(service.create(input)).rejects.toBeInstanceOf(
      EmailAlreadyExistsError,
    );
  });

  it('rethrows a different uniqueness constraint violation unchanged', async () => {
    const otherUniqueViolation = Object.assign(new Error('duplicate'), {
      code: '23505',
      constraint: 'UQ_users_username',
    });
    repository.create.mockReturnValue({ ...input });
    repository.save.mockRejectedValue(otherUniqueViolation);

    await expect(service.create(input)).rejects.toBe(otherUniqueViolation);
  });

  it('rethrows unrelated persistence errors unchanged', async () => {
    const foreignKeyViolation = Object.assign(new Error('foreign key'), {
      code: '23503',
      constraint: 'FK_users_organization',
    });
    repository.create.mockReturnValue({ ...input });
    repository.save.mockRejectedValue(foreignKeyViolation);

    await expect(service.create(input)).rejects.toBe(foreignKeyViolation);
  });
});
