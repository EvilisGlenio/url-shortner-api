import * as argon2 from 'argon2';
import { PasswordHasher } from './password-hasher.service';

describe('PasswordHasher', () => {
  const hasher = new PasswordHasher();

  it('creates an Argon2id hash and verifies the correct password', async () => {
    const hash = await hasher.hash('StrongPass123');
    expect(hash).not.toBe('StrongPass123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
    await expect(hasher.verify(hash, 'StrongPass123')).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await argon2.hash('StrongPass123', { type: argon2.argon2id });
    await expect(hasher.verify(hash, 'WrongPass123')).resolves.toBe(false);
  });
});
