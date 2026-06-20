import { describe, expect, it } from 'vitest';

import { redactSensitive } from '../redact';

describe('redactSensitive', () => {
  it('redacts sensitive keys regardless of key casing', () => {
    expect(
      redactSensitive({
        Authorization: 'Bearer secret',
        nested: {
          password: 'plain-text',
          RefreshToken: 'refresh-secret',
        },
      }),
    ).toEqual({
      Authorization: '[REDACTED]',
      nested: {
        password: '[REDACTED]',
        RefreshToken: '[REDACTED]',
      },
    });
  });

  it('preserves non-sensitive values while traversing arrays', () => {
    expect(
      redactSensitive([
        { token: 'secret' },
        { label: 'safe', access: { foo: 'bar' } },
      ]),
    ).toEqual([
      { token: '[REDACTED]' },
      { label: 'safe', access: { foo: 'bar' } },
    ]);
  });

  it('handles circular references without overflowing the stack', () => {
    const node: Record<string, unknown> = { label: 'root', password: 'secret' };
    node.self = node;

    const result = redactSensitive(node) as Record<string, unknown>;

    expect(result.label).toBe('root');
    expect(result.password).toBe('[REDACTED]');
    expect(result.self).toBe('[Circular]');
  });
});
