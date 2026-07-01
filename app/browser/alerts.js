import { log } from '@nodebug/logger'
import { until } from 'selenium-webdriver'
import { selenium } from '../config.js';

/**
 * Alert class for handling browser alerts and prompts
 * 
 * This class provides methods for working with browser alerts, including
 * validating if an alert is present, accepting, dismissing, and sending text to alerts.
 * 
 * @class Alert
 * @property {Object} driver - Selenium WebDriver instance
 * @property {string} _targetText - Expected text for the alert
 * @property {Object} alert - Current alert instance
 */
class Alert {
    constructor(driver) { if (driver) this.initialize(driver); }
    initialize(driver) { this._driver = driver; }
    get driver() { return this._driver; }
    set driver(value) { this.initialize(value); }
    get timeout() { return selenium.timeout; }

    /**
     * Chain method for fluent interface
     * 
     * @returns {this} Returns the Alert instance for chaining
     */
    with() { return this; }

    /**
     * Set the expected text for the alert
     * 
     * @param {string} value - Expected text in the alert
     * @returns {this} Returns the Alert instance for chaining
     */
    text(value) {
        this._targetText = value;
        return this;
    }

    /**
     * Check if an alert is visible and matches expected text
     * 
     * @returns {Promise<boolean>} True if alert is visible and text matches
     * @example
     * await browser.alert().is.visible();
     * await browser.alert('Expected Text').is.visible();
     */
    async isVisible() {
        try {
            await this.driver.wait(until.alertIsPresent(), this.timeout)
            await this.driver.sleep(1000) // Small delay to ensure alert is fully loaded
            const alert = await this.driver.switchTo().alert()
            const actualText = await alert.getText()

            if (this._targetText && !actualText.includes(this._targetText)) {
                log.info(`Alert found, but text '${actualText}' did not match expected text '${this._targetText}'`)
                return false
            }

            this.alert = alert
            log.info(`Alert with text '${actualText}' is present`)
            return true
        } catch (err) {
            log.info(`Alert not found or timed out. Error: ${err.message}`)
            return false
        }
    }

    /**
     * Accept the current alert
     * 
     * @returns {Promise<void>} Resolves when the alert is accepted
     * @throws {Error} If no alert is present
     * @example
     * await browser.alert().accept();
     */
    async accept() {
        log.info('Accepting Alert');
        if (await this.isVisible()) {
            return this.alert.accept();
        }
        throw new Error('No alert present to accept');
    }

    /**
     * Dismiss the current alert
     * 
     * @returns {Promise<void>} Resolves when the alert is dismissed
     * @throws {Error} If no alert is present
     * @example
     * await browser.alert().dismiss();
     */
    async dismiss() {
        log.info('Dismissing Alert');
        if (await this.isVisible()) {
            return this.alert.dismiss();
        }
        throw new Error('No alert present to dismiss');
    }

    /**
     * Send text to the alert
     * 
     * @param {string} text - Text to send to the alert
     * @returns {Promise<void>} Resolves when text is sent
     * @example
     * await browser.alert().write('Hello World');
     * chrome has a bug where the text type into alert is not visible on screen, but it actually works
     * (just a display issues that chrome developers wont fix)
     */
    async write(text) {
        log.info(`Sending keys to alert: ${text}`);
        await this.isVisible();
        await this.alert.sendKeys(text);
    }

    /**
     * Getters for alert properties
     * 
     * @returns {Object} Object with getter methods
     */
    get get() {
        return {
            /**
             * Get the text of the alert
             * 
             * @returns {Promise<string>} Text content of the alert
             * @example
             * const text = await browser.alert().get.text();
             */
            text: async () => {
                await this.isVisible();
                return this.alert.getText();
            },
        };
    }

    /**
     * "Namespace" or "Sub-resource" pattern for organized access to validation operations.
     * Accessor for alert validation operations.
     * Usage: await browser.alert().is.visible()
     */
    get is() {
        return {
            /**
             * Check if an alert is visible and matches expected text
             * 
             * @returns {Promise<boolean>} True if alert is visible and text matches
             * @example
             * await browser.alert().is.visible();
             * await browser.alert('Expected Text').is.visible();
             */
            visible: async () => {
                return await this.isVisible();
            },
            /**
             * Check if an alert is NOT visible or does not match expected text
             * 
             * @returns {Promise<boolean>} True if alert is not visible or text does not match
             * @example
             * await browser.alert().is.not.visible();
             * await browser.alert('Expected Text').is.not.visible();
             */
            not: {
                visible: async () => {
                    return !(await this.isVisible());
                }
            }
        };
    }
    /**
     * "Namespace" or "Sub-resource" pattern for organized access to assertion operations.
     * Accessor for alert assertions.
     * Usage: await browser.alert().should.be.visible()
     */
    get should() {
        return {
            be: {
                /**
                 * Assert that an alert is visible and matches expected text
                 * 
                 * @throws {Error} If alert is not visible or text does not match
                 * @example
                 * await browser.alert().should.be.visible();
                 * await browser.alert('Expected Text').should.be.visible();
                 */
                visible: async () => {
                    const visible = await this.isVisible();
                    if (!visible) {
                        throw new Error('Expected alert to be visible, but it was not');
                    }
                }
            },
            not: {
                be: {
                    /**
                     * Assert that an alert is NOT visible or does not match expected text
                     * 
                     * @throws {Error} If alert is visible and text matches
                     * @example
                     * await browser.alert().should.not.be.visible();
                     * await browser.alert('Expected Text').should.not.be.visible();
                     */
                    visible: async () => {
                        const visible = await this.isVisible();
                        if (visible) {
                            throw new Error('Expected alert to not be visible, but it was');
                        }
                    }
                }
            }
        };
    }
}


export default Alert
