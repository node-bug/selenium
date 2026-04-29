import { jest } from '@jest/globals';

// ---------------- MOCKS ----------------
const mockDriver = {
  executeScript: jest.fn(),
};

jest.unstable_mockModule('selenium-webdriver', () => ({
  Builder: jest.fn(),
  By: {},
  until: {},
  WebDriver: jest.fn(() => mockDriver),
}));

jest.unstable_mockModule('@nodebug/logger', () => ({
  log: {
    info: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../app/messenger.js', () => ({
  default: jest.fn(({ action }) => `Checking: ${action}`),
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
    isSelected: jest.fn(),
    click: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockLocator = createLocatorMock();

    mockBrowser = {
      stack: ['some-element'],
      message: '',
      _finder: jest.fn().mockResolvedValue(mockLocator),
      handleError: jest.fn(),
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
      mockLocator.isSelected
        .mockResolvedValueOnce(false) // Initial state
        .mockResolvedValueOnce(true);  // Verification state

      const result = await delegate.check();

      expect(mockLocator.click).toHaveBeenCalled();
      expect(mockBrowser.stack).toEqual([]); // Finally block clears stack
      expect(result).toBe(true);
    });

    test('should skip clicking if checkbox is already in target state', async () => {
      mockLocator.isSelected.mockResolvedValue(true); // Already checked

      await delegate.check();

      expect(mockLocator.click).not.toHaveBeenCalled();
      // FIX: Check the logger instead of mockBrowser.message
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('already checked'));
    });

    test('should use JS click fallback if standard click fails', async () => {
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
      mockLocator.isSelected
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      await delegate.uncheck();

      expect(mockLocator.click).toHaveBeenCalled();
      expect(mockBrowser.stack).toEqual([]); // Finally block clears stack
    });

    test('should skip clicking if checkbox is already in target state', async () => {
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

  // ---------------- IS CHECKED ----------------
  describe('isChecked()', () => {
    test('should return true if selected', async () => {
      const { log } = await import('@nodebug/logger');
      mockLocator.isSelected.mockResolvedValue(true);

      const result = await delegate.isChecked();

      expect(result).toBe(true);
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('checked'));
    });

    test('should throw error if not selected', async () => {
      mockLocator.isSelected.mockResolvedValue(false);

      await expect(delegate.isChecked()).rejects.toThrow('Checkbox is not checked');
    });

    test('should handle errors from _finder', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Selection failed'));
      // When _finder fails, handleError is called, then result stays false so assertion throws
      await expect(delegate.isChecked()).rejects.toThrow('Checkbox is not checked');
      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'checking if checkbox is checked');
    });
  });

  // ---------------- IS UNCHECKED ----------------
  describe('isUnchecked()', () => {
    test('should return true if NOT selected', async () => {
      mockLocator.isSelected.mockResolvedValue(false);

      const result = await delegate.isUnchecked();

      expect(result).toBe(true);
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('not checked'));
    });

    test('should throw error if selected', async () => {
      mockLocator.isSelected.mockResolvedValue(true);

      await expect(delegate.isUnchecked()).rejects.toThrow('Checkbox is checked');
    });

    test('should handle errors from _finder', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Selection failed'));
      // When _finder fails, handleError is called, then result stays false so assertion throws
      await expect(delegate.isUnchecked()).rejects.toThrow('Checkbox is checked');
      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'checking if checkbox is unchecked');
    });
  });
});