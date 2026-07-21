import { vi, describe, it, expect, beforeEach } from 'vitest';

// Control what `config('selenium')` returns so we can exercise the
// `ignoredTags` normalization logic in app/config.js.
const { configMock } = vi.hoisted(() => ({ configMock: vi.fn(() => ({})) }));
vi.mock('@nodebug/config', () => ({ default: configMock }));

// Silence real logging during config normalization.
vi.mock('@nodebug/logger', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

describe('config - ignoredTags', () => {
  beforeEach(() => {
    // Re-evaluate app/config.js per test so each case sees a fresh `selenium` object
    // built from the configMock value set below.
    vi.resetModules();
    configMock.mockReset();
  });

  it('defaults ignoredTags to [] when the key is absent', async () => {
    configMock.mockReturnValue({});
    const { selenium } = await import('../../app/config.js');
    expect(selenium.ignoredTags).toEqual([]);
  });

  it('preserves an explicitly empty ignoredTags array', async () => {
    configMock.mockReturnValue({ ignoredTags: [] });
    const { selenium } = await import('../../app/config.js');
    expect(selenium.ignoredTags).toEqual([]);
  });

  it('normalizes tag names to trimmed uppercase', async () => {
    configMock.mockReturnValue({ ignoredTags: ['svg', '  Mark ', 'NOSCRIPT'] });
    const { selenium } = await import('../../app/config.js');
    expect(selenium.ignoredTags).toEqual(['SVG', 'MARK', 'NOSCRIPT']);
  });

  it('falls back to [] when ignoredTags is a non-array string', async () => {
    configMock.mockReturnValue({ ignoredTags: 'svg' });
    const { selenium } = await import('../../app/config.js');
    expect(selenium.ignoredTags).toEqual([]);
  });

  it('falls back to [] when ignoredTags is null', async () => {
    configMock.mockReturnValue({ ignoredTags: null });
    const { selenium } = await import('../../app/config.js');
    expect(selenium.ignoredTags).toEqual([]);
  });

  it('falls back to [] when ignoredTags is a number', async () => {
    configMock.mockReturnValue({ ignoredTags: 42 });
    const { selenium } = await import('../../app/config.js');
    expect(selenium.ignoredTags).toEqual([]);
  });

  it('keeps other config values intact when ignoredTags is provided', async () => {
    configMock.mockReturnValue({ browser: 'firefox', timeout: 5000, ignoredTags: ['svg'] });
    const { selenium } = await import('../../app/config.js');
    expect(selenium.browser).toBe('firefox');
    expect(selenium.timeout).toBe(5000);
    expect(selenium.ignoredTags).toEqual(['SVG']);
  });
});
