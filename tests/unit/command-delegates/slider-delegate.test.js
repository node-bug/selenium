import { vi } from 'vitest';

// ---------------- MOCKS ----------------
const mockActions = {
  move: vi.fn().mockReturnThis(),
  click: vi.fn().mockReturnThis(),
  perform: vi.fn().mockResolvedValue(undefined),
};

const mockDriver = {
  executeScript: vi.fn(),
  actions: vi.fn(() => mockActions),
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
    error: vi.fn(),
  },
}));

vi.mock('../../../app/messenger.js', () => ({
  default: vi.fn(({ data }) => `Setting slider to ${data}`),
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
    getAttribute: vi.fn(),
    getRect: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockLocator = createLocatorMock();

    mockBrowser = {
      stack: ['some-slider'],
      message: '',
      _finder: vi.fn().mockResolvedValue(mockLocator),
      handleError: vi.fn(),
      driver: mockDriver,
      actions: vi.fn(() => mockActions),
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
      // Mock getAttribute calls in order: min, max, step
      mockLocator.getAttribute
        .mockResolvedValueOnce('0')     // min
        .mockResolvedValueOnce('100')     // max
        .mockResolvedValueOnce(null);    // step (null means no step constraint)

      // Mock getBoundingClientRect result for slider dimensions
      mockDriver.executeScript
        .mockResolvedValueOnce({ width: 200, height: 20 })  // getBoundingClientRect
        .mockResolvedValueOnce(undefined);  // set value via JS

      await delegate.slide.to.value(75);

      expect(mockBrowser.driver.executeScript).toHaveBeenCalledWith(
        expect.stringContaining('const newValue = 75'),
        mockLocator
      );
      expect(mockBrowser.stack).toEqual([]);
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('Set slider value to 75'));
    });

    test('should handle string value input', async () => {
      mockLocator.getAttribute
        .mockResolvedValueOnce('0')
        .mockResolvedValueOnce('100')
        .mockResolvedValueOnce(null);

      mockDriver.executeScript
        .mockResolvedValueOnce({ width: 200, height: 20 })
        .mockResolvedValueOnce(undefined);

      await delegate.slide.to.value('75');

      expect(mockBrowser.driver.executeScript).toHaveBeenCalled();
    });

    test('should handle errors from _finder', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('Finder failed'));

      await delegate.slide.to.value(75);

      expect(mockBrowser.handleError).toHaveBeenCalled();
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
