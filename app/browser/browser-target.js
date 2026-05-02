import { log } from '@nodebug/logger';
import config from '@nodebug/config';

const selenium = config('selenium');

/**
 * Base class for browser targets (Window and Tab)
 * 
 * This is an abstract base class that provides common functionality
 * for managing browser windows and tabs.
 * 
 * @class BrowserTarget
 * @property {Object} driver - Selenium WebDriver instance
 * @property {string} _label - Label for the target type (Window/Tab)
 * @property {string} _targetTitle - Target title for switching
 */
export class BrowserTarget {
    /**
     * Create a BrowserTarget instance
     * 
     * @constructor
     * @param {Object} [driver] - Selenium WebDriver instance (optional)
     * @param {string} [label='Target'] - Label for the target type
     */
    constructor(driver, label = 'Target') {
        this._label = label;
        this._isIndex = false;
        if (driver) this.initialize(driver);
    }

    /**
     * Initialize the BrowserTarget with a WebDriver instance
     * 
     * @param {Object} driver - Selenium WebDriver instance
     * @private
     */
    initialize(driver) {
        this._driver = driver;
    }

    /**
     * Set the WebDriver instance
     * 
     * @param {Object} value - Selenium WebDriver instance
     */
    set driver(value) { this.initialize(value); }

    /**
     * Get the WebDriver instance
     * 
     * @returns {Object} Selenium WebDriver instance
     */
    get driver() { return this._driver; }

    /**
     * Get the default timeout value
     * 
     * @returns {number} Timeout value in milliseconds
     */
    get timeout() { return (selenium.timeout || 10) * 1000; }

    /**
     * Chain method for fluent interface
     * 
     * @returns {this} Returns the BrowserTarget instance for chaining
     */
    with() { return this; }

    /**
     * Set the target title for switching operations
     * 
     * @param {string|number} value - Target title or index
     * @returns {this} Returns the BrowserTarget instance for chaining
     */
    identifier(value) {
        this._targetTitle = value;
        if (typeof this._targetTitle === 'number') this._isIndex = true
        return this;
    }

    /**
     * Find and optionally switch to a target (window or tab)
     * 
     * @private
     * @param {boolean} shouldSwitch - Whether to switch to the target
     * @returns {Promise<boolean>} True if target was found
     */
    async _findTarget(shouldSwitch) {
        const timeout = this.timeout;
        if ([null, undefined].includes(this._targetTitle)) {
            log.debug(`No ${this._label} target index or name specified. Using current ${this._label}.`)
            return true
        }

        // 1. FAST PATH FOR INDEX-BASED SWITCHING
        try {
            if (this._isIndex) {
                const handles = await this.driver.getAllWindowHandles();
                if (this._targetTitle >= handles.length || this._targetTitle < 0) {
                    log.info(`${this._label} with index ${this._targetTitle} was not found on screen after '${timeout} ms' timeout`);
                    if (shouldSwitch) {
                        throw new Error(`Failed to switch to ${this._label} with index ${this._targetTitle}`);
                    }
                    return false;
                } else {
                    log.info(`${this._label} with index '${this._targetTitle}' is displayed`);
                    if (shouldSwitch) {
                        await this.driver.switchTo().window(handles[this._targetTitle]);
                        log.info(`Successfully switched to ${this._label} with index ${this._targetTitle}`);
                    }
                    return true
                }
            }


            // 2. NAME-BASED SEARCH LOOP
            let og;
            try {
                og = await this.driver.getWindowHandle();
            } catch (err) {
                if (err.name === 'NoSuchWindowError') {
                    log.error(`The active ${this._label} was closed. Is that expected?`);
                } else {
                    log.error(`Error while switching ${this._label}. ${err}`);
                    throw err;
                }
            }

            const startTime = Date.now();

            while (Date.now() - startTime < timeout) {
                try {
                    const handles = await this.driver.getAllWindowHandles();
                    for (const handle of handles) {
                        await this.driver.switchTo().window(handle);
                        // Call driver directly to avoid recursive _findTarget calls
                        // (this.get.title() would call _findTarget again, causing infinite recursion)
                        const currentTitle = await this._driver.getTitle();

                        if (currentTitle.includes(this._targetTitle)) {
                            if (shouldSwitch) {
                                log.debug(`Successfully switched to ${this._label} with title '${currentTitle}'`);
                            } else {
                                if (og) await this.driver.switchTo().window(og);
                                log.debug(`Found ${this._label} with title '${currentTitle}'`);
                            }
                            return true;
                        }
                    }
                } catch (err) {
                    log.error(`Error while validating ${this._label} is displayed : ${err.message}`);
                    throw err;
                }
                await new Promise(r => setTimeout(r, 200));
            }

            if (shouldSwitch) {
                log.error(`${this._label} was not found on screen after '${timeout} ms' timeout`);
                throw new Error(`${this._label} was not found on screen after '${timeout} ms' timeout`);
            } else {
                log.info(`${this._label} was not found on screen after '${timeout} ms' timeout`);
                if (og) await this.driver.switchTo().window(og);
                return false;
            }
        } finally {
            this._targetTitle = undefined; // Ensure state is never persistent
        }
    }

