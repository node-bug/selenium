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
   * Internal helper to check if radio button is set.
   * 
   * @private
   * @returns {Promise<boolean>} True if radio button is set
   */
  async _isSet() {
    const browser = this.browser;
    let result = false;
    try {
      const locator = await browser._finder();
      result = await locator.isSelected();
    } catch (err) {
      browser.handleError(err, 'validating radio button state');
    } finally {
      browser.stack = [];
    }
    return result;
  }
}
