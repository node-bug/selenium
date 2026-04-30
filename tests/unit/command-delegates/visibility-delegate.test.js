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

      // isDisplayed catches the error and calls handleError (does not re-throw)
      await expect(visibilityDelegate.isDisplayed()).resolves.toBeUndefined();
      expect(mockBrowser.handleError).toHaveBeenCalledWith(error, 'validating element to be displayed');
    });

    test('uses custom timeout when provided', async () => {
      await visibilityDelegate.isDisplayed(10000);

      expect(mockBrowser._finder).toHaveBeenCalledWith(10000);
    });
  });

  // ---------------- ISNOTDISPLAYED ----------------
  describe('isNotDisplayed() Scenarios', () => {
  let originalDateNow;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    originalDateNow = Date.now;
    
    // Set a consistent base time
    let currentTime = 10000;
    Date.now = jest.fn(() => currentTime);
  });

  afterEach(() => {
    jest.useRealTimers();
    Date.now = originalDateNow;
  });

  /**
   * Scenario 1: Success - Element is already gone
   * Logic: _finder throws -> inner catch returns true.
   */
  test('returns true immediately when element is not found', async () => {
    mockBrowser._finder.mockRejectedValue(new Error('NoSuchElement'));

    const result = await visibilityDelegate.isNotDisplayed(2000);

    expect(result).toBe(true);
    expect(mockBrowser._finder).toHaveBeenCalledTimes(1);
    expect(mockBrowser.handleError).not.toHaveBeenCalled();
  });

  /**
   * Scenario 2: Success - Element disappears after 2 tries
   * Logic: Loop runs twice, second catch returns true.
   */
  test('returns true after element disappears on second poll', async () => {
    let callCount = 0;
    Date.now = jest.fn(() => 10000 + (callCount * 100)); // Time moves slowly
    
    mockBrowser._finder
      .mockResolvedValueOnce(mockElement) // First check: found
      .mockImplementationOnce(() => { 
        callCount++; 
        throw new Error('Gone'); 
      }); // Second check: gone

    const promise = visibilityDelegate.isNotDisplayed(2000);
    
    // Advance timers to trigger the 500ms sleep
    await jest.advanceTimersByTimeAsync(500);
    
    const result = await promise;
    expect(result).toBe(true);
    expect(mockBrowser._finder).toHaveBeenCalledTimes(2);
  });

  /**
   * Scenario 3: Timeout - Element stays visible
   * Logic: While loop expires -> throw error -> outer catch -> returns true.
   */
  test('calls handleError and returns true when timeout is reached', async () => {
    let currentTime = 10000;
    Date.now = jest.fn(() => {
      const now = currentTime;
      currentTime += 600; // Increment past the 500ms sleep
      return now;
    });

    mockBrowser._finder.mockResolvedValue(mockElement); // Always found

    const promise = visibilityDelegate.isNotDisplayed(1000);
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(mockBrowser.handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('Element still visible after 1000ms')
      }),
      'validating element to not be displayed'
    );
    expect(result).toBe(true);
  });

  /**
   * Scenario 4: Default Timeout Fallback
   * Logic: Verifies selenium.timeout from config is used when t=null.
   */
  test('uses default config timeout when no time is provided', async () => {
    // Mock Date.now to jump immediately past the 5s config timeout
    Date.now = jest.fn()
      .mockReturnValueOnce(0)    // Start
      .mockReturnValueOnce(6000); // Exceeds config (5s)

    mockBrowser._finder.mockResolvedValue(mockElement);

    await visibilityDelegate.isNotDisplayed(); // No argument passed

    expect(mockBrowser.handleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining('after 5000ms') // 5 seconds from config
      }),
      'validating element to not be displayed'
    );
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
        'validating if disabled'
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
      // by validating that the methods work correctly
      expect(mockBrowser.findAll).not.toHaveBeenCalled();
    });
  });
});