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
  default: vi.fn(({ action }) => `Radio: ${action}`),
}));

// ---------------- IMPORTS ----------------

const { RadioDelegate } = await import(
  '../../../app/command-delegates/radio-delegate.js'
);

// ---------------- TESTS ----------------
describe('RadioDelegate (ESM)', () => {
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
      stack: ['some-radio'],
      message: '',
      _finder: vi.fn().mockResolvedValue(mockLocator),
      handleError: vi.fn(),
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

  // ---------------- _IS SET ----------------
  describe('_isSet()', () => {
    test('should return true if native radio button is set', async () => {
      mockLocator.getAttribute.mockResolvedValue(null); // No role attribute (native)
      mockLocator.isSelected.mockResolvedValue(true);

      const result = await delegate._isSet();

      expect(result).toBe(true);
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should return false if native radio button is not set', async () => {
      mockLocator.getAttribute.mockResolvedValue(null); // No role attribute (native)
      mockLocator.isSelected.mockResolvedValue(false);

      const result = await delegate._isSet();

      expect(result).toBe(false);
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should return true if ARIA radio button is set', async () => {
      mockLocator.getAttribute
        .mockImplementation((attr) => {
          if (attr === 'role') return Promise.resolve('radio');
          if (attr === 'aria-checked') return Promise.resolve('true');
          return Promise.resolve(null);
        });

      const result = await delegate._isSet();

      expect(result).toBe(true);
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should return false if ARIA radio button is not set', async () => {
      mockLocator.getAttribute
        .mockImplementation((attr) => {
          if (attr === 'role') return Promise.resolve('radio');
          if (attr === 'aria-checked') return Promise.resolve('false');
          return Promise.resolve(null);
        });

      const result = await delegate._isSet();

      expect(result).toBe(false);
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should handle errors from _finder and return false', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Selection failed'));

      const result = await delegate._isSet();

      expect(result).toBe(false);
      expect(mockBrowser.handleError).toHaveBeenCalledWith(expect.any(Error), 'validating radio button state');
      expect(mockBrowser.stack).toEqual([]);
    });
  });
});
