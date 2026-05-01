import { log } from '@nodebug/logger';
import messenger from '../messenger.js';

/**
 * Checkbox delegate for handling checkbox operations
 * 
 * This class encapsulates all checkbox-related functionality that was previously
 * part of the WebBrowser class, including check, uncheck, and state validation operations.
 * 
 * @class CheckboxDelegate
 */
export class CheckboxDelegate {
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Internal helper to set checkbox state
   * 
   * @private
   * @param {string} targetState - 'check' or 'uncheck'
   * @returns {Promise<boolean>} True if successful
   */
  async #toggleCheckbox(targetState) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: targetState });

    try {
      const locator = await browser._finder(null, targetState);
      const isChecked = await locator.isSelected();
      const needsChange = (targetState === 'check' && !isChecked) ||
        (targetState === 'uncheck' && isChecked);

      if (needsChange) {
        try {
          await locator.click();
        } catch {
          // Fallback: Many modern checkboxes are 0x0 pixels and covered by a <label>.
          // If Selenium can't "click" it, we force the change via JS.
          log.debug('Standard click failed, attempting JS click for checkbox');
          await browser.driver.executeScript('arguments[0].click();', locator);
        }

        // Final verification
        const finalState = await locator.isSelected();
        if (finalState === isChecked) {
          throw new Error(`Failed to ${targetState} checkbox. State did not change.`);
        }
      } else {
        log.info(`Checkbox is already ${targetState}ed. Skipping.`);
      }
    } catch (err) {
      browser.handleError(err, `${targetState}ing checkbox`);
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Checks a checkbox element.
   * 
   * Clicks the checkbox if it's not already checked. Falls back to JavaScript
   * click if Selenium click fails.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.checkbox('agree').check();
   */
  async check() {
    return await this.#toggleCheckbox('check');
  }

  /**
   * Unchecks a checkbox element.
   * 
   * Clicks the checkbox if it's not already unchecked. Falls back to JavaScript
   * click if Selenium click fails.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.checkbox('agree').uncheck();
   */
  async uncheck() {
    return await this.#toggleCheckbox('uncheck');
  }

  /**
   * Internal helper to check if checkbox is checked.
   * 
   * @private
   * @returns {Promise<boolean>} True if checkbox is checked
   */
  async _isChecked() {
    const browser = this.browser;
    let result = false;
    try {
      const locator = await browser._finder();
      result = await locator.isSelected();
    } catch (err) {
      browser.handleError(err, 'validating checkbox state');
    } finally {
      browser.stack = [];
    }
    return result;
  }
}