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
  default: jest.fn(({ action }) => `Switch: ${action}`),
}));

// ---------------- IMPORTS ----------------
const { log } = await import('@nodebug/logger');

const { SwitchDelegate } = await import(
  '../../../app/command-delegates/switch-delegate.js'
);

// ---------------- TESTS ----------------
describe('SwitchDelegate (ESM)', () => {
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
      stack: ['some-switch'],
      message: '',
      _finder: jest.fn().mockResolvedValue(mockLocator),
      handleError: jest.fn(),
      driver: mockDriver,
    };

    delegate = new SwitchDelegate(mockBrowser);
  });

  // ---------------- CONSTRUCTOR ----------------
  describe('constructor', () => {
    test('should create a new SwitchDelegate instance', () => {
      expect(delegate).toBeInstanceOf(SwitchDelegate);
    });
  });

  // ---------------- ON ----------------
  describe('on()', () => {
    test('should turn switch on if it is currently off', async () => {
      mockLocator.isSelected
        .mockResolvedValueOnce(false) // Initial state: off
        .mockResolvedValueOnce(true);  // Verification state: on

      const result = await delegate.on();

      expect(mockLocator.click).toHaveBeenCalled();
      expect(mockBrowser.stack).toEqual([]); // Finally block clears stack
      expect(result).toBe(true);
    });

    test('should skip clicking if switch is already on', async () => {
      mockLocator.isSelected.mockResolvedValue(true); // Already on

      await delegate.on();

      expect(mockLocator.click).not.toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('already on'));
    });

    test('should use JS click fallback if standard click fails', async () => {
      mockLocator.isSelected
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      mockLocator.click.mockRejectedValue(new Error('Element click intercepted'));

      await delegate.on();

      expect(mockBrowser.driver.executeScript).toHaveBeenCalledWith(
        'arguments[0].click();',
        mockLocator
      );
    });

    test('should throw error if state does not change after click', async () => {
      mockLocator.isSelected.mockResolvedValue(false); // Stays false despite click

      await delegate.on();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'setting switch on'
      );
      expect(mockBrowser.handleError.mock.calls[0][0].message).toContain('State did not change');
    });

    test('should catch and handle errors during the toggle process', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Finder failed'));

      await delegate.on();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'setting switch on');
    });
  });

  // ---------------- OFF ----------------
  describe('off()', () => {
    test('should turn switch off if it is currently on', async () => {
      mockLocator.isSelected
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      await delegate.off();

      expect(mockLocator.click).toHaveBeenCalled();
      expect(mockBrowser.stack).toEqual([]); // Finally block clears stack
    });

    test('should skip clicking if switch is already off', async () => {
      mockLocator.isSelected.mockResolvedValue(false); // Already off

      await delegate.off();

      expect(mockLocator.click).not.toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('already off'));
    });

    test('should use JS click fallback if standard click fails', async () => {
      mockLocator.isSelected
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      mockLocator.click.mockRejectedValue(new Error('Element click intercepted'));

      await delegate.off();

      expect(mockBrowser.driver.executeScript).toHaveBeenCalledWith(
        'arguments[0].click();',
        mockLocator
      );
    });

    test('should catch and handle errors during the toggle process', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Finder failed'));

      await delegate.off();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'setting switch off');
    });
  });

  // ---------------- IS ON ----------------
  describe('isOn()', () => {
    test('should return true if switch is on (selected)', async () => {
      mockLocator.isSelected.mockResolvedValue(true);

      const result = await delegate.isOn();

      expect(result).toBe(true);
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('on'));
    });

    test('should return false if switch is off (not selected)', async () => {
      mockLocator.isSelected.mockResolvedValue(false);

      const result = await delegate.isOn();

      expect(result).toBe(false);
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('off'));
    });

    test('should handle errors in isOn', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Selection failed'));
      await delegate.isOn();
      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'checking if switch is on');
    });
  });

  // ---------------- IS OFF ----------------
  describe('isOff()', () => {
    test('should return true if switch is off (not selected)', async () => {
      mockLocator.isSelected.mockResolvedValue(false);

      const result = await delegate.isOff();

      expect(result).toBe(true);
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('off'));
    });

    test('should return false if switch is on (selected)', async () => {
      mockLocator.isSelected.mockResolvedValue(true);

      const result = await delegate.isOff();

      expect(result).toBe(false);
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('on'));
    });

    test('should handle errors in isOff', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Selection failed'));
      await delegate.isOff();
      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'checking if switch is off');
    });
  });
});
