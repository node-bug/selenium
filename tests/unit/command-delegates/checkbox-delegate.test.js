import { vi } from 'vitest';

// ---------------- MOCKS ----------------
const mockDriver = {
  executeScript: vi.fn(),
};

vi.mock('selenium-webdriver', () => ({
  Builder: vi.fn(),
  By: {},
  until: {},
  WebDriver: vi.fn(() => mockDriver),
}));

vi.mock('@nodebug/logger', () => ({
  log: {
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../../../app/messenger.js', () => ({
  default: vi.fn(({ action }) => `Validating: ${action}`),
}));

// ---------------- IMPORTS ----------------
const { log } = await import('@nodebug/logger');

const { CheckboxDelegate } = await import(
  '../../../app/command-delegates/checkbox-delegate.js'
);

// ---------------- TESTS ----------------
describe('CheckboxDelegate (ESM)', () => {
  let mockBrowser;
  let delegate;
  let mockLocator;

  const createLocatorMock = (overrides = {}) => ({
    isSelected: vi.fn(),
    getAttribute: vi.fn(),
    click: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockLocator = createLocatorMock();

    mockBrowser = {
      stack: ['some-element'],
      message: '',
      _finder: vi.fn().mockResolvedValue(mockLocator),
      handleError: vi.fn(),
      driver: mockDriver,
    };

    delegate = new CheckboxDelegate(mockBrowser);
  });

  // ---------------- CONSTRUCTOR ----------------
  describe('constructor', () => {
    test('should create a new CheckboxDelegate instance', () => {
      expect(delegate).toBeInstanceOf(CheckboxDelegate);
    });
  });

  // ---------------- CHECK ----------------
  describe('check()', () => {
    test('should check a checkbox if it is currently unchecked', async () => {
      mockLocator.getAttribute.mockResolvedValue(null); // No role attribute (native)
      mockLocator.isSelected
        .mockResolvedValueOnce(false) // Initial state
        .mockResolvedValueOnce(true);  // Verification state

      const result = await delegate.check();

      expect(mockLocator.click).toHaveBeenCalled();
      expect(mockBrowser.stack).toEqual([]); // Finally block clears stack
      expect(result).toBe(true);
    });

    test('should skip clicking if checkbox is already in target state', async () => {
      mockLocator.getAttribute.mockResolvedValue(null); // No role attribute (native)
      mockLocator.isSelected.mockResolvedValue(true); // Already checked

      await delegate.check();

      expect(mockLocator.click).not.toHaveBeenCalled();
      // FIX: Check the logger instead of mockBrowser.message
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('already checked'));
    });

    test('should use JS click fallback if standard click fails', async () => {
      mockLocator.getAttribute.mockResolvedValue(null); // No role attribute (native)
      mockLocator.isSelected
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      mockLocator.click.mockRejectedValue(new Error('Element click intercepted'));

      await delegate.check();

      expect(mockBrowser.driver.executeScript).toHaveBeenCalledWith(
        'arguments[0].click();',
        mockLocator
      );
    });

    test('should throw error if state does not change after click', async () => {
      mockLocator.getAttribute.mockResolvedValue(null); // No role attribute (native)
      mockLocator.isSelected.mockResolvedValue(false); // Stays false despite click

      await delegate.check();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'checking checkbox'
      );
      expect(mockBrowser.handleError.mock.calls[0][0].message).toContain('State did not change');
    });

    test('should catch and handle errors during the toggle process', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Finder failed'));

      await delegate.check();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'checking checkbox');
    });
  });

  // ---------------- UNCHECK ----------------
  describe('uncheck()', () => {
    test('should uncheck a checkbox if it is currently checked', async () => {
      mockLocator.getAttribute.mockResolvedValue(null); // No role attribute (native)
      mockLocator.isSelected
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      await delegate.uncheck();

      expect(mockLocator.click).toHaveBeenCalled();
      expect(mockBrowser.stack).toEqual([]); // Finally block clears stack
    });

    test('should skip clicking if checkbox is already in target state', async () => {
      mockLocator.getAttribute.mockResolvedValue(null); // No role attribute (native)
      mockLocator.isSelected.mockResolvedValue(false); // Already unchecked

      await delegate.uncheck();

      expect(mockLocator.click).not.toHaveBeenCalled();
      // FIX: Check the logger instead of mockBrowser.message
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('already unchecked'));
    });

    test('should catch and handle errors during the toggle process', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Finder failed'));

      await delegate.uncheck();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'unchecking checkbox');
    });
  });

  // ---------------- _IS CHECKED ----------------
  describe('_isChecked()', () => {
    test('should return true if native checkbox is checked', async () => {
      mockLocator.getAttribute.mockResolvedValue(null); // No role attribute (native)
      mockLocator.isSelected.mockResolvedValue(true);

      const result = await delegate._isChecked();

      expect(result).toBe(true);
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should return false if native checkbox is not checked', async () => {
      mockLocator.getAttribute.mockResolvedValue(null); // No role attribute (native)
      mockLocator.isSelected.mockResolvedValue(false);

      const result = await delegate._isChecked();

      expect(result).toBe(false);
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should return true if ARIA checkbox is checked', async () => {
      mockLocator.getAttribute
        .mockImplementation((attr) => {
          if (attr === 'role') return Promise.resolve('checkbox');
          if (attr === 'aria-checked') return Promise.resolve('true');
          return Promise.resolve(null);
        });

      const result = await delegate._isChecked();

      expect(result).toBe(true);
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should return false if ARIA checkbox is not checked', async () => {
      mockLocator.getAttribute
        .mockImplementation((attr) => {
          if (attr === 'role') return Promise.resolve('checkbox');
          if (attr === 'aria-checked') return Promise.resolve('false');
          return Promise.resolve(null);
        });

      const result = await delegate._isChecked();

      expect(result).toBe(false);
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should handle errors from _finder and return false', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Selection failed'));

      const result = await delegate._isChecked();

      expect(result).toBe(false);
      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'validating checkbox state');
      expect(mockBrowser.stack).toEqual([]);
    });
  });
});