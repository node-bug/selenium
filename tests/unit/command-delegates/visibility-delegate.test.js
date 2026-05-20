import { vi } from 'vitest';

// ---------------- MOCKS ----------------
const mockDriver = {
  executeScript: vi.fn(),
  switchTo: vi.fn(),
  actions: vi.fn(),
};

vi.mock('selenium-webdriver', () => ({
  Builder: vi.fn(),
  By: {},
  until: {},
  WebDriver: vi.fn(() => mockDriver),
  Key: {
    ARROW_RIGHT: '\uE015',
  },
}));

vi.mock('@nodebug/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
  },
}));

// Mock messenger module
vi.mock('../../../app/messenger.js', () => ({
  default: vi.fn(() => ({ stack: [], action: 'write', data: '' })),
}));

// Mock config module
vi.mock('@nodebug/config', () => ({
  default: vi.fn((key) => {
    if (key === 'selenium') return { timeout: 5 };
    return {};
  }),
}));

// Mock browser findAll method
vi.mock('../../../app/browser/index.js', () => ({
  default: vi.fn(() => ({
    findAll: vi.fn(),
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
    vi.clearAllMocks();

    mockElement = {
      scrollIntoView: vi.fn(),
      isEnabled: vi.fn(),
      getAttribute: vi.fn(),
      style: {
        opacity: '1',
      },
    };

    mockSwitchTo = {
      defaultContent: vi.fn(),
      frame: vi.fn(),
    };

    mockDriver.switchTo.mockReturnValue(mockSwitchTo);

    mockBrowser = {
      driver: mockDriver,
      stack: ['test'],
      locatorStrategy: { build: vi.fn() },
      handleError: vi.fn(),
      message: null,
      _finder: vi.fn().mockResolvedValue(mockElement),
      findAll: vi.fn().mockResolvedValue([mockElement]),
    };

    visibilityDelegate = new VisibilityDelegate(mockBrowser);
  });

  // ---------------- SCROLL INTO VIEW ----------------
  describe('scroll.into.view()', () => {
    test('scrolls element into view with center alignment', async () => {
      await visibilityDelegate.scroll.into.view();

      expect(mockBrowser._finder).toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        'arguments[0].scrollIntoView({ behavior: "instant", block: "center", inline: "center" });',
        mockElement
      );
    });

    test('handles error from scroll.into.view', async () => {
      const error = new Error('fail');
      mockBrowser._finder.mockRejectedValue(error);

      await visibilityDelegate.scroll.into.view();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'scrolling into view'
      );
    });
  });

  // ---------------- SCROLL TO TOP ----------------
  describe('scroll.to.top()', () => {
    test('scrolls element to top', async () => {
      await visibilityDelegate.scroll.to.top();

      expect(mockBrowser._finder).toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        'arguments[0].scrollTop = 0;',
        mockElement
      );
    });

    test('handles error from scroll.to.top', async () => {
      const error = new Error('fail');
      mockBrowser._finder.mockRejectedValue(error);

      await visibilityDelegate.scroll.to.top();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'scrolling element to top'
      );
    });
  });

  // ---------------- SCROLL TO BOTTOM ----------------
  describe('scroll.to.bottom()', () => {
    test('scrolls element to bottom', async () => {
      await visibilityDelegate.scroll.to.bottom();

      expect(mockBrowser._finder).toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        'arguments[0].scrollTop = arguments[0].scrollHeight;',
        mockElement
      );
    });

    test('handles error from scroll.to.bottom', async () => {
      const error = new Error('fail');
      mockBrowser._finder.mockRejectedValue(error);

      await visibilityDelegate.scroll.to.bottom();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'scrolling element to bottom'
      );
    });
  });

  // ---------------- SCROLL TO LEFT ----------------
  describe('scroll.to.left()', () => {
    test('scrolls element to left', async () => {
      await visibilityDelegate.scroll.to.left();

      expect(mockBrowser._finder).toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        'arguments[0].scrollLeft = 0;',
        mockElement
      );
    });

    test('handles error from scroll.to.left', async () => {
      const error = new Error('fail');
      mockBrowser._finder.mockRejectedValue(error);

      await visibilityDelegate.scroll.to.left();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'scrolling element to left'
      );
    });
  });

  // ---------------- SCROLL TO RIGHT ----------------
  describe('scroll.to.right()', () => {
    test('scrolls element to right', async () => {
      await visibilityDelegate.scroll.to.right();

      expect(mockBrowser._finder).toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        'arguments[0].scrollLeft = arguments[0].scrollWidth;',
        mockElement
      );
    });

    test('handles error from scroll.to.right', async () => {
      const error = new Error('fail');
      mockBrowser._finder.mockRejectedValue(error);

      await visibilityDelegate.scroll.to.right();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'scrolling element to right'
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
        isEnabled: vi.fn().mockResolvedValue(false),
        getAttribute: vi.fn().mockResolvedValue(null),
      });

      const result = await visibilityDelegate._isDisabled();

      expect(result).toBe(true);
    });

    test('returns false when element is enabled', async () => {
      mockBrowser._finder.mockResolvedValue({
        isEnabled: vi.fn().mockResolvedValue(true),
        getAttribute: vi.fn().mockResolvedValue(null),
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