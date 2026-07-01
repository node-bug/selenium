import { vi } from 'vitest';

let dynamicConfig = {
  selenium: {
    timeout: 5000,
    hub: null,
  },
};

// ---------------- MOCKS ----------------
const mockDriver = {
  getAllWindowHandles: vi.fn().mockResolvedValue(['main-window']),
  getWindowHandle: vi.fn().mockResolvedValue('main-window'),
  switchTo: vi.fn(),
  manage: vi.fn(),
  executeScript: vi.fn(),
  setFileDetector: vi.fn().mockResolvedValue(true),
  quit: vi.fn().mockResolvedValue(true),
  getTitle: vi.fn(),
  getCurrentUrl: vi.fn(),
  close: vi.fn(),
  wait: vi.fn().mockImplementation(async (conditionFn) => {
    return await conditionFn(mockDriver); 
  }),
};

const mockSwitchTo = {
  window: vi.fn(),
  defaultContent: vi.fn(),
  frame: vi.fn(),
  newWindow: vi.fn(),
};

const mockManage = {
  logs: vi.fn(),
  window: vi.fn().mockReturnValue({ setRect: vi.fn() }),
  setTimeouts: vi.fn()
};

const mockWindow = {
  maximize: vi.fn(),
  minimize: vi.fn(),
  fullscreen: vi.fn(),
};

mockDriver.switchTo.mockReturnValue(mockSwitchTo);
mockDriver.manage.mockReturnValue(mockManage);
mockManage.window.mockReturnValue(mockWindow);

vi.mock('selenium-webdriver', () => ({
  Builder: vi.fn().mockImplementation(function() {
    this.withCapabilities = vi.fn().mockReturnThis();
    this.usingServer = vi.fn().mockReturnThis();
    this.build = vi.fn().mockResolvedValue(mockDriver);
    return this;
  }),
  By: { xpath: (val) => val },
  until: {},
  WebDriver: vi.fn(() => mockDriver),
  Key: {
    ARROW_RIGHT: '\uE015',
  },
  remote: {
    FileDetector: vi.fn(),
  },
}));

vi.mock('selenium-webdriver/remote/index.js', () => ({
  default: {
    FileDetector: vi.fn(),
  },
}));

