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

  /**
   * Get the is accessor object for radio button state checks.
   *
   * Provides state check methods for radio button elements.
   *
   * @type {Object}
   * @returns {Object} Object containing is accessor methods
   * @example
   * await browser.radio('option1').is.set();
   * await browser.radio('option1').is.not.set();
   */
  get is() {
    const browser = this.browser;
    return {
      /**
       * Checks whether the radio button is set.
       *
       * @returns {Promise<boolean>}
       */
      set: async () => {
        browser.message = messenger({ stack: browser.stack, action: 'isSet' });
        const result = await this._isSet();
        if (result) log.info(`Radiobutton is set`);
        else log.warn(`Radiobutton is not set`);
        return result;
      },

      not: {
        /**
         * Checks whether the radio button is not set.
         *
         * @returns {Promise<boolean>}
         */
        set: async () => {
          browser.message = messenger({ stack: browser.stack, action: 'isNotSet' });
          const result = await this._isSet();
          if (result) log.warn(`Radiobutton is set`);
          else log.info(`Radiobutton is not set`);
          return !result;
        },
      },
    };
  }
}
