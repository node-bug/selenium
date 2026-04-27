import { jest } from '@jest/globals';

// ---------------- MOCKS ----------------
const mockDriver = {
  executeScript: jest.fn(),
  actions: jest.fn(),
  getCapabilities: jest.fn(),
};

jest.unstable_mockModule('selenium-webdriver', () => ({
  Builder: jest.fn(),
  By: {},
  until: {},
  WebDriver: jest.fn(() => mockDriver),
  Key: {
    CONTROL: '\uE009',
    SHIFT: '\uE008',
    ALT: '\uE00A',
    COMMAND: '\uE03D',
    META: '\uE033',
    ENTER: '\uE007',
    TAB: '\uE004',
    ESCAPE: '\uE00C',
    BACK_SPACE: '\uE003',
    DELETE: '\uE017',
    ARROW_UP: '\uE013',
    ARROW_DOWN: '\uE014',
    ARROW_LEFT: '\uE012',
    ARROW_RIGHT: '\uE015',
    HOME: '\uE02F',
    END: '\uE02E',
    PAGE_UP: '\uE030',
    PAGE_DOWN: '\uE031',
    F1: '\uE035',
    F2: '\uE036',
    F3: '\uE037',
    F4: '\uE038',
    F5: '\uE039',
    F6: '\uE03A',
    F7: '\uE03B',
    F8: '\uE03C',
    F9: '\uE03D',
    F10: '\uE03E',
    F11: '\uE03F',
    F12: '\uE040',
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
      _tempMods: { control: false, shift: false, alt: false, meta: false },
      _resetMods: jest.fn(),

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

  // ---------------- PRESS ----------------
  describe('press()', () => {
    beforeEach(() => {
      // Default platform
      mockDriver.getCapabilities.mockReturnValue({
        get: jest.fn().mockReturnValue('mac'),
      });
    });

    test('presses a simple key without modifiers', async () => {
      await inputDelegate.press('Enter');

      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE007');
      expect(actionsMock.perform).toHaveBeenCalled();
    });

    test('presses a regular character key', async () => {
      await inputDelegate.press('a');

      expect(actionsMock.sendKeys).toHaveBeenCalledWith('a');
      expect(actionsMock.perform).toHaveBeenCalled();
    });

    test('presses Tab key', async () => {
      await inputDelegate.press('Tab');

      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE004');
    });

    test('presses Escape key', async () => {
      await inputDelegate.press('Escape');

      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE00C');
    });

    test('presses Esc alias', async () => {
      await inputDelegate.press('esc');

      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE00C');
    });

    test('presses Backspace key', async () => {
      await inputDelegate.press('Backspace');

      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE003');
    });

    test('presses Delete key', async () => {
      await inputDelegate.press('Delete');

      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE017');
    });

    test('presses Del alias', async () => {
      await inputDelegate.press('del');

      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE017');
    });

    test('presses arrow keys', async () => {
      await inputDelegate.press('ArrowUp');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE013');

      actionsMock.sendKeys.mockClear();
      await inputDelegate.press('ArrowDown');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE014');

      actionsMock.sendKeys.mockClear();
      await inputDelegate.press('ArrowLeft');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE012');

      actionsMock.sendKeys.mockClear();
      await inputDelegate.press('ArrowRight');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE015');
    });

    test('presses short arrow aliases', async () => {
      await inputDelegate.press('up');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE013');

      actionsMock.sendKeys.mockClear();
      await inputDelegate.press('down');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE014');

      actionsMock.sendKeys.mockClear();
      await inputDelegate.press('left');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE012');

      actionsMock.sendKeys.mockClear();
      await inputDelegate.press('right');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE015');
    });

    test('presses Home and End keys', async () => {
      await inputDelegate.press('Home');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE02F');

      actionsMock.sendKeys.mockClear();
      await inputDelegate.press('End');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE02E');
    });

    test('presses PageUp and PageDown keys', async () => {
      await inputDelegate.press('PageUp');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE030');

      actionsMock.sendKeys.mockClear();
      await inputDelegate.press('PageDown');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE031');
    });

    test('presses function keys F1-F12', async () => {
      await inputDelegate.press('F1');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE035');

      actionsMock.sendKeys.mockClear();
      await inputDelegate.press('F12');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE040');
    });

    test('presses key with Ctrl modifier', async () => {
      mockBrowser._tempMods = { control: true, shift: false, alt: false, meta: false };

      await inputDelegate.press('c');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE009');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('c');
      expect(actionsMock.perform).toHaveBeenCalled();
    });

    test('presses key with Shift modifier', async () => {
      mockBrowser._tempMods = { control: false, shift: true, alt: false, meta: false };

      await inputDelegate.press('a');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE008');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('a');
    });

    test('presses key with Alt modifier', async () => {
      mockBrowser._tempMods = { control: false, shift: false, alt: true, meta: false };

      await inputDelegate.press('Tab');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE00A');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE004');
    });

    test('presses key with Meta modifier on Mac uses COMMAND', async () => {
      mockBrowser._tempMods = { control: false, shift: false, alt: false, meta: true };

      await inputDelegate.press('w');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE03D');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('w');
    });

    test('presses key with Meta modifier on Windows uses META', async () => {
      mockDriver.getCapabilities.mockReturnValue({
        get: jest.fn().mockReturnValue('windows'),
      });
      mockBrowser._tempMods = { control: false, shift: false, alt: false, meta: true };

      await inputDelegate.press('w');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE033');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('w');
    });

    test('presses key with multiple modifiers Ctrl+Shift', async () => {
      mockBrowser._tempMods = { control: true, shift: true, alt: false, meta: false };

      await inputDelegate.press('c');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE009');
      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE008');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('c');
    });

    test('presses key with all four modifiers', async () => {
      mockBrowser._tempMods = { control: true, shift: true, alt: true, meta: true };

      await inputDelegate.press('c');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE009');
      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE008');
      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE00A');
      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE03D');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('c');
    });

    test('sets browser message with modifiers', async () => {
      mockBrowser._tempMods = { control: true, shift: false, alt: false, meta: false };
      mockBrowser.stack = [{ selector: '#input', type: 'css' }];

      await inputDelegate.press('c');

      expect(mockBrowser.message).toBeDefined();
    });

    test('handles error from press', async () => {
      const error = new Error('key press failed');
      actionsMock.perform.mockRejectedValue(error);

      await inputDelegate.press('Enter');

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        "pressing key 'Enter'"
      );
    });

    test('clears browser stack after press', async () => {
      mockBrowser.stack = [{ selector: '#input', type: 'css' }];

      await inputDelegate.press('Enter');

      expect(mockBrowser.stack).toEqual([]);
    });

    test('returns true on success', async () => {
      const result = await inputDelegate.press('Enter');

      expect(result).toBe(true);
    });

    test('returns true even on error', async () => {
      const error = new Error('key press failed');
      actionsMock.perform.mockRejectedValue(error);

      const result = await inputDelegate.press('Enter');

      expect(result).toBe(true);
    });

    test('is case-insensitive for key names', async () => {
      await inputDelegate.press('ENTER');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE007');

      actionsMock.sendKeys.mockClear();
      await inputDelegate.press('enter');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE007');

      actionsMock.sendKeys.mockClear();
      await inputDelegate.press('Enter');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('\uE007');
    });
  });

  // ---------------- TYPE ----------------
  describe('type()', () => {
    beforeEach(() => {
      // Default platform
      mockDriver.getCapabilities.mockReturnValue({
        get: jest.fn().mockReturnValue('mac'),
      });
      actionsMock.keyDown.mockClear();
      actionsMock.sendKeys.mockClear();
      actionsMock.perform.mockClear();
      mockBrowser._tempMods = { control: false, shift: false, alt: false, meta: false };
    });

    test('types a multi-character string', async () => {
      await inputDelegate.type('abc');

      expect(actionsMock.sendKeys).toHaveBeenCalledWith('abc');
      expect(actionsMock.perform).toHaveBeenCalledTimes(1);
    });

    test('types with shift modifier', async () => {
      mockBrowser._tempMods = { control: false, shift: true, alt: false, meta: false };

      await inputDelegate.type('abc');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE008');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('abc');
    });

    test('types with ctrl modifier', async () => {
      mockBrowser._tempMods = { control: true, shift: false, alt: false, meta: false };

      await inputDelegate.type('abc');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE009');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('abc');
    });

    test('types with alt modifier', async () => {
      mockBrowser._tempMods = { control: false, shift: false, alt: true, meta: false };

      await inputDelegate.type('abc');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE00A');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('abc');
    });

    test('types with meta modifier on Mac uses COMMAND', async () => {
      mockBrowser._tempMods = { control: false, shift: false, alt: false, meta: true };

      await inputDelegate.type('abc');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE03D');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('abc');
    });

    test('types with meta modifier on Windows uses META', async () => {
      mockDriver.getCapabilities.mockReturnValue({
        get: jest.fn().mockReturnValue('windows'),
      });
      mockBrowser._tempMods = { control: false, shift: false, alt: false, meta: true };

      await inputDelegate.type('abc');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE033');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('abc');
    });

    test('types with multiple modifiers Ctrl+Shift', async () => {
      mockBrowser._tempMods = { control: true, shift: true, alt: false, meta: false };

      await inputDelegate.type('abc');

      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE009');
      expect(actionsMock.keyDown).toHaveBeenCalledWith('\uE008');
      expect(actionsMock.sendKeys).toHaveBeenCalledWith('abc');
    });

    test('sets browser message with modifiers', async () => {
      mockBrowser._tempMods = { control: true, shift: false, alt: false, meta: false };
      mockBrowser.stack = [{ selector: '#input', type: 'css' }];

      await inputDelegate.type('abc');

      expect(mockBrowser.message).toBeDefined();
    });

    test('handles error from type', async () => {
      const error = new Error('typing failed');
      actionsMock.perform.mockRejectedValue(error);

      await inputDelegate.type('abc');

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        "typing 'abc'"
      );
    });

    test('clears browser stack after type', async () => {
      mockBrowser.stack = [{ selector: '#input', type: 'css' }];

      await inputDelegate.type('abc');

      expect(mockBrowser.stack).toEqual([]);
    });

    test('returns true on success', async () => {
      const result = await inputDelegate.type('abc');

      expect(result).toBe(true);
    });

    test('returns true even on error', async () => {
      const error = new Error('typing failed');
      actionsMock.perform.mockRejectedValue(error);

      const result = await inputDelegate.type('abc');

      expect(result).toBe(true);
    });
  });
});