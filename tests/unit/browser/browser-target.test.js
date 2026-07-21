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
};

const mockManage = {
  logs: vi.fn(),
};

mockDriver.switchTo.mockReturnValue(mockSwitchTo);
mockDriver.manage.mockReturnValue(mockManage);

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

// Mock config module
vi.mock('@nodebug/config', () => ({
  default: vi.fn(() => ({
    selenium: {
      timeout: 5000,
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
      expect(browserTarget.timeout).toBe(10000);
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
      browserTarget._isIndex = true;
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

      // Override timeout for this test to avoid long wait
      Object.defineProperty(browserTarget, 'timeout', { get: () => 100 });

      const result = await browserTarget._findTarget(false);

      expect(result).toBe(false);
    });

    test('throws error when switching to non-existent target', async () => {
      browserTarget._targetTitle = 'Non-existent Title';
      mockDriver.getTitle.mockResolvedValue('Different Title');

      // Override timeout for this test to avoid long wait
      Object.defineProperty(browserTarget, 'timeout', { get: () => 100 });

      await expect(browserTarget._findTarget(true)).rejects.toThrow();
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

describe('is.present()', () => {
    test('returns true when target is present', async () => {
      browserTarget._targetTitle = 'Test Title';

      const result = await browserTarget.is.present();

      expect(result).toBe(true);
    });

    test('returns false when target is not present', async () => {
      browserTarget._targetTitle = 'Non-existent Title';
      mockDriver.getTitle.mockResolvedValue('Different Title');

      // Override timeout for this test to avoid long wait
      Object.defineProperty(browserTarget, 'timeout', { get: () => 100 });

      const result = await browserTarget.is.present();

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
      const originalFindTarget = browserTarget._findTarget;
      browserTarget._findTarget = vi.fn().mockRejectedValue(new Error('Target not found'));
      
      await expect(browserTarget.switch()).rejects.toThrow();
      browserTarget._findTarget = originalFindTarget;
    });

    test('throws error when target is not found during switch (return false)', async () => {
      browserTarget._targetTitle = 'Non-existent Title';
      mockDriver.getTitle.mockResolvedValue('Different Title');
      Object.defineProperty(browserTarget, 'timeout', { get: () => 100 });

      await expect(browserTarget.switch()).rejects.toThrow('TestTarget was not found on screen after \'100 ms\' timeout');
    });
  });

  describe('is.not.present()', () => {
    test('returns true when target is not present', async () => {
      browserTarget._targetTitle = 'Non-existent Title';
      mockDriver.getTitle.mockResolvedValue('Different Title');
      Object.defineProperty(browserTarget, 'timeout', { get: () => 100 });

      const result = await browserTarget.is.not.present();
      expect(result).toBe(true);
    });

    test('returns false when target is present', async () => {
      browserTarget._targetTitle = 'Test Title';
      mockDriver.getTitle.mockResolvedValue('Test Title');

      const result = await browserTarget.is.not.present();
      expect(result).toBe(false);
    });
  });

  describe('should.be.present()', () => {
    test('returns true when target is present', async () => {
      browserTarget._targetTitle = 'Test Title';
      mockDriver.getTitle.mockResolvedValue('Test Title');

      const result = await browserTarget.should.be.present();
      expect(result).toBe(true);
    });

    test('throws error when target is not present', async () => {
      browserTarget._targetTitle = 'Non-existent Title';
      mockDriver.getTitle.mockResolvedValue('Different Title');
      Object.defineProperty(browserTarget, 'timeout', { get: () => 100 });

      await expect(browserTarget.should.be.present()).rejects.toThrow('TestTarget with title \'Non-existent Title\' is not present');
    });
  });

  describe('should.not.be.present()', () => {
    test('returns true when target is not present', async () => {
      browserTarget._targetTitle = 'Non-existent Title';
      mockDriver.getTitle.mockResolvedValue('Different Title');
      Object.defineProperty(browserTarget, 'timeout', { get: () => 100 });

      const result = await browserTarget.should.not.be.present();
      expect(result).toBe(true);
    });

    test('throws error when target is present', async () => {
      browserTarget._targetTitle = 'Test Title';
      mockDriver.getTitle.mockResolvedValue('Test Title');

      await expect(browserTarget.should.not.be.present()).rejects.toThrow('TestTarget with title \'Test Title\' is present but should not be');
    });
  });

  describe('_findTarget() edge cases', () => {
    test('returns true immediately if no target title is specified', async () => {
      browserTarget._targetTitle = undefined;
      const result = await browserTarget._findTarget(false);
      expect(result).toBe(true);
    });

    test('handles index out of bounds (too high)', async () => {
      browserTarget._targetTitle = 5;
      browserTarget._isIndex = true;
      mockDriver.getAllWindowHandles.mockResolvedValue(['h1', 'h2']);
      
      const result = await browserTarget._findTarget(false);
      expect(result).toBe(false);
    });

    test('handles index out of bounds (negative)', async () => {
      browserTarget._targetTitle = -1;
      browserTarget._isIndex = true;
      mockDriver.getAllWindowHandles.mockResolvedValue(['h1', 'h2']);
      
      const result = await browserTarget._findTarget(false);
      expect(result).toBe(false);
    });

    test('handles NoSuchWindowError when getting original handle', async () => {
      browserTarget._targetTitle = 'Some Title';
      mockDriver.getWindowHandle.mockRejectedValue({ name: 'NoSuchWindowError' });
      mockDriver.getTitle.mockResolvedValue('Different Title');
      Object.defineProperty(browserTarget, 'timeout', { get: () => 100 });

      const result = await browserTarget._findTarget(false);
      expect(result).toBe(false);
    });

    test('throws error when getWindowHandle fails with other error', async () => {
      browserTarget._targetTitle = 'Some Title';
      mockDriver.getWindowHandle.mockRejectedValue(new Error('Unexpected Error'));
      
      await expect(browserTarget._findTarget(false)).rejects.toThrow('Unexpected Error');
    });
  });
});