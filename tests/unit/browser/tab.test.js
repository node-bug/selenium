import { vi } from 'vitest';

// ---------------- MOCKS ----------------
const mockDriver = {
  getAllWindowHandles: vi.fn(),
  getWindowHandle: vi.fn(),
  switchTo: vi.fn(),
  getTitle: vi.fn(),
  getCurrentUrl: vi.fn(),
  close: vi.fn(),
  manage: vi.fn(),
  executeScript: vi.fn(),
};

const mockSwitchTo = {
  window: vi.fn(),
  defaultContent: vi.fn(),
  frame: vi.fn(),
  newWindow: vi.fn(),
};

const mockManage = {
  window: vi.fn(),
  logs: vi.fn(),
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
  },
}));

// Mock config module
vi.mock('@nodebug/config', () => ({
  default: vi.fn(() => ({
    selenium: {
      timeout: 5000,
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
      tab._findTarget = vi.fn().mockResolvedValue(true);
      
      const result = await tab.switch();
      
      expect(result).toBe(true);
      tab._findTarget = originalFindTarget;
    });

    test('throws error when tab is not found during switch', async () => {
      // Mock the internal _findTarget method to throw an error
      const originalFindTarget = tab._findTarget;
      tab._findTarget = vi.fn().mockRejectedValue(new Error('Tab not found'));
      
      await expect(tab.switch()).rejects.toThrow();
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