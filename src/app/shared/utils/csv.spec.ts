import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('returns empty string for no rows', () => expect(toCsv([])).toBe(''));
  it('creates header and quoted rows', () => {
    expect(toCsv([{ a: 1, b: 'x' }])).toBe('a,b\n"1","x"');
  });
  it('escapes double quotes', () => {
    expect(toCsv([{ a: 'say "hi"' }])).toBe('a\n"say ""hi"""');
  });
});
