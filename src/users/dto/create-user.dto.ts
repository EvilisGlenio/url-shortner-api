import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsString({
    message: 'Name must be a string',
  })
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsNotEmpty()
  @MinLength(8, {
    message: 'Password hash must be at least 8 characters long',
  })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    },
    {
      message:
        'Password hash must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
    },
  )
  passwordHash!: string;
}
