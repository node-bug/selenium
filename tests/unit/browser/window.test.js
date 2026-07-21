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
const Window = await import('../../../app/browser/window.js');

// ---------------- TESTS ----------------
describe('Window (ESM)', () => {
  let window;
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
      window._findTarget = vi.fn().mockResolvedValue(true);
      
      const result = await window.switch();
      
      expect(result).toBe(true);
      window._findTarget = originalFindTarget;
    });

    test('throws error when window is not found during switch', async () => {
      // Mock the internal _findTarget method to throw an error
      const originalFindTarget = window._findTarget;
      window._findTarget = vi.fn().mockRejectedValue(new Error('Window not found'));
      
      await expect(window.switch()).rejects.toThrow();
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