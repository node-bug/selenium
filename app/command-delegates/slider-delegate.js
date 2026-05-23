import { log } from '@nodebug/logger';
import messenger from '../messenger.js';
import { BaseDelegate } from './base-delegate.js';

/**
 * Slider delegate for handling input slider control operations
 *
 * This class encapsulates slider-related functionality including:
 * - Setting slider value via mouse drag (simulating real user interaction)
 *
 * @class SliderDelegate
 */
export class SliderDelegate extends BaseDelegate {
    constructor(browser) {
        super(browser);
        this.targetValue = null;
    }

    /**
     * Namespace for slide operations.
     * Usage: browser.slider('50').slide.to.value(75)
     */
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
     * Applies the target value to the slider using mouse drag simulation.
     *
     * This simulates real user interaction by:
     * 1. Getting the slider's min, max, and current value
     * 2. Calculating the relative position for the target value
     * 3. Using Selenium Actions API to click at the calculated position
     * 4. Dispatching proper input/change events for JS handlers
     *
     * @returns {Promise<boolean>} True if successful
     * @private
     */
    async _apply() {
        const browser = this.browser;

        if (this.targetValue === null) {
            log.error(`Target value to set was not provided. Please use slide.to.value() chain.`);
            throw new Error(`Target value to set was not provided. Please use slide.to.value() chain.`);
        }

        browser.message = messenger({ stack: browser.stack, action: 'slide', data: this.targetValue });

        try {
            const locator = await browser._finder();
            const targetVal = typeof this.targetValue === 'string' ? parseFloat(this.targetValue) : this.targetValue;

            // Validate that the target value is a valid number
            if (isNaN(targetVal)) {
                log.error(`Target value '${this.targetValue}' is not a valid number`);
                throw new Error(`Target value '${this.targetValue}' is not a valid number`);
            }

            // Get slider properties
            const [min, max, step] = await Promise.all([
                locator.getAttribute('min'),
                locator.getAttribute('max'),
                locator.getAttribute('step')
            ]);

            const minVal = parseFloat(min) || 0;
            const maxVal = parseFloat(max) || 100;
            const stepVal = step !== null ? parseFloat(step) : null; // null means no step constraint (default step is 1)

            // Validate that the target value is within the slider's range
            if (targetVal < minVal || targetVal > maxVal) {
                log.error(`Target value ${targetVal} is outside slider range [${minVal}, ${maxVal}]`);
                throw new Error(`Target value ${targetVal} is outside slider range [${minVal}, ${maxVal}]`);
            }

            // Validate that the target value aligns with the step (only if step is explicitly set)
            if (stepVal !== null && stepVal > 0) {
                const stepsFromMin = (targetVal - minVal) / stepVal;
                if (!Number.isInteger(stepsFromMin)) {
                    log.error(`Target value ${targetVal} is not aligned with slider step ${stepVal} (valid values: ${minVal}, ${minVal + stepVal}, ${minVal + 2 * stepVal}, ...)`);
                    throw new Error(`Target value ${targetVal} is not aligned with slider step ${stepVal}`);
                }
            }

            const clampedValue = targetVal;

            // Calculate the percentage position for the target value
            const percentage = (clampedValue - minVal) / (maxVal - minVal);

            // Get the slider's dimensions
            const rect = await browser.driver.executeScript(
                `const rect = arguments[0].getBoundingClientRect();
                 return { width: rect.width, height: rect.height };`,
                locator
            );

            // Calculate the x offset for the target position
            // For horizontal sliders, the thumb position is at the percentage of the width
            // We need to account for the thumb width to get more accurate positioning
            // The thumb is typically ~20px wide, so we adjust the position accordingly
            const thumbWidth = 20; // Approximate thumb width in pixels
            const adjustedPercentage = Math.max(0, Math.min(1, percentage));
            const offsetX = Math.round((rect.width - thumbWidth) * adjustedPercentage + thumbWidth / 2);
            const offsetY = Math.round(rect.height / 2);

            // First, set the value via JS for precise control
            // This ensures the slider has the correct value
            await browser.driver.executeScript(
                `const slider = arguments[0];
                 const newValue = ${clampedValue};
                 slider.value = newValue;
                 slider.dispatchEvent(new Event('input', { bubbles: true }));
                 slider.dispatchEvent(new Event('change', { bubbles: true }));`,
                locator
            );

            // Use Selenium Actions API to simulate mouse interaction on the slider
            // This simulates a user clicking on the slider track at the desired position
            const actions = browser.actions({ async: true });

            // Move to the calculated position and click
            await actions
                .move({ origin: locator, x: offsetX, y: offsetY })
                .click()
                .perform();

            log.info(`Set slider value to ${clampedValue} via user interaction simulation`);
        } catch (err) {
            browser.handleError(err, `setting slider to ${this.targetValue}`);
        } finally {
            this.targetValue = null;
            browser.stack = [];
        }
        return true;
    }
}