    /**
     * Close the current target (window or tab)
     * 
     * @returns {Promise<boolean>} True if successful
     * @example
     * await browser.window().close();
     */
    async close() {
        log.info(`Closing ${this._label} with title '${await this.driver.getTitle()}'`);
        await this.driver.close();
        const handles = await this.driver.getAllWindowHandles();
        if (handles.length <= 0) {
            log.error(`No browser windows are currenlty open. Is this expected?`);
        } else {
            await this.driver.switchTo().window(handles[0]);
        }
        log.info(`Currently active ${this._label} is '${await this.driver.getTitle()}'`);
        return true;
    }

    /**
     * "Namespace" or "Sub-resource" pattern for organized access to validation operations.
     * Accessor for target validation operations.
     * Usage: await browser.window('Google').is.displayed()
     */
    get is() {
        return {
            /**
             * Check if a target is present
             *
             * @returns {Promise<boolean>} True if target is present, false otherwise
             * @example
             * const isPresent = await browser.tab('Google').is.present();
             */
            present: async () => {
                log.info(`Validating if ${this._label} with ${this._isIndex ? 'index' : 'title'} '${this._targetTitle}' is present`);
                const result = await this._findTarget(false);
                if (result) log.info(`${this._label} is present`);
                else log.warn(`${this._label} is not present`);
                return result;
            },

            /**
             * Negation namespace for presence checks
             * @example
             * const isNotPresent = await browser.tab('Google').is.not.present();
             */
            not: {
                /**
                 * Check if a target is NOT present
                 *
                 * @returns {Promise<boolean>} True if target is NOT present, false otherwise
                 * @example
                 * const isNotPresent = await browser.tab('Google').is.not.present();
                 */
                present: async () => {
                    log.info(`Validating if ${this._label} with ${this._isIndex ? 'index' : 'title'} '${this._targetTitle}' is not present`);
                    const result = !(await this._findTarget(false));
                    if (result) log.info(`${this._label} is not present`);
                    else log.warn(`${this._label} is present`);
                    return result;
                }
            }
        };
    }

