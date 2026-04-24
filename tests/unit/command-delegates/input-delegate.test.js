import { jest } from '@jest/globals';

// ---------------- MOCKS ----------------
const mockDriver = {
  executeScript: jest.fn(),
  actions: jest.fn(),
};

jest.unstable_mockModule('selenium-webdriver', () => ({
  Builder: jest.fn(),
  By: {},
  until: {},
  WebDriver: jest.fn(() => mockDriver),
  Key: {
    ARROW_RIGHT: '\uE015',
  },
}));

jest.unstable_mockModule('@nodebug/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock messenger module
jest.unstable_mockModule('../../../app/messenger.js', () => ({
  default: jest.fn(() => ({ stack: [], action: 'write', data: '' })),
}));

// ---------------- IMPORTS ----------------
const { InputDelegate } = await import('../../../app/command-delegates/input-delegate.js');

// ---------------- TESTS ----------------
describe('InputDelegate (ESM)', () => {
  let mockBrowser;
  let inputDelegate;
  let mockElement;
  let actionsMock;

  const createActionsMock = (overrides = {}) => ({
    click: jest.fn().mockReturnThis(),
    doubleClick: jest.fn().mockReturnThis(),
    contextClick: jest.fn().mockReturnThis(),
    middleClick: jest.fn().mockReturnThis(),
    keyDown: jest.fn().mockReturnThis(),
    keyUp: jest.fn().mockReturnThis(),
    clickAndHold: jest.fn().mockReturnThis(),
    pause: jest.fn().mockReturnThis(),
    release: jest.fn().mockReturnThis(),
    move: jest.fn().mockReturnThis(),
    sendKeys: jest.fn().mockReturnThis(),
    perform: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockElement = {
      sendKeys: jest.fn(),
      clear: jest.fn(),
      getAttribute: jest.fn(),
      click: jest.fn(),
      getRect: jest.fn().mockResolvedValue({
        x: 0,
        y: 0,
        width: 100,
        height: 50,
      }),
    };

    actionsMock = createActionsMock();

    mockDriver.actions.mockReturnValue(actionsMock);

    mockBrowser = {
      driver: mockDriver,
      stack: [],
      locatorStrategy: { build: jest.fn() },
      handleError: jest.fn(),
      message: null,

      // REQUIRED
      _finder: jest.fn().mockResolvedValue(mockElement),
      _clicker: jest.fn(), // mocked for click() tests
      actions: jest.fn(() => actionsMock),
      clear: jest.fn(), // for overwrite test
    };

    inputDelegate = new InputDelegate(mockBrowser);
  });

  // ---------------- WRITE ----------------
  describe('write()', () => {
    test('calls finder with correct parameters', async () => {
      await inputDelegate.write('test');

      expect(mockBrowser._finder).toHaveBeenCalledWith(null, 'write');
    });

    test('sends text to input elements', async () => {
      mockElement.tagName = 'input';
      mockElement.sendKeys.mockResolvedValue();

      await inputDelegate.write('test');

      expect(mockElement.sendKeys).toHaveBeenCalledWith('test');
    });

    test('handles content-editable elements', async () => {
      mockElement.tagName = 'div';
      mockElement.getAttribute.mockResolvedValue('existing text');
      mockElement.sendKeys.mockResolvedValue();

      await inputDelegate.write('test');

      expect(mockBrowser._clicker).toHaveBeenCalled();
      expect(actionsMock.sendKeys).toHaveBeenCalled();
    });

    test('handles error from finder', async () => {
      const error = new Error('fail');
      mockBrowser._finder.mockRejectedValue(error);

      await inputDelegate.write('test');

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'entering data'
      );
    });

    test('handles error from sendKeys', async () => {
      mockElement.tagName = 'input';
      const error = new Error('fail');
      mockElement.sendKeys.mockRejectedValue(error);

      await inputDelegate.write('test');

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'entering data'
      );
    });
  });

  // ---------------- FOCUS ----------------
  describe('focus()', () => {
    test('calls finder and executes focus script', async () => {
      await inputDelegate.focus();

      expect(mockBrowser._finder).toHaveBeenCalled();
      expect(mockDriver.executeScript).toHaveBeenCalledWith(
        'arguments[0].focus();',
        mockElement
      );
    });

    test('handles error from focus', async () => {
      const error = new Error('fail');
      mockDriver.executeScript.mockRejectedValue(error);

      await inputDelegate.focus();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'focusing'
      );
    });
  });

  // ---------------- CLEAR ----------------
  describe('clear()', () => {
    test('calls finder with correct parameters', async () => {
      await inputDelegate.clear();

      expect(mockBrowser._finder).toHaveBeenCalledWith(null, 'write');
    });

    test('clears input elements', async () => {
      mockElement.tagName = 'input';
      mockElement.clear.mockResolvedValue();

      await inputDelegate.clear();

      expect(mockElement.clear).toHaveBeenCalled();
    });

    test('clears content-editable elements', async () => {
      mockElement.tagName = 'div';
      mockElement.getAttribute.mockResolvedValue('some text');
      mockElement.sendKeys.mockResolvedValue();

      await inputDelegate.clear();

      expect(mockBrowser._clicker).toHaveBeenCalled();
      expect(actionsMock.keyDown).toHaveBeenCalled();
      expect(actionsMock.sendKeys).toHaveBeenCalled();
      expect(actionsMock.keyUp).toHaveBeenCalled();
    });

    test('handles error from clear', async () => {
      const error = new Error('fail');

      // 1. Ensure it looks like an input so it hits locator.clear()
      mockElement.tagName = 'input';

      // 2. Setup the rejection
      mockElement.clear.mockRejectedValue(error);

      // 3. Ensure the finder returns this specific mockElement
      mockBrowser._finder.mockResolvedValue(mockElement);

      await inputDelegate.clear();

      // This should now succeed
      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'clearing field'
      );
    });
  });

  // ---------------- OVERWRITE ----------------
  describe('overwrite()', () => {
    test('calls finder and clear', async () => {
      mockElement.tagName = 'input';
      mockElement.clear.mockResolvedValue();
      mockElement.getAttribute.mockResolvedValue('');
      mockElement.sendKeys.mockResolvedValue();

      await inputDelegate.overwrite('test');

      // overwrite() calls this.clear() internally, which calls _finder,
      // then re-finds the element and sends keys
      expect(mockBrowser._finder).toHaveBeenCalledTimes(2);
      expect(mockElement.clear).toHaveBeenCalled();
    });

    test('sends text after clear', async () => {
      mockElement.tagName = 'input';
      mockElement.clear.mockResolvedValue();
      mockElement.getAttribute.mockResolvedValue('');
      mockElement.sendKeys.mockResolvedValue();

      await inputDelegate.overwrite('test');

      expect(mockElement.sendKeys).toHaveBeenCalledWith('test');
    });

    test('handles error from overwrite', async () => {
      const error = new Error('fail');
      // overwrite() calls this.clear() which uses _finder, so mock _finder to reject
      mockBrowser._finder.mockRejectedValue(error);

      await inputDelegate.overwrite('test');

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'overwriting text'
      );
    });
  });
});