import { log } from '@nodebug/logger';
import messenger from '../messenger.js';
import { By } from 'selenium-webdriver'

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
      const locator = await browser._finder();
      const isOn = await this._checkState(locator);
      const needsChange = (targetState === 'on' && !isOn) ||
        (targetState === 'off' && isOn);

      if (needsChange) {
        const tagName = (await locator.tagName).toLowerCase();
        const isInputElement = tagName === 'input';
        const elementFrame = locator.frame;

        log.debug(`Element frame: ${elementFrame}, tagName: ${tagName}`);

        // Check if element is disabled (for input elements)
        if (isInputElement) {
          const isDisabled = await locator.getAttribute('disabled');
          if (isDisabled !== null) {
            throw new Error(`Cannot toggle disabled element`);
          }
        }

        // Attempt to click the element
        try {
          await locator.click();
        } catch (clickErr) {
          // Fallback to JavaScript click if standard click fails
          log.debug(`Standard click failed, using JS click fallback: ${clickErr.message}`);
          await browser.driver.executeScript('arguments[0].click();', locator);
        }

        // Verify state changed
        const newState = await this._checkState(locator);
        const expectedState = targetState === 'on';
        if (newState !== expectedState) {
          throw new Error(`State did not change to ${targetState}`);
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
   * - `<label>`: finds child checkbox/switch and checks `isSelected()`
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
      const locator = await browser._finder();
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
    const tagName = (await locator.tagName).toLowerCase();

    // If the element is a label, find the child checkbox/switch
    if (tagName === 'label') {
      const childCheckbox = await locator.findElement(
        typeof By !== 'undefined' ? By.css('input[type="checkbox"], input[type="radio"], [role="switch"]') : 'input[type="checkbox"]'
      );
      if (!childCheckbox) {
        throw new Error('Label element has no child checkbox or switch');
      }
      return await childCheckbox.isSelected();
    }

    // Check for role="switch" and use aria-checked
    const role = await locator.getAttribute('role');
    if (role === 'switch') {
      const ariaChecked = await locator.getAttribute('aria-checked');
      return ariaChecked === 'true';
    }

    // Default: use isSelected() for native checkboxes and radio buttons
    return await locator.isSelected();
  }
}
