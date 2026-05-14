import { log } from '@nodebug/logger';
import messenger from '../messenger.js';

/**
 * Slider delegate for handling input slider control operations
 *
 * This class encapsulates slider-related functionality including:
 * - Setting slider value
 * - Getting current slider value
 *
 * @class SliderDelegate
 */
export class SliderDelegate {
    constructor(browser) {
        this.browser = browser;
        this.targetValue = null;
    }

    get slide() {
        return {
            to: {
                value: async (value) => {
                    this.targetValue = value;
                    return await this._apply();
                }
            }
        };
    }

    /**
     * Applies the target value to the slider.
     *
     * @returns {Promise<boolean>} True if successful
     * @private
     */
    async _apply() {
        const browser = this.browser;

        if (this.targetValue === null) {
            log.error(`Target value to set was not provided. Please use set() chain.`);
            throw new Error(`Target value to set was not provided. Please use set() chain.`);
        }

        browser.message = messenger({ stack: browser.stack, action: 'slide', data: this.targetValue });

        try {
            const locator = await browser._finder();

            // Get slider value and convert target to number
            await locator.getAttribute('value');
            const targetVal = typeof this.targetValue === 'string' ? parseFloat(this.targetValue) : this.targetValue;

            // Set slider value via JS since coordinate click doesn't work for range inputs
            await browser.driver.executeScript(
                `arguments[0].value = ${targetVal}; arguments[0].dispatchEvent(new Event('input', { bubbles: true })); arguments[0].dispatchEvent(new Event('change', { bubbles: true }));`,
                locator
            );

            log.info(`Set slider value to ${targetVal}`);
        } catch (err) {
            browser.handleError(err, `setting slider to ${this.targetValue}`);
        } finally {
            this.targetValue = null;
            browser.stack = [];
        }
        return true;
    }
}
