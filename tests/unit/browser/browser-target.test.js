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
};

const mockManage = {
  logs: jest.fn(),
};

mockDriver.switchTo.mockReturnValue(mockSwitchTo);
mockDriver.manage.mockReturnValue(mockManage);

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
const { BrowserTarget } = await import('../../../app/browser/browser-target.js');

// ---------------- TESTS ----------------
describe('BrowserTarget (ESM)', () => {
  let browserTarget;
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

    browserTarget = new BrowserTarget(mockDriver, 'TestTarget');
  });

  // ---------------- GET ----------------
  describe('get', () => {
    describe('title()', () => {
      test('returns the title of the current target', async () => {
        const title = await browserTarget.get.title();
        
        expect(mockDriver.getTitle).toHaveBeenCalled();
        expect(title).toBe('Test Title');
      });

      test('handles error when getting title', async () => {
        mockDriver.getTitle.mockRejectedValue(new Error('Title error'));
        
        await expect(browserTarget.get.title()).rejects.toThrow('Title error');
      });
    });

    describe('url()', () => {
      test('returns the URL of the current target', async () => {
        const url = await browserTarget.get.url();
        
        expect(mockDriver.getCurrentUrl).toHaveBeenCalled();
        expect(url).toBe('https://example.com');
      });

      test('handles error when getting URL', async () => {
        mockDriver.getCurrentUrl.mockRejectedValue(new Error('URL error'));
        
        await expect(browserTarget.get.url()).rejects.toThrow('URL error');
      });
    });

    describe('consoleErrors()', () => {
      test('returns console errors from the current target', async () => {
        const errors = await browserTarget.get.consoleErrors();
        
        expect(mockLogs.get).toHaveBeenCalledWith('browser');
        expect(errors).toEqual([{ level: { name: 'SEVERE' }, message: 'Error 1' }]);
      });

      test('handles error when getting console errors', async () => {
        mockLogs.get.mockRejectedValue(new Error('Console error'));
        
        await expect(browserTarget.get.consoleErrors()).rejects.toThrow('Console error');
      });
    });
  });

  // ---------------- PROPERTIES ----------------
  describe('properties', () => {
    test('has correct timeout property', () => {
      expect(browserTarget.timeout).toBe(10000); // 5 seconds * 1000
    });

    test('has correct label property', () => {
      expect(browserTarget._label).toBe('TestTarget');
    });
  });

  // ---------------- METHODS ----------------
  describe('with()', () => {
    test('returns the BrowserTarget instance for chaining', () => {
      const result = browserTarget.with();
      
      expect(result).toBe(browserTarget);
    });
  });

  describe('identifier()', () => {
    test('sets the target title and returns the instance for chaining', () => {
      const result = browserTarget.identifier('Test Title');
      
      expect(result).toBe(browserTarget);
      expect(browserTarget._targetTitle).toBe('Test Title');
    });
  });

  describe('_findTarget()', () => {
    test('finds target by index and returns true', async () => {
      browserTarget._targetTitle = 1;
      mockDriver.getAllWindowHandles.mockResolvedValue(['handle1', 'handle2']);
      
      const result = await browserTarget._findTarget(false);
      
      expect(result).toBe(true);
    });

    test('finds target by title and returns true', async () => {
      browserTarget._targetTitle = 'Test Title';
      mockDriver.getTitle.mockResolvedValue('Test Title');
      
      const result = await browserTarget._findTarget(false);
      
      expect(result).toBe(true);
    });

    test('returns false when target is not found', async () => {
      browserTarget._targetTitle = 'Non-existent Title';
      mockDriver.getTitle.mockResolvedValue('Different Title');
      
      const result = await browserTarget._findTarget(false, 100); // Short timeout
      
      expect(result).toBe(false);
    });

    test('throws error when switching to non-existent target', async () => {
      browserTarget._targetTitle = 'Non-existent Title';
      mockDriver.getTitle.mockResolvedValue('Different Title');
      
      await expect(browserTarget._findTarget(true, 100)).rejects.toThrow(); // Short timeout
    });
  });

  describe('close()', () => {
    test('closes the current target and switches to first window', async () => {
      mockDriver.getAllWindowHandles.mockResolvedValue(['handle1', 'handle2']);
      
      await browserTarget.close();
      
      expect(mockDriver.close).toHaveBeenCalled();
      expect(mockSwitchTo.window).toHaveBeenCalledWith('handle1');
    });

    test('handles case when no windows remain after closing', async () => {
      mockDriver.getAllWindowHandles.mockResolvedValue([]);
      
      await browserTarget.close();
      
      expect(mockDriver.close).toHaveBeenCalled();
      // Should not try to switch to a window since none exist
    });
  });

  describe('is.displayed()', () => {
    test('returns true when target is displayed', async () => {
      browserTarget._targetTitle = 'Test Title';
      
      const result = await browserTarget.is.displayed();
      
      expect(result).toBe(true);
    });

    test('returns false when target is not displayed', async () => {
      browserTarget._targetTitle = 'Non-existent Title';
      mockDriver.getTitle.mockResolvedValue('Different Title');
      
      const result = await browserTarget.is.displayed(100); // Short timeout
      
      expect(result).toBe(false);
    });
  });

  describe('switch()', () => {
    test('switches to target and returns true', async () => {
      browserTarget._targetTitle = 'Test Title';
      
      const result = await browserTarget.switch();
      
      expect(result).toBe(true);
    });

    test('throws error when target is not found during switch', async () => {
      browserTarget._targetTitle = 'Non-existent Title';
      mockDriver.getTitle.mockResolvedValue('Different Title');
      
      await expect(browserTarget.switch(100)).rejects.toThrow(); // Short timeout
    });
  });
});