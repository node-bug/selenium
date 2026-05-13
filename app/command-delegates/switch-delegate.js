import { log } from '@nodebug/logger';
import messenger from '../messenger.js';
import { By } from "selenium-webdriver"

/**
 * Switch delegate for handling switch/toggle operations
 * 
 * Supports three element types:
 * - Native checkboxes (`<input type="checkbox">`)
 * - Elements with `role='switch'` (checked via `aria-checked`)
 * - `<label>` wrappers (locates child checkbox/switch via `findElement`)
 * 
 * Each operation includes a JS-click fallback for switches that are
 * visually rendered but have zero-size Selenium targets.
 * 
 * @class SwitchDelegate
 * @param {object} browser - The browser instance providing `_finder`, `handleError`, and `driver`.
 */
export class SwitchDelegate {
  /**
   * @param {object} browser - The browser instance.
   */
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Internal helper to set switch state
   * 
   * Clicks the element if the current state differs from the target.
   * Falls back to a JavaScript click if the Selenium click fails.
   * Always returns `true`; errors are delegated to `browser.handleError`.
   * 
   * @private
   * @param {string} targetState - 'on' or 'off'
   * @returns {Promise<boolean>} Always returns true
   */
  async #toggleSwitch(targetState) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: targetState });

    try {
      let ogStack = browser.stack
      const locator = await browser._finder(null, targetState);
      const isOn = await this._isOn();
      browser.stack = ogStack
      const needsChange = (targetState === 'on' && !isOn) ||
        (targetState === 'off' && isOn);

      if (needsChange) {
        try {
          await locator.click();
        } catch {
          // Fallback: Many modern switches are 0x0 pixels and covered by a <label>.
          // If Selenium can't "click" it, we force the change via JS.
          log.debug('Standard click failed, attempting JS click for switch');
          await browser.driver.executeScript('arguments[0].click();', locator);
        }

        // Final verification
        const finalState = await this._isOn();
        if (finalState === isOn) {
          log.error(`Failed to set switch ${targetState}. State did not change.`)
          throw new Error(`Failed to set switch ${targetState}. State did not change.`);
        }
      } else {
        log.info(`Switch is already ${targetState}. Skipping.`);
      }

      browser.stack = [];
      return true;
    } catch (err) {
      browser.stack = [];
      browser.handleError(err, `${targetState}ing switch`);
      throw err;
    }
  }

  /**
   * Turns a switch element on.
   * 
   * Clicks the switch if it's not already on. Falls back to JavaScript
   * click if the Selenium click fails (e.g., zero-size targets covered
   * by a `<label>`). Always returns `true`; errors are logged via
   * `browser.handleError`.
   * 
   * @returns {Promise<boolean>} Always returns true
   * @example
   * await browser.switch('dark mode').on();
   */
  async on() {
    return await this.#toggleSwitch('on');
  }

  /**
   * Turns a switch element off.
   * 
   * Clicks the switch if it's not already off. Falls back to JavaScript
   * click if the Selenium click fails (e.g., zero-size targets covered
   * by a `<label>`). Always returns `true`; errors are logged via
   * `browser.handleError`.
   * 
   * @returns {Promise<boolean>} Always returns true
   * @example
   * await browser.switch('dark mode').off();
   */
  async off() {
    return await this.#toggleSwitch('off');
  }

  /**
   * Internal helper to check if switch is on.
   * 
   * Determines state by inspecting the element type:
   * - `<label>`: finds child checkbox/switch and checks `isSelected()`
   * - `role='switch'`: reads `aria-checked` attribute
   * - Default: calls `isSelected()` (native checkboxes)
   * 
   * @private
   * @returns {Promise<boolean>} True if on, false if off
   * @throws {Error} Throws an error if the switch state cannot be determined
   */
  async _isOn() {
    const browser = this.browser;
    try {
      const locator = await browser._finder();

      const tagName = locator.tagName.toLowerCase();
      const isWrapper = ['label', 'div', 'span'].includes(tagName);
      const isActualSwitch = tagName === 'input' || (await locator.getAttribute('role') === 'switch');

      let result = false;
      if (isWrapper && !isActualSwitch) {
        // If the locator is a label, we must find the actual checkbox/input child to check its state
        const checkbox = await locator.findElement(By.css(
          "input[type='checkbox'], [role='checkbox'], [role='switch']"
        ));
        if (!checkbox) {
          log.error('Switch locator is a wrapper, but no child checkbox/switch element was found.');
          throw new Error('Switch locator is a wrapper, but no child checkbox/switch element was found.');
        }
        result = await checkbox.isSelected();
      } else if (await locator.getAttribute('role') === 'switch') {
        // If it's a button/element with role='switch', check aria-checked
        const ariaChecked = await locator.getAttribute('aria-checked');
        result = ariaChecked === 'true';
      } else {
        // Default fallback to isSelected (works for native checkboxes)
        result = await locator.isSelected();
      }
      browser.stack = [];
      return result;
    } catch (err) {
      browser.stack = [];
      browser.handleError(err, 'validating switch state');
      throw err;
    }
  }
}
