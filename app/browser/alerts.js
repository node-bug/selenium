import { log } from '@nodebug/logger'
import { until } from 'selenium-webdriver'

/**
 * Alert class for handling browser alerts and prompts
 * 
 * This class provides methods for working with browser alerts, including
 * checking if an alert is present, accepting, dismissing, and sending text to alerts.
 * 
 * @class Alert
 * @property {Object} driver - Selenium WebDriver instance
 * @property {string} _targetText - Expected text for the alert
 * @property {Object} alert - Current alert instance
 */
class Alert {
    /**
     * Create an Alert instance
     * 
     * @constructor
     * @param {Object} [driver] - Selenium WebDriver instance (optional)
     */
    constructor(driver) {
        if (driver) this.initialize(driver);
    }

    /**
     * Initialize the Alert with a WebDriver instance
     * 
     * @param {Object} driver - Selenium WebDriver instance
     * @private
     */
    initialize(driver) {
        this._driver = driver;
    }

    /**
     * Get the WebDriver instance
     * 
     * @returns {Object} Selenium WebDriver instance
     */
    get driver() {
        return this._driver;
    }

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
     */
    async isVisible() {
        try {
            await this._driver.wait(until.alertIsPresent(), 10000)
            const alert = await this._driver.switchTo().alert()
            const actualText = await alert.getText()

            if (this._targetText && actualText !== this._targetText) {
                log.info(`Alert found, but text '${actualText}' did not match expected text '${this._targetText}'`)
                return false
            }

            this.alert = alert
            log.info(`Alert with text '${actualText}' is present`)
            return true
        } catch {
            log.info('Alert not found or timed out')
            return false
        }
    }

    /**
     * Accept the current alert
     * 
     * @returns {Promise<void>} Resolves when the alert is accepted
     * @throws {Error} If no alert is present
     * @example
     * await browser.window().accept();
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
     * await browser.window().dismiss();
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
     * await browser.window().sendKeys('Hello World');
     */
    async sendKeys(text) {
        log.info(`Sending keys to alert: ${text}`);
        await this.isVisible();
        return this.alert.sendKeys(text);
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
             * const text = await browser.window.get.text();
             */
            text: async () => {
                await this.isVisible();
                return this.alert.getText();
            },
        };
    }
}

export default Alert
