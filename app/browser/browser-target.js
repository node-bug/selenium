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
        return this;
    }

    /**
     * Find and optionally switch to a target (window or tab)
     * 
     * @private
     * @param {boolean} shouldSwitch - Whether to switch to the target
     * @param {number} [customTimeout] - Custom timeout value
     * @returns {Promise<boolean>} True if target was found
     */
    async _findTarget(shouldSwitch, customTimeout = undefined) {
        const timeout = customTimeout ?? this.timeout;
        if([null, undefined].includes(this._targetTitle))
        {
            log.debug(`No ${this._label} target index or name specified. Using current ${this._label}.`)
            return true
        }

        // 1. FAST PATH FOR INDEX-BASED SWITCHING
        try {
            if (typeof this._targetTitle === 'number') {
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

            log.debug(`Checking ${this._label} with title '${this._targetTitle}' is displayed`);
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
                    log.error(`Error while checking ${this._label} is displayed : ${err.message}`);
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
     * Check if a target is displayed
     * 
     * @param {string|number} [t] - Target title or index (optional)
     * @returns {Promise<boolean>} True if target is displayed
     * @example
     * const isDisplayed = await browser.window('Google').isDisplayed();
     */
    async isDisplayed(t) { return await this._findTarget(false, t); }
    
    /**
     * Switch to a target
     * 
     * @param {string|number} [t] - Target title or index (optional)
     * @returns {Promise<boolean>} True if switch was successful
     * @example
     * await browser.window('Google').switch();
     */
    async switch(t) {
        const found = await this._findTarget(true, t);
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