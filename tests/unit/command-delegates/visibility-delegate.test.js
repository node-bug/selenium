import { jest } from '@jest/globals';

// ---------------- MOCKS ----------------
const mockDriver = {
  executeScript: jest.fn(),
  switchTo: jest.fn(),
  actions: jest.fn(),
};

jest.unstable_mockModule('selenium-webdriver', () => ({
  Builder: jest.fn(),
  By: {},
  until: {},
  WebDriver: jest.fn(() => mockDriver),
  Key: {
    ARROW_RIGHT: '\uE015',
  },
}));

jest.unstable_mockModule('@nodebug/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock messenger module
jest.unstable_mockModule('../../../app/messenger.js', () => ({
  default: jest.fn(() => ({ stack: [], action: 'write', data: '' })),
}));

// Mock config module
jest.unstable_mockModule('@nodebug/config', () => ({
  default: jest.fn((key) => {
    if (key === 'selenium') return { timeout: 5 };
    return {};
  }),
}));

// Mock browser findAll method
jest.unstable_mockModule('../../../app/browser/index.js', () => ({
  default: jest.fn(() => ({
    findAll: jest.fn(),
  })),
}));

// ---------------- IMPORTS ----------------
const { VisibilityDelegate } = await import('../../../app/command-delegates/visibility-delegate.js');

// ---------------- TESTS ----------------
describe('VisibilityDelegate (ESM)', () => {
  let mockBrowser;
  let visibilityDelegate;
  let mockElement;
  let mockSwitchTo;

  beforeEach(() => {
    jest.clearAllMocks();

    mockElement = {
      scrollIntoView: jest.fn(),
      isEnabled: jest.fn(),
      getAttribute: jest.fn(),
      style: {
        opacity: '1',
      },
    };

    mockSwitchTo = {
      defaultContent: jest.fn(),
      frame: jest.fn(),
    };

    mockDriver.switchTo.mockReturnValue(mockSwitchTo);

    mockBrowser = {
      driver: mockDriver,
      stack: ['test'],
      locatorStrategy: { build: jest.fn() },
      handleError: jest.fn(),
      message: null,
      _finder: jest.fn().mockResolvedValue(mockElement),
      findAll: jest.fn().mockResolvedValue([mockElement]),
    };

    visibilityDelegate = new VisibilityDelegate(mockBrowser);
  });

  // ---------------- SCROLL ----------------
  describe('scroll()', () => {
    test('scrolls element into view with default alignToTop=true', async () => {
      await visibilityDelegate.scroll();

      expect(mockBrowser._finder).toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        'arguments[0].scrollIntoView({ behavior: "instant", block: arguments[1] ? "start" : "end" });',
        mockElement,
        true
      );
    });

    test('scrolls element into view with alignToTop=false', async () => {
      await visibilityDelegate.scroll(false);

      expect(mockBrowser._finder).toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        'arguments[0].scrollIntoView({ behavior: "instant", block: arguments[1] ? "start" : "end" });',
        mockElement,
        false
      );
    });

    test('scrolls element to right alignment', async () => {
      await visibilityDelegate.scroll('right');

      expect(mockBrowser._finder).toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        'arguments[0].scrollIntoView({ behavior: "instant", block: arguments[1] ? "start" : "end" });',
        mockElement,
        'right'
      );
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        'arguments[0].scrollLeft = arguments[0].scrollWidth;',
        mockElement
      );
    });

    test('handles error from scroll', async () => {
      const error = new Error('fail');
      mockBrowser._finder.mockRejectedValue(error);

      await visibilityDelegate.scroll();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'scrolling into view'
      );
    });
  });

  // ---------------- ISVISIBLE ----------------
  describe('_isVisible()', () => {
    test('returns true when element is found', async () => {
      const result = await visibilityDelegate._isVisible();

      expect(mockBrowser._finder).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('returns false when element is not found', async () => {
      const error = new Error('not found');
      mockBrowser._finder.mockRejectedValue(error);

      const result = await visibilityDelegate._isVisible();

      // Note: _isVisible() catches the error but doesn't re-throw it or call handleError
      // The error is only logged with log.warn
      expect(result).toBe(false);
    });

    test('uses custom timeout when provided', async () => {
      await visibilityDelegate._isVisible(5000);

      expect(mockBrowser._finder).toHaveBeenCalledWith(5000);
    });
  });

  // ---------------- ISNOTVISIBLE ----------------
  describe('_isNotVisible()', () => {
    test('returns true when element is not found (not visible)', async () => {
      const error = new Error('not found');
      mockBrowser._finder.mockRejectedValue(error);

      const result = await visibilityDelegate._isNotVisible(100);

      expect(result).toBe(true);
    });

    test('returns false when element is found (visible)', async () => {
      mockBrowser._finder.mockResolvedValue(mockElement);

      const result = await visibilityDelegate._isNotVisible(100);

      expect(result).toBe(false);
    });

    test('uses custom timeout when provided', async () => {
      const error = new Error('not found');
      mockBrowser._finder.mockRejectedValue(error);

      await visibilityDelegate._isNotVisible(5000);

      expect(mockBrowser._finder).toHaveBeenCalled();
    });
  });

  // ---------------- ISDISABLED ----------------
  describe('_isDisabled()', () => {
    test('returns true when element is disabled', async () => {
      mockBrowser._finder.mockResolvedValue({
        isEnabled: jest.fn().mockResolvedValue(false),
        getAttribute: jest.fn().mockResolvedValue(null),
      });

      const result = await visibilityDelegate._isDisabled();

      expect(result).toBe(true);
    });

    test('returns false when element is enabled', async () => {
      mockBrowser._finder.mockResolvedValue({
        isEnabled: jest.fn().mockResolvedValue(true),
        getAttribute: jest.fn().mockResolvedValue(null),
      });

      const result = await visibilityDelegate._isDisabled();

      expect(result).toBe(false);
    });
  });

  // ---------------- HIDE ----------------
  describe('hide()', () => {
    test('hides all matching elements', async () => {
      const result = await visibilityDelegate.hide();

      expect(mockBrowser.findAll).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  // ---------------- UNHIDE ----------------
  describe('unhide()', () => {
    test('restores visibility to all matching elements', async () => {
      const result = await visibilityDelegate.unhide();

      expect(mockBrowser.findAll).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});