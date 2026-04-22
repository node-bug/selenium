import { log } from '@nodebug/logger';
import messenger from '../messenger.js';

/**
 * Checkbox delegate for handling checkbox operations
 * 
 * This class encapsulates all checkbox-related functionality that was previously
 * part of the WebBrowser class, including check, uncheck, and state checking operations.
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
   * Checks if a checkbox is currently checked.
   * 
   * @returns {Promise<boolean>} True if checkbox is checked
   * @example
   * const isChecked = await browser.checkbox('agree').isChecked();
   * if (isChecked) {
   *   await browser.checkbox('agree').uncheck();
   * }
   */
  async isChecked() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'isChecked' });
    try {
      const locator = await browser._finder();
      const isChecked = await locator.isSelected();
      log.info(`Checkbox is ${isChecked ? 'checked' : 'unchecked'}`);
      return isChecked;
    } catch (err) {
      browser.handleError(err, 'checking if checkbox is checked');
    } finally {
      browser.stack = [];
    }
  }

  /**
   * Checks if a checkbox is currently unchecked.
   * 
   * @returns {Promise<boolean>} True if checkbox is unchecked
   * @example
   * const isUnchecked = await browser.checkbox('agree').isUnchecked();
   * if (isUnchecked) {
   *   await browser.checkbox('agree').check();
   * }
   */
  async isUnchecked() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'isUnchecked' });
    try {
      const locator = await browser._finder();
      const isUnchecked = !(await locator.isSelected());
      log.info(`Checkbox is ${isUnchecked ? 'unchecked' : 'checked'}`);
      return isUnchecked;
    } catch (err) {
      browser.handleError(err, 'checking if checkbox is unchecked');
    } finally {
      browser.stack = [];
    }
  }
}