import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterDto } from './register.dto';

describe('RegisterDto', () => {
  it('normalizes name and email without changing password', async () => {
    const dto = plainToInstance(RegisterDto, {
      name: '  Evilis Gomes  ',
      email: '  Evilis@Example.COM ',
      password: ' StrongPass123 ',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toEqual({
      name: 'Evilis Gomes',
      email: 'evilis@example.com',
      password: ' StrongPass123 ',
    });
  });

  it.each([
    { value: {}, label: 'missing fields' },
    {
      value: {
        name: '',
        email: 'evilis@example.com',
        password: 'StrongPass123',
      },
      label: 'empty name',
    },
    {
      value: {
        name: 'Evilis',
        email: 'invalid',
        password: 'StrongPass123',
      },
      label: 'invalid email',
    },
    {
      value: {
        name: 'Evilis',
        email: 'evilis@example.com',
        password: 'password',
      },
      label: 'weak password',
    },
  ])('rejects $label', async ({ value }) => {
    expect(
      await validate(plainToInstance(RegisterDto, value)),
    ).not.toHaveLength(0);
  });
});
