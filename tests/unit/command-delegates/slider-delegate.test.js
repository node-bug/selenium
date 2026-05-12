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
    error: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../app/messenger.js', () => ({
  default: jest.fn(({ data }) => `Setting slider to ${data}`),
}));

// ---------------- IMPORTS ----------------
const { log } = await import('@nodebug/logger');

const { SliderDelegate } = await import(
  '../../../app/command-delegates/slider-delegate.js'
);

// ---------------- TESTS ----------------
describe('SliderDelegate (ESM)', () => {
  let mockBrowser;
  let delegate;
  let mockLocator;

  const createLocatorMock = (overrides = {}) => ({
    getAttribute: jest.fn(),
    getRect: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockLocator = createLocatorMock();

    mockBrowser = {
      stack: ['some-slider'],
      message: '',
      _finder: jest.fn().mockResolvedValue(mockLocator),
      handleError: jest.fn(),
      driver: mockDriver,
    };

    delegate = new SliderDelegate(mockBrowser);
  });

  // ---------------- CONSTRUCTOR ----------------
  describe('constructor', () => {
    test('should create a new SliderDelegate instance', () => {
      expect(delegate).toBeInstanceOf(SliderDelegate);
    });

    test('should initialize targetValue to null', () => {
      expect(delegate.targetValue).toBeNull();
    });
  });

  // ---------------- SLIDE TO VALUE ----------------
  describe('slide.to.value()', () => {
    test('should set slider value via JS executeScript', async () => {
      mockLocator.getAttribute
        .mockResolvedValueOnce('50')   // current value
        .mockResolvedValueOnce('0')     // min
        .mockResolvedValueOnce('100');  // max

      await delegate.slide.to.value(75);

      expect(mockBrowser.driver.executeScript).toHaveBeenCalledWith(
        expect.stringContaining('arguments[0].value = 75'),
        mockLocator
      );
      expect(mockBrowser.stack).toEqual([]);
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('Set slider value to 75'));
    });

    test('should handle string value input', async () => {
      mockLocator.getAttribute
        .mockResolvedValueOnce('50')
        .mockResolvedValueOnce('0')
        .mockResolvedValueOnce('100');

      await delegate.slide.to.value('75');

      expect(mockBrowser.driver.executeScript).toHaveBeenCalled();
    });

    test('should handle errors from _finder', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Finder failed'));

      await delegate.slide.to.value(75);

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        'setting slider to 75'
      );
    });
  });

  // ---------------- SLIDE GETTER ----------------
  describe('slide getter', () => {
    test('should return object with to.value method', () => {
      const slide = delegate.slide;
      expect(slide).toHaveProperty('to');
      expect(slide.to).toHaveProperty('value');
      expect(typeof slide.to.value).toBe('function');
    });
  });
});
