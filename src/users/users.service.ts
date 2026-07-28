import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailAlreadyExistsError } from './errors/email-already-exists.error';
import { User } from './entities/user.entity';
import { CreateUserInput } from './types/create-user.input';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  findByEmail(
    email: string,
    options: { withDeleted?: boolean } = {},
  ): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email: email.trim().toLowerCase() },
      withDeleted: options.withDeleted ?? false,
    });
  }

  findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(input: CreateUserInput): Promise<User> {
    const user = this.usersRepository.create({
      ...input,
      email: input.email.trim().toLowerCase(),
    });

    try {
      return await this.usersRepository.save(user);
    } catch (error: unknown) {
      if (
        isPostgresError(error) &&
        error.code === '23505' &&
        error.constraint === 'IDX_users_email_lower_unique'
      ) {
        throw new EmailAlreadyExistsError();
      }
      throw error;
    }
  }
}

function isPostgresError(
  error: unknown,
): error is { code: string; constraint?: string } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    typeof error.code === 'string'
  );
}
