import { describe, expect, it } from 'vitest';

import { durationToMilliseconds } from '../duration';

describe('durationToMilliseconds', () => {
  it.each([
    ['1s', 1000],
    ['15m', 15 * 60 * 1000],
    ['2h', 2 * 60 * 60 * 1000],
    ['7d', 7 * 24 * 60 * 60 * 1000],
    ['2w', 2 * 7 * 24 * 60 * 60 * 1000],
    ['0s', 0],
  ])('parses %s', (input, expected) => {
    expect(durationToMilliseconds(input)).toBe(expected);
  });

  it('trims surrounding whitespace before parsing', () => {
    expect(durationToMilliseconds('  30s ')).toBe(30 * 1000);
  });

  it.each(['abc', '10', 'm', '10x', '1.5h', '-5s', ''])(
    'throws on unsupported value %s',
    (input) => {
      expect(() => durationToMilliseconds(input)).toThrow(/Unsupported duration/);
    },
  );
});
