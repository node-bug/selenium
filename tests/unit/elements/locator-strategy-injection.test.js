import { vi, describe, it, expect, beforeEach } from 'vitest';

// Control `selenium.ignoredTags` seen by LocatorStrategy.
const { configMock } = vi.hoisted(() => ({ configMock: vi.fn(() => ({})) }));
vi.mock('@nodebug/config', () => ({ default: configMock }));

// Avoid hitting disk for the ElementFinder bundle; return a bundle that defines
// window.ElementFinder so the verify step in _injectElementFinder passes. The mock
// method name deliberately avoids the literal "addIgnoredTags" so tests can match
// the real addIgnoredTags call (which the implementation emits separately).
const { readFileMock } = vi.hoisted(() => ({
  readFileMock: vi.fn().mockResolvedValue('var ElementFinder = (() => ({ applyIgnored() {} }))();'),
}));
vi.mock('fs/promises', () => ({ readFile: readFileMock }));

vi.mock('@nodebug/logger', () => ({
  log: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

/**
 * Builds a fresh LocatorStrategy with a mock driver. Each call re-imports the module
 * so the `selenium.ignoredTags` value (from configMock) is re-read at construction time.
 */
async function makeLocatorStrategy() {
  vi.resetModules();
  const { LocatorStrategy } = await import('../../../app/elements/locator-strategy.js');
  const ls = new LocatorStrategy();
  const mockDriver = {
    switchTo: vi.fn().mockReturnValue({
      frame: vi.fn().mockResolvedValue(null),
      defaultContent: vi.fn().mockResolvedValue(null),
    }),
    executeScript: vi.fn(),
  };
  ls.driver = mockDriver;
  return { ls, mockDriver };
}

describe('LocatorStrategy injection unification + ignoredTags', () => {
  beforeEach(() => {
    readFileMock.mockClear();
    configMock.mockReset();
  });

  describe('_injectElementFinder applies addIgnoredTags', () => {
    it('calls addIgnoredTags after injecting when ignoredTags is configured', async () => {
      configMock.mockReturnValue({ ignoredTags: ['svg', 'MARK'] });
      const { ls, mockDriver } = await makeLocatorStrategy();

      // 1) exists check -> false, 2) inject bundle, 3) verify -> true, 4) addIgnoredTags
      mockDriver.executeScript
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(undefined);

      await ls._injectElementFinder();

      // The tags may be embedded in the script string OR passed as an executeScript
      // argument; assert the call happened and the normalized tags reached it either way.
      const addIgnoredCall = mockDriver.executeScript.mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('addIgnoredTags'),
      );
      expect(addIgnoredCall).toBeDefined();
      expect(JSON.stringify(addIgnoredCall)).toContain('SVG');
      expect(JSON.stringify(addIgnoredCall)).toContain('MARK');
    });

    it('does NOT call addIgnoredTags when ignoredTags is not configured', async () => {
      configMock.mockReturnValue({});
      const { ls, mockDriver } = await makeLocatorStrategy();

      mockDriver.executeScript
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(true);

      await ls._injectElementFinder();

      expect(mockDriver.executeScript).not.toHaveBeenCalledWith(expect.stringContaining('addIgnoredTags'));
    });

    it('applies addIgnoredTags even when ElementFinder is already present', async () => {
      configMock.mockReturnValue({ ignoredTags: ['svg'] });
      const { ls, mockDriver } = await makeLocatorStrategy();

      // 1) exists check -> true (already injected), 2) addIgnoredTags
      mockDriver.executeScript
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(undefined);

      await ls._injectElementFinder();

      expect(mockDriver.executeScript).toHaveBeenNthCalledWith(1, expect.stringContaining("typeof window.ElementFinder"));
      expect(mockDriver.executeScript).toHaveBeenNthCalledWith(2, expect.stringContaining('addIgnoredTags'));
    });

    it('caches the ElementFinder bundle so readFile runs only once across injects', async () => {
      configMock.mockReturnValue({});
      const { ls, mockDriver } = await makeLocatorStrategy();

      // First call: exists->false, inject, verify->true (3 calls; config empty so no addIgnoredTags).
      // Second call: exists->true (skip inject/readFile) (1 call).
      mockDriver.executeScript
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true);

      await ls._injectElementFinder();
      await ls._injectElementFinder();

      expect(readFileMock).toHaveBeenCalledTimes(1);
    });

    it('throws when injection fails to define window.ElementFinder', async () => {
      configMock.mockReturnValue({});
      const { ls, mockDriver } = await makeLocatorStrategy();

      mockDriver.executeScript
        .mockResolvedValueOnce(false) // exists -> false
        .mockResolvedValueOnce(undefined) // inject bundle
        .mockResolvedValueOnce(false); // verify -> still false

      await expect(ls._injectElementFinder()).rejects.toThrow(/ElementFinder script injection failed/);
    });
  });

  describe('frame search methods delegate to the unified injector', () => {
    it('_searchInFrame calls _injectElementFinder (no inline inject)', async () => {
      configMock.mockReturnValue({});
      const { ls, mockDriver } = await makeLocatorStrategy();

      const injectSpy = vi.spyOn(ls, '_injectElementFinder').mockResolvedValue(undefined);
      mockDriver.executeScript.mockResolvedValue({ elements: [] });

      const result = await ls._searchInFrame(-1, { id: 'x', type: 'element' });

      expect(injectSpy).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('_searchInFrame performs the real unified injection when ElementFinder is absent', async () => {
      configMock.mockReturnValue({ ignoredTags: ['svg'] });
      const { ls, mockDriver } = await makeLocatorStrategy();

      // _injectElementFinder: exists->false, inject, verify->true, addIgnoredTags
      // then _searchInFrame's findProbableElements call returns empty.
      mockDriver.executeScript
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ elements: [] });

      const result = await ls._searchInFrame(-1, { id: 'x', type: 'element' });

      expect(result).toEqual([]);
      // Proves the unified injector ran (read the bundle) rather than an inline inject block.
      expect(readFileMock).toHaveBeenCalled();
      const addIgnoredCall = mockDriver.executeScript.mock.calls.find(
        (c) => typeof c[0] === 'string' && c[0].includes('addIgnoredTags'),
      );
      expect(addIgnoredCall).toBeDefined();
    });

    it('_searchSwitchInFrame calls _injectElementFinder (no inline inject)', async () => {
      configMock.mockReturnValue({});
      const { ls, mockDriver } = await makeLocatorStrategy();

      const injectSpy = vi.spyOn(ls, '_injectElementFinder').mockResolvedValue(undefined);
      // findProbableElements returns no direct matches -> falls through to label search
      mockDriver.executeScript.mockResolvedValue({ elements: [] });

      const result = await ls._searchSwitchInFrame(-1, { id: 'x', type: 'switch' });

      expect(injectSpy).toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('_findClosestSwitchInFrame calls _injectElementFinder (no inline inject)', async () => {
      configMock.mockReturnValue({});
      const { ls, mockDriver } = await makeLocatorStrategy();

      const injectSpy = vi.spyOn(ls, '_injectElementFinder').mockResolvedValue(undefined);
      mockDriver.executeScript.mockResolvedValue(null);

      const result = await ls._findClosestSwitchInFrame(-1, { id: 'x', type: 'switch' }, 500);

      expect(injectSpy).toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });
});
