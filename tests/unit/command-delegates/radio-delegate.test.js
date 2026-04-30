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
  default: jest.fn(({ action }) => `Radio: ${action}`),
}));

// ---------------- IMPORTS ----------------
const { log } = await import('@nodebug/logger');

const { RadioDelegate } = await import(
  '../../../app/command-delegates/radio-delegate.js'
);

// ---------------- TESTS ----------------
describe('RadioDelegate (ESM)', () => {
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
      stack: ['some-radio'],
      message: '',
      _finder: jest.fn().mockResolvedValue(mockLocator),
      handleError: jest.fn(),
      driver: mockDriver,
    };

    delegate = new RadioDelegate(mockBrowser);
  });

  // ---------------- CONSTRUCTOR ----------------
  describe('constructor', () => {
    test('should create a new RadioDelegate instance', () => {
      expect(delegate).toBeInstanceOf(RadioDelegate);
    });
  });

  // ---------------- SET ----------------
  describe('set()', () => {
    test('should set a radio button if it is currently not set', async () => {
      mockLocator.isSelected
        .mockResolvedValueOnce(false) // Initial state: not set
        .mockResolvedValueOnce(true);  // Verification state: set

      const result = await delegate.set();

      expect(mockLocator.click).toHaveBeenCalled();
      expect(mockBrowser.stack).toEqual([]); // Finally block clears stack
      expect(result).toBe(true);
    });

    test('should skip clicking if radio button is already set', async () => {
      mockLocator.isSelected.mockResolvedValue(true); // Already set

      await delegate.set();

      expect(mockLocator.click).not.toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('already set'));
    });

    test('should use JS click fallback if standard click fails', async () => {
      mockLocator.isSelected
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      mockLocator.click.mockRejectedValue(new Error('Element click intercepted'));

      await delegate.set();

      expect(mockBrowser.driver.executeScript).toHaveBeenCalledWith(
        'arguments[0].click();',
        mockLocator
      );
    });

    test('should throw error if state does not change after click', async () => {
      mockLocator.isSelected.mockResolvedValue(false); // Stays false despite click

      await delegate.set();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'setting radio button'
      );
      expect(mockBrowser.handleError.mock.calls[0][0].message).toContain('State did not change');
    });

    test('should catch and handle errors during the setting process', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Finder failed'));

      await delegate.set();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'setting radio button');
    });
  });

  // ---------------- IS SET ----------------
  describe('isSet()', () => {
    test('should return true if radio button is set', async () => {
      mockLocator.isSelected.mockResolvedValue(true);

      const result = await delegate.isSet();

      expect(result).toBe(true);
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('set'));
    });

    test('should throw error if radio button is not set', async () => {
      mockLocator.isSelected.mockResolvedValue(false);

      await expect(delegate.isSet()).rejects.toThrow('Radio button is not set');
    });

    test('should handle errors from _finder', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Selection failed'));
      // When _finder fails, handleError is called, then result stays false so assertion throws
      await expect(delegate.isSet()).rejects.toThrow('Radio button is not set');
      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'validating if radio button is set');
    });
  });

  // ---------------- IS NOT SET ----------------
  describe('isNotSet()', () => {
    test('should return true if radio button is not set', async () => {
      mockLocator.isSelected.mockResolvedValue(false);

      const result = await delegate.isNotSet();

      expect(result).toBe(true);
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('not set'));
    });

    test('should throw error if radio button is set', async () => {
      mockLocator.isSelected.mockResolvedValue(true);

      await expect(delegate.isNotSet()).rejects.toThrow('Radio button is set');
    });

    test('should handle errors from _finder', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Selection failed'));
      // When _finder fails, handleError is called, then result stays false so assertion throws
      await expect(delegate.isNotSet()).rejects.toThrow('Radio button is set');
      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'validating if radio button is not set');
    });
  });
});
