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
const Window = await import('../../../app/browser/window.js');

// ---------------- TESTS ----------------
describe('Window (ESM)', () => {
  let window;
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

    window = new Window.default(mockDriver);
  });

  // ---------------- METHODS ----------------
  describe('constructor', () => {
    test('creates a Window instance with correct label', () => {
      expect(window._label).toBe('Window');
    });
  });

  describe('switch()', () => {
    test('switches to window and returns true', async () => {
      // Mock the internal _findTarget method to return true
      const originalFindTarget = window._findTarget;
      window._findTarget = jest.fn().mockResolvedValue(true);
      
      const result = await window.switch('Test Title');
      
      expect(result).toBe(true);
      window._findTarget = originalFindTarget;
    });

    test('throws error when window is not found during switch', async () => {
      // Mock the internal _findTarget method to throw an error
      const originalFindTarget = window._findTarget;
      window._findTarget = jest.fn().mockRejectedValue(new Error('Window not found'));
      
      await expect(window.switch('Non-existent Title')).rejects.toThrow();
      window._findTarget = originalFindTarget;
    });
  });

  describe('new()', () => {
    test('opens a new browser window', async () => {
      await window.new();
      
      expect(mockSwitchTo.newWindow).toHaveBeenCalledWith('window');
    });
  });

  describe('close()', () => {
    test('closes the current window and switches to first window', async () => {
      mockDriver.getAllWindowHandles.mockResolvedValue(['handle1', 'handle2']);
      
      await window.close();
      
      expect(mockDriver.close).toHaveBeenCalled();
      expect(mockSwitchTo.window).toHaveBeenCalledWith('handle1');
    });

    test('handles case when no windows remain after closing', async () => {
      mockDriver.getAllWindowHandles.mockResolvedValue([]);
      
      await window.close();
      
      expect(mockDriver.close).toHaveBeenCalled();
      // Should not try to switch to a window since none exist
    });
  });

  describe('maximize()', () => {
    test('maximizes the browser window', async () => {
      await window.maximize();
      
      expect(mockWindow.maximize).toHaveBeenCalled();
    });
  });

  describe('minimize()', () => {
    test('minimizes the browser window', async () => {
      await window.minimize();
      
      expect(mockWindow.minimize).toHaveBeenCalled();
    });
  });

  describe('fullscreen()', () => {
    test('switches to fullscreen mode', async () => {
      await window.fullscreen();
      
      expect(mockWindow.fullscreen).toHaveBeenCalled();
    });
  });
});