import { log } from '@nodebug/logger';
import messenger from '../messenger.js';

/**
 * Switch delegate for handling switch/toggle operations
 * 
 * This class encapsulates all switch-related functionality for elements
 * with role='switch', including on, off, and state checking operations.
 * 
 * @class SwitchDelegate
 */
export class SwitchDelegate {
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Internal helper to set switch state
   * 
   * @private
   * @param {string} targetState - 'on' or 'off'
   * @returns {Promise<boolean>} True if successful
   */
  async #toggleSwitch(targetState) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: targetState });

    try {
      const locator = await browser._finder(null, targetState);
      const isChecked = await locator.isSelected();
      const needsChange = (targetState === 'on' && !isChecked) ||
        (targetState === 'off' && isChecked);

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
        const finalState = await locator.isSelected();
        if (finalState === isChecked) {
          throw new Error(`Failed to set switch ${targetState}. State did not change.`);
        }
      } else {
        log.info(`Switch is already ${targetState}. Skipping.`);
      }
    } catch (err) {
      browser.handleError(err, `setting switch ${targetState}`);
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Turns a switch element on.
   * 
   * Clicks the switch if it's not already on. Falls back to JavaScript
   * click if Selenium click fails.
   * 
   * @returns {Promise<boolean>} True if successful
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
   * click if Selenium click fails.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.switch('dark mode').off();
   */
  async off() {
    return await this.#toggleSwitch('off');
  }

  /**
   * Asserts that a switch is currently on.
   * 
   * Returns true if the switch is on, otherwise throws an error.
   * Use this as an assertion to verify switch state.
   * 
   * @returns {Promise<boolean>} Returns true if switch is on
   * @throws {Error} Throws 'Switch is not ON' if switch is off
   * @example
   * // Assert switch is on (throws if not)
   * await browser.switch('dark mode').isOn();
   * console.log('Switch is confirmed ON');
   */
  async isOn() {
    const browser = this.browser; let result = false
    browser.message = messenger({ stack: browser.stack, action: 'isOn' });
    try {
      const locator = await browser._finder();
      result = await locator.isSelected();
    } catch (err) {
      browser.handleError(err, 'checking if switch is on');
    } finally {
      browser.stack = [];
    }
    if(result) {log.info(`Switch is ON`); return true;}
    throw new Error('Switch is not ON'); 
  }

  /**
   * Asserts that a switch is currently off.
   * 
   * Returns true if the switch is off, otherwise throws an error.
   * Use this as an assertion to verify switch state.
   * 
   * @returns {Promise<boolean>} Returns true if switch is off
   * @throws {Error} Throws 'Switch is not OFF' if switch is on
   * @example
   * // Assert switch is off (throws if not)
   * await browser.switch('dark mode').isOff();
   * console.log('Switch is confirmed OFF');
   */
  async isOff() {
    const browser = this.browser; let result = false
    browser.message = messenger({ stack: browser.stack, action: 'isOff' });
    try {
      const locator = await browser._finder();
      result = !(await locator.isSelected());
    } catch (err) {
      browser.handleError(err, 'checking if switch is off');
    } finally {
      browser.stack = [];
    }
    if(result) {log.info(`Switch is OFF`); return true;}
    throw new Error('Switch is not OFF'); 
  }
}
