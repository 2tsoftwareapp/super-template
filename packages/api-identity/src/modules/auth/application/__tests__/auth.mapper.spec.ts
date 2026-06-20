import { describe, expect, it } from 'vitest';

import { AuthMapper } from '../auth.mapper';

describe('AuthMapper', () => {
  const mapper = new AuthMapper();

  it('marks the current session in session DTOs', () => {
    const session = {
      id: 'session-1',
      userId: 'user-1',
      expiresAt: new Date('2026-01-01T00:00:00.000Z'),
      revokedAt: null,
      lastUsedAt: new Date('2026-01-01T00:00:00.000Z'),
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    expect(mapper.toSessionDto(session, 'session-1').current).toBe(true);
    expect(mapper.toSessionDto(session, 'other-session').current).toBe(false);
  });
});
