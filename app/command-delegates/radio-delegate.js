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
}
