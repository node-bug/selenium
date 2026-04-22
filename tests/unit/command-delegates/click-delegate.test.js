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
}));

jest.unstable_mockModule('@nodebug/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
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

  // ---------------- MODIFIER CLICK ----------------
  describe('clickWithModifier()', () => {
    test('works', async () => {
      await clickDelegate.clickWithModifier({ shift: true, ctrl: true });

      expect(actionsMock.keyDown).toHaveBeenCalled();
      expect(actionsMock.click).toHaveBeenCalled();
    });

    test('handles error', async () => {
      const error = new Error('fail');

      actionsMock.keyDown.mockImplementation(() => {
        throw error;
      });

      await clickDelegate.clickWithModifier({ shift: true });

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'clicking with modifier keys'
      );
    });
  });

  // ---------------- _CLICKER (REAL LOGIC) ----------------
  describe('_clicker()', () => {
    beforeEach(() => {
      // IMPORTANT: use real implementation
      delete mockBrowser._clicker;
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
  });
});