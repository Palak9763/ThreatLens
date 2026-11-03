import { describe, expect, it } from 'vitest';
import { detectIocType } from './ioc-lookup.component';

describe('detectIocType', () => {
  it('detects IPv4 addresses', () => expect(detectIocType('185.220.101.45')).toBe('ip'));
  it('rejects invalid IPv4 octets', () => expect(detectIocType('999.1.1.1')).toBeNull());
  it('detects domains', () => expect(detectIocType('secure-login-verify.com')).toBe('domain'));
  it('detects URLs', () => expect(detectIocType('http://evil.top/payload.exe')).toBe('url'));
  it('detects MD5 / SHA-256 hashes', () => {
    expect(detectIocType('d41d8cd98f00b204e9800998ecf8427e')).toBe('hash');
    expect(detectIocType('a'.repeat(64))).toBe('hash');
  });
  it('rejects random text', () => expect(detectIocType('hello world')).toBeNull());
});
