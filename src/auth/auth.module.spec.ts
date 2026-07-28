import { parseAccessTokenLifetime, requireJwtSecret } from './auth.module';

describe('parseAccessTokenLifetime', () => {
  it('defaults an undefined lifetime to 900 seconds', () => {
    expect(parseAccessTokenLifetime(undefined)).toBe(900);
  });

  it('converts a positive integer string to a number of seconds', () => {
    expect(parseAccessTokenLifetime('3600')).toBe(3600);
  });

  it.each(['0', '-1', '1.5', 'not-a-number', ''])(
    'rejects invalid lifetime %p with the required message',
    (value) => {
      expect(() => parseAccessTokenLifetime(value)).toThrow(
        'JWT_ACCESS_EXPIRES_IN_SECONDS must be a positive integer',
      );
    },
  );
});

describe('requireJwtSecret', () => {
  it('returns a valid secret unchanged', () => {
    expect(requireJwtSecret('a-valid-jwt-secret')).toBe('a-valid-jwt-secret');
  });

  it.each([undefined, '', '   '])(
    'rejects invalid secret %p with the required message',
    (value) => {
      expect(() => requireJwtSecret(value)).toThrow(
        'JWT_SECRET must be a non-empty string',
      );
    },
  );
});
