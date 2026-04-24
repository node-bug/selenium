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
   * If the field, textarea or content-editable element was not empty, adds text to it.
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
      let locator = await browser._finder(null, 'write');

      // Perform clear logic
      await browser.clear();

      // Re-find in case the clear triggered a DOM refresh (common in React)
      locator = await browser._finder(null, 'write');
      await locator.sendKeys(value);
    } catch (err) {
      browser.handleError(err, 'overwriting text');
    } finally {
      browser.stack = [];
    }
    return true;
  }
}

// TODO: Enhanced the write function in input-delegate.js to support special key sequences like {ENTER}, {TAB}, {ESCAPE}, {DELETE}, {BACK_SPACE}, {CONTROL+A}, {ARROW_RIGHT}, {ARROW_LEFT}, {ARROW_UP}, {ARROW_DOWN}