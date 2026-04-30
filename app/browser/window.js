import { log } from '@nodebug/logger';
import { BrowserTarget } from './browser-target.js';

/**
 * Window class for browser window management
 * 
 * This class provides methods for managing browser windows including
 * switching, creating, closing, and resizing windows.
 * 
 * @class Window
 * @extends BrowserTarget
 */
class Window extends BrowserTarget {
    /**
     * Create a Window instance
     * 
     * @constructor
     * @param {Object} [driver] - Selenium WebDriver instance (optional)
     */
    constructor(driver) {
        super(driver, 'Window');
    }

    /**
     * Switch to a window
     * 
     * @param {string|number} [t] - Window title or index (optional)
     * @returns {Promise<boolean>} True if switch was successful
     * @example
     * await browser.window('Google').switch();
     */
    async switch(t) { return await this._findTarget(true, t); }

    /**
     * Open a new browser window
     * 
     * @returns {Promise<void>} Resolves when new window is opened
     * @example
     * await browser.window().new();
     */
    async new() {
        log.info(`Opening new browser window`);
        return this.driver.switchTo().newWindow('window');
    }

    /**
     * Close the current window
     * 
     * @returns {Promise<boolean>} True if successful
     * @example
     * await browser.window().close();
     */
    async close() { return super.close('Window'); }

    /**
     * Maximize the browser window
     * 
     * @returns {Promise<void>} Resolves when window is maximized
     * @example
     * await browser.window().maximize();
     */
    async maximize() {
        log.info(`Maximizing browser window`);
        return this.driver.manage().window().maximize();
    }

    /**
     * Minimize the browser window
     * 
     * @returns {Promise<void>} Resolves when window is minimized
     * @example
     * await browser.window().minimize();
     */
    async minimize() {
        log.info(`Minimizing browser`);
        return this.driver.manage().window().minimize();
    }

    /**
     * Switch to fullscreen mode
     * 
     * @returns {Promise<void>} Resolves when fullscreen mode is activated
     * @example
     * await browser.window().fullscreen();
     */
    async fullscreen() {
        log.info(`Switching to fullscreen`);
        return this.driver.manage().window().fullscreen();
    }
}

export default Window;