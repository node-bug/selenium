import { log } from '@nodebug/logger';
import messenger from '../messenger.js';

/**
 * Radio delegate for handling radio button operations
 * 
 * This class encapsulates all radio button-related functionality,
 * including selection and state validation operations.
 * 
 * @class RadioDelegate
 */
export class RadioDelegate {
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Sets a radio button.
   * 
   * Clicks the radio button if it's not already set. Falls back to
   * JavaScript click if Selenium click fails.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.radio('option-a').set();
   */
  async set() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'on' });

    try {
      const locator = await browser._finder(null, 'select');
      const isSet = await locator.isSelected();

      if (!isSet) {
        try {
          await locator.click();
        } catch {
          // Fallback: Many modern radio buttons are 0x0 pixels and covered by a <label>.
          // If Selenium can't "click" it, we force the change via JS.
          log.debug('Standard click failed, attempting JS click for radio button');
          await browser.driver.executeScript('arguments[0].click();', locator);
        }

        // Final verification
        const finalState = await locator.isSelected();
        if (!finalState) {
          throw new Error('Failed to set radio button. State did not change.');
        }
      } else {
        log.info('Radio button is already set. Skipping.');
      }
    } catch (err) {
      browser.handleError(err, 'setting radio button');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Asserts that a radio button is currently set.
   * 
   * Returns true if the radio button is set, otherwise throws an error.
   * Use this as an assertion to verify radio button state.
   * 
   * @returns {Promise<boolean>} Returns true if radio button is set
   * @throws {Error} Throws 'Radio button is not set' if radio button is not set
   * @example
   * // Assert radio button is set (throws if not)
   * await browser.radio('option-a').isSet();
   * console.log('Radio button is confirmed set');
   */
  async isSet() {
    const browser = this.browser;
    let result = false;
    browser.message = messenger({ stack: browser.stack, action: 'isSet' });

    try {
      const locator = await browser._finder();
      result = await locator.isSelected();
    } catch (err) {
      browser.handleError(err, 'validating if radio button is set');
    } finally {
      browser.stack = [];
    }

    if (result) {
      log.info('Radio button is set');
      return true;
    }

    const err = new Error('Radio button is not set');
    browser.handleError(err, 'validating if radio button is set');
    throw err;
  }

  /**
   * Asserts that a radio button is currently NOT set.
   * 
   * Returns true if the radio button is not set, otherwise throws an error.
   * Use this as an assertion to verify radio button state.
   * 
   * @returns {Promise<boolean>} Returns true if radio button is not set
   * @throws {Error} Throws 'Radio button is set' if radio button is set
   * @example
   * // Assert radio button is not set (throws if it is)
   * await browser.radio('option-b').isNotSet();
   * console.log('Radio button is confirmed not set');
   */
  async isNotSet() {
    const browser = this.browser;
    let result = false;
    browser.message = messenger({ stack: browser.stack, action: 'isNotSet' });

    try {
      const locator = await browser._finder();
      result = !(await locator.isSelected());
    } catch (err) {
      browser.handleError(err, 'validating if radio button is not set');
    } finally {
      browser.stack = [];
    }

    if (result) {
      log.info('Radio button is not set');
      return true;
    }

    const err = new Error('Radio button is set');
    browser.handleError(err, 'validating if radio button is not set');
    throw err;
  }
}
