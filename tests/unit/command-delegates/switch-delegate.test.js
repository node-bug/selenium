import { vi } from 'vitest';

// ---------------- MOCKS ----------------
const mockDriver = {
  executeScript: vi.fn(),
};

vi.mock('selenium-webdriver', () => ({
  Builder: vi.fn(),
  By: {
    css: vi.fn((selector) => selector),
    xpath: vi.fn((selector) => ({ using: 'xpath', value: selector })),
  },
  until: {},
  WebDriver: vi.fn(() => mockDriver),
}));

vi.mock('@nodebug/logger', () => ({
  log: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../app/messenger.js', () => ({
  default: vi.fn(({ action }) => `Switch: ${action}`),
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
    tagName: 'input',
    isSelected: vi.fn(),
    click: vi.fn(),
    getAttribute: vi.fn().mockResolvedValue(null),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockLocator = createLocatorMock();

    mockBrowser = {
      stack: ['some-switch'],
      message: '',
      _finder: vi.fn().mockResolvedValue(mockLocator),
      handleError: vi.fn(),
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

      await expect(delegate.on()).rejects.toThrow('State did not change');

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'toggling switch to ON'
      );
    });

    test('should catch and handle errors during the toggle process', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Finder failed'));

      await expect(delegate.on()).rejects.toThrow('Finder failed');

      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'toggling switch to ON');
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

      await expect(delegate.off()).rejects.toThrow('Finder failed');

      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'toggling switch to OFF');
    });
  });

  // ---------------- _IS ON ----------------
  describe('_isOn()', () => {
    test('should return true if switch is on (selected)', async () => {
      mockLocator.isSelected.mockResolvedValue(true);

      const result = await delegate._isOn();

      expect(result).toBe(true);
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should return false if switch is off (not selected)', async () => {
      mockLocator.isSelected.mockResolvedValue(false);

      const result = await delegate._isOn();

      expect(result).toBe(false);
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should handle errors from _finder and throw', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Selection failed'));

      await expect(delegate._isOn()).rejects.toThrow('Selection failed');

      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'validating switch state');
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should check aria-checked when element has role="switch"', async () => {
      mockLocator.getAttribute.mockResolvedValueOnce('switch'); // role
      mockLocator.getAttribute.mockResolvedValueOnce('true');   // aria-checked

      const result = await delegate._isOn();

      expect(result).toBe(true);
      expect(mockLocator.isSelected).not.toHaveBeenCalled();
    });

    test('should return false when aria-checked is "false"', async () => {
      mockLocator.getAttribute.mockResolvedValueOnce('switch'); // role
      mockLocator.getAttribute.mockResolvedValueOnce('false');  // aria-checked

      const result = await delegate._isOn();

      expect(result).toBe(false);
      expect(mockLocator.isSelected).not.toHaveBeenCalled();
    });

    test('should fall back to isSelected when role is not "switch"', async () => {
      mockLocator.getAttribute.mockResolvedValueOnce(null); // No role attribute
      mockLocator.isSelected.mockResolvedValueOnce(true);

      const result = await delegate._isOn();

      expect(result).toBe(true);
      expect(mockLocator.isSelected).toHaveBeenCalled();
    });
  });

  // ---------------- OFF ERROR HANDLING ----------------
  describe('off() error handling', () => {
    test('should throw error if state does not change after click', async () => {
      mockLocator.isSelected.mockResolvedValue(true); // Stays true despite click

      await expect(delegate.off()).rejects.toThrow('State did not change');
      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'toggling switch to OFF'
      );
    });

    test('should return true after successful toggle', async () => {
      mockLocator.isSelected
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const result = await delegate.off();

      expect(result).toBe(true);
    });
  });

  // ---------------- ON RETURN VALUE ----------------
  describe('on() return value', () => {
    test('should return true after successful toggle', async () => {
      mockLocator.isSelected
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);

      const result = await delegate.on();

      expect(result).toBe(true);
    });

    test('should return true when switch is already on (idempotent)', async () => {
      mockLocator.isSelected.mockResolvedValue(true);

      const result = await delegate.on();

      expect(result).toBe(true);
    });
  });
});
