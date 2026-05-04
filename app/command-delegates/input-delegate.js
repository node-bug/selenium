import { Key } from 'selenium-webdriver';
import messenger from '../messenger.js';

/**
 * Input delegate class for handling element input operations
 * 
 * This class encapsulates all input-related functionality including:
 * - Writing text to input fields
 * - Focusing elements
 * - Clearing input fields
 * - Overwriting text in input fields
 */
export class InputDelegate {
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Enter text into an input field or content-editable element
   * 
   * Writes text to an input field, textarea, or content-editable element.
   * If the field, textarea or content-editable element was not empty, does not clear but adds text to it.
   * Handles both standard form fields and custom content-editable elements.
   * 
   * @param {string} value - Text to enter
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('username').write('myusername');
   * await browser.textbox('search').write('query');
   */
  async write(value) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'write', data: value });
    try {
      const locator = await browser._finder(null, 'write');
      const isInput = ['input', 'textarea'].includes(locator.tagName);

      if (isInput) {
        await locator.sendKeys(value);
      } else {
        // Fallback for custom content-editable fields
        const text = await locator.getAttribute('textContent');
        await browser._clicker(locator);
        // Move to end of text
        for (let i = 0; i < text.length; i++) {
          await browser.actions().sendKeys(Key.ARROW_RIGHT).perform();
        }
        await browser.actions().sendKeys(value).perform();
      }
    } catch (err) {
      browser.handleError(err, 'entering data');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Sets focus on an element using JavaScript.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.textbox('username').focus();
   * await browser.element('input').focus();
   */
  async focus() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'focus' });
    try {
      const locator = await browser._finder();
      await browser.driver.executeScript('arguments[0].focus();', locator);
    } catch (err) {
      browser.handleError(err, 'focusing');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Clears text from an input field or content-editable element.
   * 
   * Clears text from input fields, textareas, or content-editable elements.
   * Uses keyboard shortcuts as fallback for complex cases.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.textbox('username').clear();
   * await browser.element('search').clear();
   */
  async clear() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'clear' });
    try {
      const locator = await browser._finder(null, 'write');
      const isInput = ['input', 'textarea'].includes(locator.tagName);

      if (isInput) {
        await locator.clear();
        // Fallback check: if it's still not empty, use keyboard shortcuts
        const value = await locator.getAttribute('value');
        if (value !== '') {
          await locator.sendKeys(Key.CONTROL, 'a', Key.BACK_SPACE);
        }
      } else {
        // For Content-Editable elements
        await browser._clicker(locator);
        await browser.actions().keyDown(Key.CONTROL).sendKeys('a').keyUp(Key.CONTROL).sendKeys(Key.BACK_SPACE).perform();
      }
    } catch (err) {
      browser.handleError(err, 'clearing field');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Overwrites text in an input field.
   * 
   * Clears existing text and enters new text. Useful for form fields that
   * may have default values or validation that prevents direct entry.
   * 
   * @param {string} value - Text to overwrite with
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.textbox('username').overwrite('newvalue');
   */
  async overwrite(value) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'overwrite', data: value });
    try {
      // to maintain stack after clear
      let ogStack = browser.stack
      await this.clear();
      browser.stack = ogStack

      // Re-find in case the clear triggered a DOM refresh (common in React)
      let locator = await browser._finder(null, 'write');
      await locator.sendKeys(value);
    } catch (err) {
      browser.handleError(err, 'overwriting text');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Presses a keyboard key, optionally with modifier keys.
   * 
   * Sends a key press to the currently focused element using Selenium's Actions API.
   * Supports modifier keys via chaining: `browser.ctrl.press('c')` for Ctrl+C.
   * 
   * @param {string} key - The key to press (e.g., 'Enter', 'Tab', 'Escape', 'a', 'c')
   * @returns {Promise<boolean>} True if successful
   * @example
   * @example
   * await browser.press('Enter');
   * await browser.press('Tab');
   * await browser.press('Escape');
   * await browser.ctrl.press('c'); // Ctrl+C
   * await browser.ctrl.shift.press('c'); // Ctrl+Shift+C
   * await browser.alt.press('Tab'); // Alt+Tab
   * await browser.meta.press('w'); // Cmd+W on Mac
   */
  async press(key) {
    const browser = this.browser;
    const mods = browser._tempMods;

    const modifiers = [];
    if (mods.control) modifiers.push('ctrl');
    if (mods.shift) modifiers.push('shift');
    if (mods.alt) modifiers.push('alt');
    if (mods.meta) modifiers.push('meta');
    browser.message = messenger({ stack: browser.stack, action: 'press', data: key, modifiers });

    const platformName = (await browser.driver.getCapabilities()).get('platformName').replace(/\s/g, '');
    try {
      if (browser.stack.length > 0) await this.focus();
      const actions = browser.actions();

      if (mods.control) actions.keyDown(Key.CONTROL);
      if (mods.shift) actions.keyDown(Key.SHIFT);
      if (mods.alt) actions.keyDown(Key.ALT);
      if (mods.meta) if (platformName === 'mac') actions.keyDown(Key.COMMAND); else actions.keyDown(Key.META);

      // Normalize key name to Selenium Key constant if applicable
      const keyMap = {
        'enter': Key.ENTER,
        'tab': Key.TAB,
        'escape': Key.ESCAPE,
        'esc': Key.ESCAPE,
        'backspace': Key.BACK_SPACE,
        'delete': Key.DELETE,
        'del': Key.DELETE,
        'arrowup': Key.ARROW_UP,
        'arrowdown': Key.ARROW_DOWN,
        'arrowleft': Key.ARROW_LEFT,
        'arrowright': Key.ARROW_RIGHT,
        'up': Key.ARROW_UP,
        'down': Key.ARROW_DOWN,
        'left': Key.ARROW_LEFT,
        'right': Key.ARROW_RIGHT,
        'home': Key.HOME,
        'end': Key.END,
        'pageup': Key.PAGE_UP,
        'pagedown': Key.PAGE_DOWN,
        'f1': Key.F1,
        'f2': Key.F2,
        'f3': Key.F3,
        'f4': Key.F4,
        'f5': Key.F5,
        'f6': Key.F6,
        'f7': Key.F7,
        'f8': Key.F8,
        'f9': Key.F9,
        'f10': Key.F10,
        'f11': Key.F11,
        'f12': Key.F12,
      };
      const normalizedKey = key.toLowerCase();
      const resolvedKey = keyMap[normalizedKey] || key;
      actions.sendKeys(resolvedKey);
      
      await actions.perform();
    } catch (err) {
      browser.handleError(err, `pressing key '${key}'`);
    } finally {
      if (mods.control || mods.shift || mods.alt || mods.meta) {
        const actions = browser.actions();
        if (mods.control) actions.keyUp(Key.CONTROL);
        if (mods.shift) actions.keyUp(Key.SHIFT);
        if (mods.alt) actions.keyUp(Key.ALT);
        if (mods.meta) if (platformName === 'mac') actions.keyUp(Key.COMMAND); else actions.keyUp(Key.META);
        await actions.perform()
      }
      browser._resetMods()
      browser.stack = [];
    }
    return true;
  }

  /**
   * Types a sequence of characters, one at a time, with optional modifier keys held.
   * 
   * Each character in the string is sent individually via Selenium's Actions API,
   * allowing for precise control over typing speed and modifier key behavior.
   * This is a terminal operation — the stack is cleared after execution.
   * 
   * @param {string} value - The string to type character by character
   * @returns {Promise<boolean>} True if successful
   * @example
   * @example
   * await browser.element('username').type('myusername');
   * await browser.ctrl.type('a'); // Types 'a' while holding Ctrl
   * await browser.shift.type('abc'); // Types 'abc' while holding Shift
   */
  async type(value) {
    const browser = this.browser;
    const mods = browser._tempMods;

    const modifiers = [];
    if (mods.control) modifiers.push('ctrl');
    if (mods.shift) modifiers.push('shift');
    if (mods.alt) modifiers.push('alt');
    if (mods.meta) modifiers.push('meta');
    browser.message = messenger({ stack: browser.stack, action: 'type', data: value, modifiers });

    const platformName = (await browser.driver.getCapabilities()).get('platformName').replace(/\s/g, '');
    try {
      if (browser.stack.length > 0) await this.focus();

      const actions = browser.actions();

      if (mods.control) actions.keyDown(Key.CONTROL);
      if (mods.shift) actions.keyDown(Key.SHIFT);
      if (mods.alt) actions.keyDown(Key.ALT);
      if (mods.meta) if (platformName === 'mac') actions.keyDown(Key.COMMAND); else actions.keyDown(Key.META);

      actions.sendKeys(value);

      await actions.perform();
    } catch (err) {
      browser.handleError(err, `typing '${value}'`);
    } finally {
      if (mods.control || mods.shift || mods.alt || mods.meta) {
        const actions = browser.actions();
        if (mods.control) actions.keyUp(Key.CONTROL);
        if (mods.shift) actions.keyUp(Key.SHIFT);
        if (mods.alt) actions.keyUp(Key.ALT);
        if (mods.meta) if (platformName === 'mac') actions.keyUp(Key.COMMAND); else actions.keyUp(Key.META);
        await actions.perform();
      }
      browser._resetMods()
      browser.stack = [];
    }
    return true;
  }
}
