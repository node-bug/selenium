import { log } from '@nodebug/logger';
import messenger from '../messenger.js';

/**
 * Slider delegate for handling slider operations
 * 
 * This class encapsulates all slider-related functionality,
 * including setting slider values and state validation operations.
 * 
 * @class SliderDelegate
 */
export class SliderDelegate {
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Sets a slider to a specific value.
   * 
   * Sets the slider value by modifying the element's value property
   * and triggering appropriate events.
   * 
   * @param {number|string} value - The value to set the slider to
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.slider('volume').set(50);
   */
  async set(value) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'set', data: String(value) });

    try {
      const locator = await browser._finder(null, 'slider');
      const currentValue = await locator.getAttribute('value');

      // Only set if the value is different
      if (currentValue !== String(value)) {
        try {
          // Set the slider value using JavaScript
          await browser.driver.executeScript(
            'arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event(\'input\')); arguments[0].dispatchEvent(new Event(\'change\'));',
            locator,
            value
          );
        } catch {
          // Fallback: Try setting value directly and dispatching events
          await browser.driver.executeScript('arguments[0].value = arguments[1];', locator, value);
          await browser.driver.executeScript(
            'arguments[0].dispatchEvent(new Event(\'input\')); arguments[0].dispatchEvent(new Event(\'change\'));',
            locator
          );
        }

        // Final verification
        const finalValue = await locator.getAttribute('value');
        if (finalValue !== String(value)) {
          throw new Error(`Failed to set slider value. Expected ${value}, got ${finalValue}.`);
        }
      } else {
        log.info(`Slider is already set to value ${value}. Skipping.`);
      }
    } catch (err) {
      browser.handleError(err, `setting slider to ${value}`);
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Internal helper to get the current slider value.
   * 
   * @private
   * @returns {Promise<string>} Current slider value
   */
  async _getValue() {
    const browser = this.browser;
    let value = '';
    try {
      const locator = await browser._finder();
      value = await locator.getAttribute('value');
    } catch (err) {
      browser.handleError(err, 'getting slider value');
    } finally {
      browser.stack = [];
    }
    return value;
  }
}