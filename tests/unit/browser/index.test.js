import { jest } from '@jest/globals';

let dynamicConfig = {
  selenium: {
    timeout: 5,
    hub: null,
  },
};

// ---------------- MOCKS ----------------
const mockDriver = {
  getAllWindowHandles: jest.fn().mockResolvedValue(['main-window']),
  getWindowHandle: jest.fn().mockResolvedValue('main-window'),
  switchTo: jest.fn(),
  manage: jest.fn(),
  executeScript: jest.fn(),
  setFileDetector: jest.fn().mockResolvedValue(true),
  quit: jest.fn().mockResolvedValue(true),
  getTitle: jest.fn(),
  getCurrentUrl: jest.fn(),
  close: jest.fn(),
  wait: jest.fn().mockImplementation(async (conditionFn) => {
    return await conditionFn(mockDriver); 
  }),
};

const mockSwitchTo = {
  window: jest.fn(),
  defaultContent: jest.fn(),
  frame: jest.fn(),
  newWindow: jest.fn(),
};

const mockManage = {
  logs: jest.fn(),
  window: jest.fn().mockReturnValue({ setRect: jest.fn() }),
  setTimeouts: jest.fn()
};

const mockWindow = {
  maximize: jest.fn(),
  minimize: jest.fn(),
  fullscreen: jest.fn(),
};

mockDriver.switchTo.mockReturnValue(mockSwitchTo);
mockDriver.manage.mockReturnValue(mockManage);
mockManage.window.mockReturnValue(mockWindow);

jest.unstable_mockModule('selenium-webdriver', () => ({
  Builder: jest.fn().mockImplementation(function() {
    this.withCapabilities = jest.fn().mockReturnThis();
    this.usingServer = jest.fn().mockReturnThis();
    this.build = jest.fn().mockResolvedValue(mockDriver);
    return this;
  }),
  By: { xpath: (val) => val },
  until: {},
  WebDriver: jest.fn(() => mockDriver),
  Key: {
    ARROW_RIGHT: '\uE015',
  },
  remote: {
    FileDetector: jest.fn(),
  },
}));

jest.unstable_mockModule('selenium-webdriver/remote/index.js', () => ({
  default: {
    FileDetector: jest.fn(),
  },
}));

jest.unstable_mockModule('@nodebug/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

// Mock config module
jest.unstable_mockModule('@nodebug/config', () => ({
  default: jest.fn((key) => {
    if (key === 'selenium') return dynamicConfig.selenium;
    return dynamicConfig;
  }),
}));

// Mock capabilities
jest.unstable_mockModule('../../../app/capabilities/index.js', () => ({
  default: jest.fn(() => ({ browserName: 'chrome' })),
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
    jest.clearAllMocks();

    mockWindowHandle = 'window-handle-1';
    mockWindowHandles = ['window-handle-1', 'window-handle-2'];
    mockLogEntries = [
      { level: { name: 'SEVERE' }, message: 'Error 1' },
      { level: { name: 'INFO' }, message: 'Info 1' },
    ];
    mockLogs = {
      get: jest.fn().mockResolvedValue(mockLogEntries),
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
      expect(browser.timeout).toBe(5000); // 10 seconds * 1000
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
      browser.window = jest.fn().mockReturnValue({
        get: { url: jest.fn().mockResolvedValue('https://example.com') }
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
});