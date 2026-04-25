import { jest } from '@jest/globals';

// ---------------- MOCKS ----------------
const mockDriver = {
  executeScript: jest.fn(),
  actions: jest.fn(),
  getCapabilities: jest.fn().mockResolvedValue({
    get: jest.fn().mockReturnValue('Mac')
  }),
};

const KEY_MAP = {
  CONTROL: '\uE009',
  SHIFT: '\uE008',
  ALT: '\uE00A',
  META: '\uE03D',
};

jest.unstable_mockModule('selenium-webdriver', () => ({
  Builder: jest.fn(),
  By: {},
  until: {},
  WebDriver: jest.fn(() => mockDriver),
  Key: KEY_MAP,
}));

jest.unstable_mockModule('@nodebug/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// ---------------- IMPORTS ----------------
const { ClickDelegate } = await import(
  '../../../app/command-delegates/click-delegate.js'
);

// ---------------- TESTS ----------------
describe('ClickDelegate (ESM)', () => {
  let mockBrowser;
  let clickDelegate;
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
    perform: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockElement = {
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
      _tempMods: { control: false, shift: false, alt: false, meta: false },

      // REQUIRED
      _finder: jest.fn().mockResolvedValue(mockElement),
      _clicker: jest.fn(), // mocked for click() tests
      actions: jest.fn(() => actionsMock),
    };

    clickDelegate = new ClickDelegate(mockBrowser);
  });

  // ---------------- CLICK ----------------
  describe('click()', () => {
    test('calls finder and clicker', async () => {
      await clickDelegate.click();

      expect(mockBrowser._finder).toHaveBeenCalled();
      expect(mockBrowser._clicker).toHaveBeenCalled();
    });

    test('passes coordinates to clicker', async () => {
      await clickDelegate.click(10, 20);

      expect(mockBrowser._clicker).toHaveBeenCalledWith(
        mockElement,
        10,
        20
      );
    });

    test('handles error from clicker', async () => {
      const error = new Error('fail');
      mockBrowser._clicker.mockRejectedValue(error);

      await clickDelegate.click();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'clicking'
      );
    });
  });

  // ---------------- DOUBLE CLICK ----------------
  describe('doubleClick()', () => {
    test('works', async () => {
      await clickDelegate.doubleClick();

      expect(actionsMock.doubleClick).toHaveBeenCalled();
      expect(actionsMock.perform).toHaveBeenCalled();
    });

    test('handles error', async () => {
      const error = new Error('fail');
      actionsMock.doubleClick.mockImplementation(() => {
        throw error;
      });

      await clickDelegate.doubleClick();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'double clicking'
      );
    });
  });

  // ---------------- RIGHT CLICK ----------------
  describe('rightClick()', () => {
    test('works', async () => {
      await clickDelegate.rightClick();

      expect(actionsMock.contextClick).toHaveBeenCalled();
    });
  });

  // ---------------- TRIPLE CLICK ----------------
  describe('tripleClick()', () => {
    test('clicks 3 times', async () => {
      await clickDelegate.tripleClick();

      expect(actionsMock.click).toHaveBeenCalledTimes(3);
    });
  });

  // ---------------- LONG PRESS ----------------
  describe('longPress()', () => {
    test('works', async () => {
      await clickDelegate.longPress();

      expect(actionsMock.clickAndHold).toHaveBeenCalled();
      expect(actionsMock.release).toHaveBeenCalled();
    });
  });

  // ---------------- MULTIPLE CLICK ----------------
  describe('multipleClick()', () => {
    test('default 2 clicks', async () => {
      await clickDelegate.multipleClick();

      expect(actionsMock.click).toHaveBeenCalledTimes(2);
    });

    test('custom clicks', async () => {
      await clickDelegate.multipleClick(5);

      expect(actionsMock.click).toHaveBeenCalledTimes(5);
    });
  });

  // ---------------- _CLICKER (REAL LOGIC) ----------------
  describe('_clicker()', () => {
    beforeEach(() => {
      // IMPORTANT: use real implementation
      delete mockBrowser._clicker;
      mockBrowser._tempMods = { control: false, shift: false, alt: false, meta: false };
      clickDelegate = new ClickDelegate(mockBrowser);
    });

    test('clicks with coordinates', async () => {
      await clickDelegate._clicker(mockElement, 10, 10);

      expect(actionsMock.move).toHaveBeenCalled();
      expect(actionsMock.click).toHaveBeenCalled();
    });

    test('throws out of bounds', async () => {
      await expect(
        clickDelegate._clicker(mockElement, 200, 200)
      ).rejects.toThrow('Click out of bounds');
    });

    test('fallback to JS click', async () => {
      mockElement.click.mockRejectedValue({
        name: 'ElementNotInteractableError',
      });

      await clickDelegate._clicker(mockElement);

      expect(mockDriver.executeScript).toHaveBeenCalled();
    });

    test('throws other errors', async () => {
      const error = { name: 'OtherError' };

      mockElement.click.mockRejectedValue(error);

      await expect(
        clickDelegate._clicker(mockElement)
      ).rejects.toEqual(error);
    });

    test('simple click without modifiers uses element click', async () => {
      mockBrowser._tempMods = { control: false, shift: false, alt: false, meta: false };
      await clickDelegate._clicker(mockElement);

      expect(mockElement.click).toHaveBeenCalled();
      expect(actionsMock.keyDown).not.toHaveBeenCalled();
    });

    test('click with Control modifier uses Actions API', async () => {
      mockBrowser._tempMods = { control: true, shift: false, alt: false, meta: false };
      await clickDelegate._clicker(mockElement);

      expect(actionsMock.keyDown).toHaveBeenCalledWith(expect.anything());
      expect(actionsMock.click).toHaveBeenCalledWith(mockElement);
      expect(actionsMock.keyUp).toHaveBeenCalled();
      expect(actionsMock.perform).toHaveBeenCalled();
    });

    test('click with Shift modifier uses Actions API', async () => {
      mockBrowser._tempMods = { control: false, shift: true, alt: false, mseta: false };
      await clickDelegate._clicker(mockElement);

      expect(actionsMock.keyDown).toHaveBeenCalled();
      expect(actionsMock.click).toHaveBeenCalledWith(mockElement);
      expect(actionsMock.keyUp).toHaveBeenCalled();
    });

    test('click with Alt modifier uses Actions API', async () => {
      mockBrowser._tempMods = { control: false, shift: false, alt: true, meta: false };
      await clickDelegate._clicker(mockElement);

      expect(actionsMock.keyDown).toHaveBeenCalled();
      expect(actionsMock.click).toHaveBeenCalledWith(mockElement);
      expect(actionsMock.keyUp).toHaveBeenCalled();
    });

    test('click with Meta modifier uses Actions API', async () => {
      mockBrowser._tempMods = { control: false, shift: false, alt: false, meta: true };
      await clickDelegate._clicker(mockElement);

      expect(actionsMock.keyDown).toHaveBeenCalled();
      expect(actionsMock.click).toHaveBeenCalledWith(mockElement);
      expect(actionsMock.keyUp).toHaveBeenCalled();
    });

    test('click with multiple modifiers presses and releases all keys', async () => {
      mockBrowser._tempMods = { control: true, shift: true, alt: false, meta: false };
      await clickDelegate._clicker(mockElement);

      expect(actionsMock.keyDown).toHaveBeenCalledTimes(2);
      expect(actionsMock.keyUp).toHaveBeenCalledTimes(2);
      expect(actionsMock.click).toHaveBeenCalledWith(mockElement);
      expect(actionsMock.perform).toHaveBeenCalled();
    });

    test('click with modifiers and coordinates uses Actions API with move', async () => {
      mockBrowser._tempMods = { control: true, shift: false, alt: false, meta: false };
      await clickDelegate._clicker(mockElement, 10, 10);

      expect(actionsMock.keyDown).toHaveBeenCalled();
      expect(actionsMock.move).toHaveBeenCalled();
      expect(actionsMock.click).toHaveBeenCalled();
      expect(actionsMock.keyUp).toHaveBeenCalled();
      expect(actionsMock.perform).toHaveBeenCalled();
    });

    test('modifiers are pressed before click and released after', async () => {
      mockBrowser._tempMods = { control: true, shift: true, alt: false, meta: false };

      const callOrder = [];
      actionsMock.keyDown.mockImplementation(() => {
        callOrder.push('keyDown');
        return actionsMock;
      });
      actionsMock.click.mockImplementation(() => {
        callOrder.push('click');
        return actionsMock;
      });
      actionsMock.keyUp.mockImplementation(() => {
        callOrder.push('keyUp');
        return actionsMock;
      });

      await clickDelegate._clicker(mockElement);

      expect(callOrder[0]).toBe('keyDown');
      expect(callOrder[callOrder.length - 1]).toBe('keyUp');
      const clickIndex = callOrder.indexOf('click');
      const keyDownIndex = callOrder.indexOf('keyDown');
      const keyUpIndex = callOrder.lastIndexOf('keyUp');
      expect(clickIndex).toBeGreaterThan(keyDownIndex);
      expect(clickIndex).toBeLessThan(keyUpIndex);
    });
  });
});