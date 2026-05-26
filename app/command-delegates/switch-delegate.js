import { log } from '@nodebug/logger';
import messenger from '../messenger.js';
import { BaseDelegate } from './base-delegate.js';

/**
 * Switch delegate for handling switch/toggle operations
 *
 * Supports multiple element types:
 * - Native checkboxes (`<input type="checkbox">`)
 * - Elements with `role='switch'` (checked via `aria-checked`)
 * - Elements with `aria-pressed` attribute
 * - DIV elements with `.on` class for state
 * - Elements with `data-state` attribute
 * - Shadow DOM elements
 * - Elements inside iframes
 *
 * Each operation includes a JS-click fallback for switches that are
 * visually rendered but have zero-size Selenium targets.
 *
 * @class SwitchDelegate
 * @param {object} browser - The browser instance providing `_finder`, `handleError`, and `driver`.
 */
export class SwitchDelegate extends BaseDelegate {
  /**
   * @param {object} browser - The browser instance.
   */
  constructor(browser) {
    super(browser);
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
      const locator = await browser._finder();
      const isOn = await this._checkState(locator);
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

        // Final verification - only check if we attempted to change the state
        const finalState = await this._checkState(locator);
        if (finalState === isOn) {
          throw new Error('State did not change');
        }
      } else {
        log.info(`Switch is already ${targetState}. Skipping.`);
      }

      browser.stack = [];
      return true;
    } catch (err) {
      browser.stack = [];
      browser.handleError(err, `toggling switch to ${targetState.toUpperCase()}`);
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
   * - `role='switch'`: reads `aria-checked` attribute
   * - `aria-pressed`: reads `aria-pressed` attribute
   * - `.on` class: checks if element has 'on' class
   * - `data-state`: reads `data-state` attribute
   * - Default: calls `isSelected()` (native checkboxes)
   *
   * @private
   * @returns {Promise<boolean>} True if on, false if off
   * @throws {Error} Throws an error if the switch state cannot be determined
   */
  async _isOn() {
    const browser = this.browser;
    try {
      // Use hidden() modifier to include hidden elements
      const originalStack = [...browser.stack];
      // Modify the last item in the stack to set hidden: true
      if (browser.stack.length > 0) {
        const lastItem = browser.stack[browser.stack.length - 1];
        if (lastItem && typeof lastItem === 'object') {
          browser.stack[browser.stack.length - 1] = { ...lastItem, hidden: true };
        }
      }
      const locator = await browser._finder();
      browser.stack = originalStack;
      const result = await this._checkState(locator);
      browser.stack = [];
      return result;
    } catch (err) {
      browser.stack = [];
      browser.handleError(err, 'validating switch state');
      throw err;
    }
  }

  /**
   * Internal helper to check switch state given a locator.
   *
   * @private
   * @param {Object} locator - The WebElement to check
   * @returns {Promise<boolean>} True if on, false if off
   */
  async _checkState(locator) {
    if (!locator) {
      throw new Error('Could not resolve switch element');
    }

    // Handle role='switch' - check aria-checked attribute
    const role = await locator.getAttribute('role');
    if (role === 'switch') {
      const ariaChecked = await locator.getAttribute('aria-checked');
      return ariaChecked === 'true';
    }

    // Handle aria-pressed attribute
    const ariaPressed = await locator.getAttribute('aria-pressed');
    if (ariaPressed !== null) {
      return ariaPressed === 'true';
    }

    // Handle data-state attribute
    const dataState = await locator.getAttribute('data-state');
    if (dataState !== null) {
      return dataState === 'on';
    }

    // Handle .on class for div/span elements
    const className = await locator.getAttribute('class');
    if (className && className.includes('on')) {
      return true;
    }

    // Default: use isSelected() for native checkboxes
    return await locator.isSelected();
  }
}
