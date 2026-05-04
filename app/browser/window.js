import { log } from '@nodebug/logger';
import { BrowserTarget } from './browser-target.js';

/**
 * Window class for browser window management
 * 
 * This class provides methods for managing browser windows including
 * switching, creating, closing, and resizing windows.
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
     * @param {string|number} [title] - Window title or index (optional)
     * @returns {Promise<boolean>} True if switch was successful
     * @throws {Error} If the window is not found
     * @example
     * await browser.window('Google').switch();
     */
    async switch(title) { return await this._findTarget(true, title); }

    /**
     * Open a new browser window
     * 
     * @returns {Promise<void>} Resolves when new window is opened and switched to
     * @example
     * await browser.window().new();
     */
    async new() {
        log.info(`Opening new browser window`);
        // switchTo().newWindow() already switches to the new window
        await this.driver.switchTo().newWindow('window');
    }

    /**
     * Close the current window
     * 
     * @returns {Promise<boolean>} True if successful
     * @example
     * await browser.window().close();
     */
    async close() { return super.close(); }

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