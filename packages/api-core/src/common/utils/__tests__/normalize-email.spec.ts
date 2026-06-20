import { describe, expect, it } from 'vitest';

import { normalizeEmail } from '../normalize-email';

describe('normalizeEmail', () => {
  it('lowercases and trims surrounding whitespace', () => {
    expect(normalizeEmail('  Foo.Bar@Example.COM ')).toBe('foo.bar@example.com');
  });

  it('leaves an already-normalized address unchanged', () => {
    expect(normalizeEmail('user@example.com')).toBe('user@example.com');
  });
});