vi.mock('@nodebug/logger', () => ({
  log: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

// Mock config module
vi.mock('@nodebug/config', () => ({
  default: vi.fn((key) => {
    if (key === 'selenium') return dynamicConfig.selenium;
    return dynamicConfig;
  }),
}));

// Mock capabilities
vi.mock('../../../app/capabilities/index.js', () => ({
  default: vi.fn(() => ({ browserName: 'chrome' })),
}));

// ---------------- IMPORTS ----------------
const Browser = await import('../../../app/browser/index.js');

// ---------------- TESTS ----------------
describe('Browser (ESM)', () => {
  let browser;
  let mockWindowHandle;
  let mockWindowHandles;
  let mockLogs;
  let mockLogEntries;

  beforeEach(() => {
    vi.clearAllMocks();

    mockWindowHandle = 'window-handle-1';
    mockWindowHandles = ['window-handle-1', 'window-handle-2'];
    mockLogEntries = [
      { level: { name: 'SEVERE' }, message: 'Error 1' },
      { level: { name: 'INFO' }, message: 'Info 1' },
    ];
    mockLogs = {
      get: vi.fn().mockResolvedValue(mockLogEntries),
    };

    mockDriver.getWindowHandle.mockResolvedValue(mockWindowHandle);
    mockDriver.getAllWindowHandles.mockResolvedValue(mockWindowHandles);
    mockManage.logs.mockReturnValue(mockLogs);
    mockDriver.getTitle.mockResolvedValue('Test Title');
    mockDriver.getCurrentUrl.mockResolvedValue('https://example.com');
    // mockDriver.wait.mockImplementation((condition, timeout, message) => {
    //   return Promise.resolve();
    // });

    dynamicConfig.selenium.hub = null;
    browser = new Browser.default();
  });

  // ---------------- CONSTRUCTOR ----------------
  describe('constructor', () => {
    test('creates a Browser instance with correct properties', () => {
      expect(browser).toBeDefined();
      expect(browser._windowInstance).toBeDefined();
      expect(browser._tabInstance).toBeDefined();
      expect(browser._alertInstance).toBeDefined();
      expect(browser.capabilities).toBeDefined();
    });

    test('creates window, tab, and alert accessors', () => {
      expect(browser.window).toBeDefined();
      expect(browser.tab).toBeDefined();
      expect(browser.alert).toBeDefined();
    });
  });

  // ---------------- PROPERTIES ----------------
  describe('properties', () => {
    test('has correct timeout property', () => {
      expect(browser.timeout).toBe(5000);
    });

    test('has correct capabilities getter/setter', () => {
      const testCapabilities = { browserName: 'firefox' };
      browser.capabilities = testCapabilities;
      expect(browser.capabilities).toBe(testCapabilities);
    });

    test('has correct driver getter/setter', () => {
      browser.driver = mockDriver;
      expect(browser.driver).toBe(mockDriver);
      expect(browser._windowInstance.driver).toBe(mockDriver);
      expect(browser._tabInstance.driver).toBe(mockDriver);
      expect(browser._alertInstance.driver).toBe(mockDriver);
    });
  });

  // ---------------- METHODS ----------------
  describe('new()', () => {
    test('initializes a new browser session', async () => {
      await browser.new();
      expect(mockDriver.wait).toHaveBeenCalled();
      expect(mockDriver.getAllWindowHandles).toHaveBeenCalled();
    });

    test('uses Selenium Grid hub when configured', async () => {
      // Update the hub on the same object reference that the module captured at load time
      dynamicConfig.selenium.hub = 'http://localhost:4444/wd/hub';
      
      // Instantiate a fresh browser so it reads the new config
      const hubBrowser = new Browser.default();
      
      await hubBrowser.new();
      
      // Verify setFileDetector was called when hub is configured
      expect(mockDriver.setFileDetector).toHaveBeenCalled();
    });
  });

  describe('sleep()', () => {
    test('sleeps for specified milliseconds', async () => {
      const sleepTime = 1000;
      const start = Date.now();

      await browser.sleep(sleepTime);

      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(sleepTime);
    });
  });

  describe('close()', () => {
    test('closes the browser session', async () => {
      browser.driver = mockDriver;
      
      // Minimal mock for the window().get.url() call in source
      browser.window = vi.fn().mockReturnValue({
        get: { url: vi.fn().mockResolvedValue('https://example.com') }
      });

      const result = await browser.close();
      expect(mockDriver.quit).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('handles error during close', async () => {
      browser.driver = mockDriver;
      mockDriver.quit.mockRejectedValue(new Error('Close error'));

      await expect(browser.close()).rejects.toThrow('Close error');
    });
  });

  // ---------------- SCROLL ----------------
  describe('scroll', () => {
    beforeEach(() => {
      vi.clearAllMocks();
      mockDriver.executeScript.mockResolvedValue(true);
      browser.driver = mockDriver;
    });

    describe('to.top()', () => {
      test('scrolls to top of page', async () => {
        const result = await browser.scroll.to.top();

        expect(mockDriver.switchTo).toHaveBeenCalled();
        expect(mockSwitchTo.defaultContent).toHaveBeenCalled();
        expect(mockDriver.executeScript).toHaveBeenCalledWith('window.scrollTo(0, 0);');
        expect(result).toBe(true);
      });

      test('handles error during scroll to top', async () => {
        mockDriver.executeScript.mockRejectedValue(new Error('Scroll error'));

        await expect(browser.scroll.to.top()).rejects.toThrow('Scroll error');
      });
    });

    describe('to.bottom()', () => {
      test('scrolls to bottom of page', async () => {
        const result = await browser.scroll.to.bottom();

        expect(mockDriver.switchTo).toHaveBeenCalled();
        expect(mockSwitchTo.defaultContent).toHaveBeenCalled();
        expect(mockDriver.executeScript).toHaveBeenCalledWith('window.scrollTo(0, document.body.scrollHeight);');
        expect(result).toBe(true);
      });

      test('handles error during scroll to bottom', async () => {
        mockDriver.executeScript.mockRejectedValue(new Error('Scroll error'));

        await expect(browser.scroll.to.bottom()).rejects.toThrow('Scroll error');
      });
    });

    describe('to.left()', () => {
      test('scrolls to left of page', async () => {
        const result = await browser.scroll.to.left();

        expect(mockDriver.switchTo).toHaveBeenCalled();
        expect(mockSwitchTo.defaultContent).toHaveBeenCalled();
        expect(mockDriver.executeScript).toHaveBeenCalledWith('window.scrollTo(0, 0);');
        expect(result).toBe(true);
      });

      test('handles error during scroll to left', async () => {
        mockDriver.executeScript.mockRejectedValue(new Error('Scroll error'));

        await expect(browser.scroll.to.left()).rejects.toThrow('Scroll error');
      });
    });

    describe('to.right()', () => {
      test('scrolls to right of page', async () => {
        const result = await browser.scroll.to.right();

        expect(mockDriver.switchTo).toHaveBeenCalled();
        expect(mockSwitchTo.defaultContent).toHaveBeenCalled();
        expect(mockDriver.executeScript).toHaveBeenCalledWith('window.scrollTo(document.body.scrollWidth, 0);');
        expect(result).toBe(true);
      });

      test('handles error during scroll to right', async () => {
        mockDriver.executeScript.mockRejectedValue(new Error('Scroll error'));

        await expect(browser.scroll.to.right()).rejects.toThrow('Scroll error');
      });
    });
  });
});