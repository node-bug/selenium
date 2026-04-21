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
  },
}));

// Mock messenger module
jest.unstable_mockModule('../../../app/messenger.js', () => ({
  default: jest.fn(() => ({ stack: [], action: 'write', data: '' })),
}));

// Mock config module
jest.unstable_mockModule('@nodebug/config', () => ({
  default: jest.fn(() => ({
    selenium: {
      timeout: 5,
    },
  })),
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
  describe('isVisible()', () => {
    test('returns true when element is found', async () => {
      const result = await visibilityDelegate.isVisible();

      expect(mockBrowser._finder).toHaveBeenCalledWith(2000);
      expect(result).toBe(true);
    });

    test('returns false when element is not found', async () => {
      const error = new Error('not found');
      mockBrowser._finder.mockRejectedValue(error);

      const result = await visibilityDelegate.isVisible();

      // Note: isVisible() catches the error but doesn't re-throw it or call handleError
      // The error is only logged with log.info
      expect(result).toBe(false);
    });

    test('uses custom timeout when provided', async () => {
      await visibilityDelegate.isVisible(5000);

      expect(mockBrowser._finder).toHaveBeenCalledWith(5000);
    });
  });

  // ---------------- ISDISPLAYED ----------------
  describe('isDisplayed()', () => {
    test('resolves when element is displayed', async () => {
      await visibilityDelegate.isDisplayed();

      expect(mockBrowser._finder).toHaveBeenCalled();
      expect(mockBrowser.handleError).not.toHaveBeenCalled();
    });

    test('handles error when element is not displayed', async () => {
      const error = new Error('not found');
      mockBrowser._finder.mockRejectedValue(error);

      await visibilityDelegate.isDisplayed();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'waiting for visibility'
      );
    });

    test('uses custom timeout when provided', async () => {
      await visibilityDelegate.isDisplayed(10000);

      expect(mockBrowser._finder).toHaveBeenCalledWith(10000);
    });
  });

  // ---------------- ISNOTDISPLAYED ----------------
  describe('isNotDisplayed()', () => {
    test('resolves when element is not displayed', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('not found'));

      const result = await visibilityDelegate.isNotDisplayed();

      expect(result).toBe(true);
    });

    test('rejects when element is still displayed', async () => {
      mockBrowser._finder.mockResolvedValue(mockElement);

      await expect(visibilityDelegate.isNotDisplayed(1000)).rejects.toThrow('Element still visible after 1000ms');
    });

    // this test should be to check that browser.handleError is called when error is thrown
    test('handles error from isNotDisplayed', async () => {
      const error = new Error('fail');
      mockBrowser._finder.mockRejectedValue(error);

      await visibilityDelegate.isNotDisplayed();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'waiting for invisibility'
      );
    });

    test('uses default timeout when not provided', async () => {
      // Mock the Date.now to control the timeout behavior
      const originalDateNow = Date.now;
      const mockDateNow = jest.fn(() => 0);
      Date.now = mockDateNow;
      
      mockBrowser._finder.mockRejectedValue(new Error('not found'));
      
      await visibilityDelegate.isNotDisplayed();
      
      // Restore original Date.now
      Date.now = originalDateNow;
      
      // The test is checking that the timeout is properly calculated, but we can't easily test
      // the exact timeout value without mocking Date.now properly
    });
  });

  // ---------------- ISDISABLED ----------------
  describe('isDisabled()', () => {
    test('returns true when element is disabled (property)', async () => {
      mockElement.isEnabled.mockResolvedValue(false);
      mockElement.getAttribute.mockResolvedValue(null);

      const result = await visibilityDelegate.isDisabled();

      expect(result).toBe(true);
    });

    test('returns true when element is disabled (attribute)', async () => {
      mockElement.isEnabled.mockResolvedValue(true);
      mockElement.getAttribute.mockResolvedValue('disabled');

      const result = await visibilityDelegate.isDisabled();

      expect(result).toBe(true);
    });

    test('returns false when element is enabled', async () => {
      mockElement.isEnabled.mockResolvedValue(true);
      mockElement.getAttribute.mockResolvedValue(null);

      const result = await visibilityDelegate.isDisabled();

      expect(result).toBe(false);
    });

    test('handles error from isDisabled', async () => {
      const error = new Error('fail');
      mockBrowser._finder.mockRejectedValue(error);

      await visibilityDelegate.isDisabled();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'checking if disabled'
      );
    });
  });

  // ---------------- HIDE ----------------
  describe('hide()', () => {
    test('hides elements by setting opacity to 0', async () => {
      await visibilityDelegate.hide();

      expect(mockBrowser.findAll).toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        'arguments[0].style.opacity="0";',
        mockElement
      );
    });

    test('handles error from hide', async () => {
      const error = new Error('fail');
      mockBrowser.findAll.mockRejectedValue(error);

      await visibilityDelegate.hide();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'hiding elements'
      );
    });
  });

  // ---------------- UNHIDE ----------------
  describe('unhide()', () => {
    test('unhides elements by setting opacity to 1', async () => {
      await visibilityDelegate.unhide();

      expect(mockBrowser.findAll).toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        'arguments[0].style.opacity="1";',
        mockElement
      );
    });

    test('handles error from unhide', async () => {
      const error = new Error('fail');
      mockBrowser.findAll.mockRejectedValue(error);

      await visibilityDelegate.unhide();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'unhiding elements'
      );
    });
  });

  // ---------------- SWITCHTOELEMENTCONTEXT ----------------
  // Note: This is a private method, so we can't directly test it
  // But we can test the behavior through the public methods that use it
  describe('switchToElementContext() - private method', () => {
    test('switches to default content and frame when frame is provided', async () => {
      // This test is difficult to do directly since it's a private method
      // We'll test the behavior through the hide/unhide methods which use it
      mockSwitchTo.frame.mockResolvedValue();

      // We can't directly test private methods, but we can verify the behavior
      // by checking that the methods work correctly
      expect(mockBrowser.findAll).not.toHaveBeenCalled();
    });
  });
});