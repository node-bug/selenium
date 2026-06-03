import { BaseDelegate } from './base-delegate.js';

/**
 * Radio delegate for handling radio button operations
 * 
 * This class encapsulates all radio button-related functionality,
 * including selection and state validation operations.
 * Supports both native radio inputs and ARIA radio buttons.
 * 
 * @class RadioDelegate
 */
export class RadioDelegate extends BaseDelegate {
  /**
   * Internal helper to check if radio button is set.
   * 
   * Handles both native radio inputs and ARIA radio buttons (role="radio").
   * 
   * @private
   * @returns {Promise<boolean>} True if radio button is set
   */
  async _isSet() {
    const browser = this.browser;
    let result = false;
    try {
      const locator = await browser._finder();
      result = await this._checkRadioState(locator);
    } catch (err) {
      browser.handleError(err, 'validating radio button state');
    } finally {
      browser.stack = [];
    }
    return result;
  }

  /**
   * Internal helper to check radio button state given a locator.
   * 
   * @private
   * @param {Object} locator - The WebElement to check
   * @returns {Promise<boolean>} True if radio button is set
   */
  async _checkRadioState(locator) {
    if (!locator) {
      throw new Error('Could not resolve radio element');
    }

    // Handle role='radio' - check aria-checked attribute
    const role = await locator.getAttribute('role');
    if (role === 'radio') {
      const ariaChecked = await locator.getAttribute('aria-checked');
      return ariaChecked === 'true';
    }

    // Default: use isSelected() for native radio inputs
    return await locator.isSelected();
  }
}
