import { describe, expect, it } from 'vitest';
import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  const pipe = new TimeAgoPipe();
  const ago = (min: number) => new Date(Date.now() - min * 60_000);

  it('returns a dash for empty values', () => expect(pipe.transform(null)).toBe('—'));
  it('shows "just now" for under a minute', () => expect(pipe.transform(new Date())).toBe('just now'));
  it('shows minutes', () => expect(pipe.transform(ago(5))).toBe('5 min ago'));
  it('shows hours', () => expect(pipe.transform(ago(180))).toBe('3 hr ago'));
  it('shows days with plural', () => expect(pipe.transform(ago(60 * 24 * 2))).toBe('2 days ago'));
});
