import { log } from '@nodebug/logger';
import { BrowserTarget } from './browser-target.js';

/**
 * Tab class for browser tab management
 * 
 * This class provides methods for managing browser tabs including
 * switching, creating, and closing tabs.
 * 
 * Inherited members from {@link BrowserTarget}:
 * - {@link BrowserTarget#is} - Validation operations (e.g., `is.present()`)
 * - {@link BrowserTarget#should} - BDD-style assertions (e.g., `should.be.present()`)
 * - {@link BrowserTarget#get} - Getters for title, URL, and console errors
 * - {@link BrowserTarget#identifier} - Set target title or index for switching
 * - {@link BrowserTarget#with} - Chain method for fluent interface
 * - {@link BrowserTarget#timeout} - Get the default timeout value
 * - {@link BrowserTarget#driver} - Get/set the WebDriver instance
 * 
 * @class Tab
 * @extends BrowserTarget
 */
class Tab extends BrowserTarget {
    /**
     * Create a Tab instance
     * 
     * @constructor
     * @param {Object} [driver] - Selenium WebDriver instance (optional)
     */
    constructor(driver) {
        super(driver, 'Tab');
    }

    /**
     * Switch to a tab
     * 
     * @param {string|number} [title] - Tab title or index (optional)
     * @returns {Promise<boolean>} True if switch was successful
     * @throws {Error} If the tab is not found
     * @example
     * await browser.tab('Google').switch();
     */
    async switch(title) { return await this._findTarget(true, title); }

    /**
     * Open a new browser tab
     * 
     * @returns {Promise<void>} Resolves when new tab is opened and switched to
     * @example
     * await browser.tab().new();
     */
    async new() {
        log.info(`Opening new tab in the browser window`);
        // switchTo().newWindow() already switches to the new tab
        await this.driver.switchTo().newWindow('tab');
    }

    /**
     * Close the current tab
     * 
     * @returns {Promise<boolean>} True if successful
     * @example
     * await browser.tab().close();
     */
    async close() { return super.close(); }
}

export default Tab;