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
   * Asserts that a checkbox is currently checked.
   * 
   * Returns true if the checkbox is checked, otherwise throws an error.
   * Use this as an assertion to verify checkbox state.
   * 
   * @returns {Promise<boolean>} Returns true if checkbox is checked
   * @throws {Error} Throws 'Checkbox is not checked' if checkbox is unchecked
   * @example
   * // Assert checkbox is checked (throws if not)
   * await browser.checkbox('agree').isChecked();
   */
  async isChecked() {
    const browser = this.browser; let result = false
    browser.message = messenger({ stack: browser.stack, action: 'isChecked' });
    try {
      const locator = await browser._finder();
      result = await locator.isSelected();
    } catch (err) {
      browser.handleError(err, 'checking if checkbox is checked');
    } finally {
      browser.stack = [];
    }
    if(result) {log.info(`Checkbox is checked`); return true;}
    throw new Error('Checkbox is not checked'); 
  }

  /**
   * Asserts that a checkbox is currently unchecked.
   * 
   * Returns true if the checkbox is unchecked, otherwise throws an error.
   * Use this as an assertion to verify checkbox state.
   * 
   * @returns {Promise<boolean>} Returns true if checkbox is unchecked
   * @throws {Error} Throws 'Checkbox is checked' if checkbox is checked
   * @example
   * // Assert checkbox is unchecked (throws if not)
   * await browser.checkbox('agree').isUnchecked();
   * console.log('Checkbox is confirmed unchecked');
   */
  async isUnchecked() {
    const browser = this.browser; let result = false
    browser.message = messenger({ stack: browser.stack, action: 'isUnchecked' });
    try {
      const locator = await browser._finder();
      result = !(await locator.isSelected());
    } catch (err) {
      browser.handleError(err, 'checking if checkbox is unchecked');
    } finally {
      browser.stack = [];
    }
    if(result) {log.info(`Checkbox is not checked`); return true;}
    throw new Error('Checkbox is checked'); 
  }
}