import { log } from '@nodebug/logger';
import { BrowserTarget } from './browser-target.js';

/**
 * Tab class for browser tab management
 * 
 * This class provides methods for managing browser tabs including
 * switching, creating, and closing tabs.
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
     * @param {string|number} [t] - Tab title or index (optional)
     * @returns {Promise<boolean>} True if switch was successful
     * @example
     * await browser.tab('Google').switch();
     */
    async switch(t) { return await this._findTarget(true, t); }

    /**
     * Open a new browser tab
     * 
     * @returns {Promise<void>} Resolves when new tab is opened
     * @example
     * await browser.tab().new();
     */
    async new() {
        log.info(`Opening new tab in the browser window`);
        return await this.driver.switchTo().newWindow('tab');
    }

    /**
     * Close the current tab
     * 
     * @returns {Promise<boolean>} True if successful
     * @example
     * await browser.tab().close();
     */
    async close() { return super.close('Tab'); }
}

export default Tab;