import { jest } from '@jest/globals';

// ---------------- MOCKS ----------------
const mockDriver = {
  getAllWindowHandles: jest.fn(),
  getWindowHandle: jest.fn(),
  switchTo: jest.fn(),
  getTitle: jest.fn(),
  getCurrentUrl: jest.fn(),
  close: jest.fn(),
  manage: jest.fn(),
  executeScript: jest.fn(),
};

const mockSwitchTo = {
  window: jest.fn(),
  defaultContent: jest.fn(),
  frame: jest.fn(),
  newWindow: jest.fn(),
};

const mockManage = {
  window: jest.fn(),
  logs: jest.fn(),
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

// Mock config module
jest.unstable_mockModule('@nodebug/config', () => ({
  default: jest.fn(() => ({
    selenium: {
      timeout: 5,
    },
  })),
}));

// ---------------- IMPORTS ----------------
const Tab = await import('../../../app/browser/tab.js');

// ---------------- TESTS ----------------
describe('Tab (ESM)', () => {
  let tab;
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

    tab = new Tab.default(mockDriver);
  });

  // ---------------- METHODS ----------------
  describe('constructor', () => {
    test('creates a Tab instance with correct label', () => {
      expect(tab._label).toBe('Tab');
    });
  });

  describe('switch()', () => {
    test('switches to tab and returns true', async () => {
      // Mock the internal _findTarget method to return true
      const originalFindTarget = tab._findTarget;
      tab._findTarget = jest.fn().mockResolvedValue(true);
      
      const result = await tab.switch('Test Title');
      
      expect(result).toBe(true);
      tab._findTarget = originalFindTarget;
    });

    test('throws error when tab is not found during switch', async () => {
      // Mock the internal _findTarget method to throw an error
      const originalFindTarget = tab._findTarget;
      tab._findTarget = jest.fn().mockRejectedValue(new Error('Tab not found'));
      
      await expect(tab.switch('Non-existent Title')).rejects.toThrow();
      tab._findTarget = originalFindTarget;
    });
  });

  describe('new()', () => {
    test('opens a new browser tab', async () => {
      await tab.new();
      
      expect(mockSwitchTo.newWindow).toHaveBeenCalledWith('tab');
    });
  });

  describe('close()', () => {
    test('closes the current tab and switches to first window', async () => {
      mockDriver.getAllWindowHandles.mockResolvedValue(['handle1', 'handle2']);
      
      await tab.close();
      
      expect(mockDriver.close).toHaveBeenCalled();
      expect(mockSwitchTo.window).toHaveBeenCalledWith('handle1');
    });

    test('handles case when no windows remain after closing', async () => {
      mockDriver.getAllWindowHandles.mockResolvedValue([]);
      
      await tab.close();
      
      expect(mockDriver.close).toHaveBeenCalled();
      // Should not try to switch to a window since none exist
    });
  });
});