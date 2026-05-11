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

  // ---------------- _IS SET ----------------
  describe('_isSet()', () => {
    test('should return true if radio button is set', async () => {
      mockLocator.isSelected.mockResolvedValue(true);

      const result = await delegate._isSet();

      expect(result).toBe(true);
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should return false if radio button is not set', async () => {
      mockLocator.isSelected.mockResolvedValue(false);

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