    /**
     * "Should" style assertions for target validation (BDD-style).
     * Accessor for target validation operations using "should" syntax.
     * Usage: await browser.window('Google').should.be.present()
     */
    get should() {
        return {
            /**
             * "be" namespace for should-style assertions
             * @example
             * await browser.tab('Google').should.be.present();
             */
            be: {
                /**
                 * Assert that a target should be present. Throws if not found.
                 *
                 * @returns {Promise<boolean>} True if target is present
                 * @throws {Error} If target is not present
                 * @example
                 * await browser.tab('Google').should.be.present();
                 */
                present: async () => {
                    const identifier = this._targetTitle;
                    const isIndex = this._isIndex;
                    log.info(`Validating that ${this._label} with ${isIndex ? 'index' : 'title'} '${identifier}' should be present`);
                    const result = await this._findTarget(false);
                    if (result) {
                        log.info(`${this._label} is present`);
                        return true;
                    } else {
                        throw new Error(`${this._label} with ${isIndex ? 'index' : 'title'} '${identifier}' is not present`);
                    }
                },
            },

            /**
             * Negation namespace for should-style presence checks
             * @example
             * await browser.tab('Google').should.not.be.present();
             */
            not: {
                be: {
                    /**
                     * Assert that a target should NOT be present. Throws if found.
                     *
                     * @returns {Promise<boolean>} True if target is NOT present
                     * @throws {Error} If target is present
                     * @example
                     * await browser.tab('Google').should.not.be.present();
                     */
                    present: async () => {
                        const identifier = this._targetTitle;
                        const isIndex = this._isIndex;
                        log.info(`Validating that ${this._label} with ${isIndex ? 'index' : 'title'} '${identifier}' should not be present`);
                        const result = await this._findTarget(false);
                        if (result) {
                            throw new Error(`${this._label} with ${isIndex ? 'index' : 'title'} '${identifier}' is present but should not be`);
                        } else {
                            log.info(`${this._label} is not present`);
                            return true;
                        }
                    }
                }
            }
        }
    };


    /**
     * Switch to a target
     *
     * @returns {Promise<boolean>} True if switch was successful
     * @example
     * await browser.window('Google').switch();
     */
    async switch() {
        const found = await this._findTarget(true);
        if (!found) throw new Error(`Target "${this._targetTitle}" not found`);
        return true;
    }

    /**
     * Getters for target properties
     * 
     * @returns {Object} Object with getter methods for title and URL
     */
    get get() {
        return {
            /**
             * Get the title of the current target
             * 
             * @returns {Promise<string>} Title of the current target
             * @example
             * const title = await browser.window().get.title();
             */
            title: async () => {
                try {
                    await this._findTarget(true); // 'this' correctly points to the Window/Tab
                    const title = await this._driver.getTitle();
                    log.info(`Getting the ${this._label.toLowerCase()} title. Title is '${title}'`)
                    return title
                } catch (err) {
                    log.error(`Error while getting the ${this._label.toLowerCase()} title : ${err.message}`);
                    throw err;
                }
            },
            /**
             * Get the URL of the current target
             * 
             * @returns {Promise<string>} URL of the current target
             * @example
             * const url = await browser.window().get.url();
             */
            url: async () => {
                try {
                    await this._findTarget(true); // Ensuring focus before fetching URL
                    const url = await this._driver.getCurrentUrl();
                    log.info(`Getting the ${this._label.toLowerCase()} url. Url is '${url}'`)
                    return url
                } catch (err) {
                    log.error(`Error while getting the current URL. ${err.message}`);
                    throw err;
                }
            },
            /**
             * Get console errors from the current target (window or tab)
             * @returns {Promise<Array>} Array of console error entries
             * @example
             * const errors = await browser.window().get.consoleErrors();
             */
            consoleErrors: async () => {
                try {
                    const title = await this.driver.getTitle()
                    log.info(`Getting console errors on ${this._label.toLowerCase()} '${title}'`)

                    const entries = []
                    const logs = []

                    const promises = ['browser'].map(async (type) => {
                        entries.push(...(await this.driver.manage().logs().get(type)))
                    })

                    await Promise.all(promises)
                    logs.push(...entries.filter((entry) => entry.level.name === 'SEVERE'))
                    log.info(`Found ${logs.length} console error(s) on ${this._label.toLowerCase()} '${title}'`)
                    return logs
                } catch (err) {
                    log.error(`Error getting console errors: ${err.message}`)
                    throw err
                }
            }
        };
    }
}