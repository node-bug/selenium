/**
 * Chrome capabilities configuration class
 * 
 * This class provides Chrome-specific browser capabilities for Selenium WebDriver.
 * It configures Chrome options including headless mode, incognito mode, and various
 * performance and security settings.
 * 
 * @class Chrome
 */
import { Capabilities } from 'selenium-webdriver'
import config from '@nodebug/config'
import prefs from './preferences.js' // Note: ESM requires the .js extension

const selenium = config('selenium')

/**
 * Get Chrome browser capabilities
 * 
 * Configures Chrome with performance and security optimizations:
 * - Disables extensions, GPU, notifications, and the automation indicator
 * - Sets headless mode if `selenium.headless` is enabled in config
 * - Sets incognito mode if `selenium.incognito` is enabled in config
 * - Applies shared browser preferences from preferences.js
 * 
 * @returns {Object} Chrome browser capabilities configuration
 * @example
 * const chromeCaps = new Chrome().capabilities;
 * console.log(chromeCaps);
 */
class Chrome {
  get capabilities() {
    /**
     * Chrome-specific WebDriver options.
     * @type {Object}
     * @property {string[]} args - Command-line flags for Chrome.
     * Disables extensions, GPU, notifications, sandbox restrictions,
     * automation detection, and first-run UI.
     * @property {Object} prefs - Shared browser preferences (downloads, security, UI).
     * @property {string[]} excludeSwitches - Chrome switches to exclude;
     * removes the default 'enable-automation' flag to avoid detection.
     */
    const options = {
      args: [
        '--force-device-scale-factor=1',
        '--disable-extensions',
        '--disable-gpu',
        '--disable-notifications',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled',
        '--no-first-run',
      ],
      prefs,
      excludeSwitches: ['enable-automation'],
    }

    // Enable headless mode if configured (supports both string 'true' and boolean true)
    if (selenium.headless === 'true' || selenium.headless === true) {
      options.args.push('--headless=new')
    }
    // Enable incognito (private browsing) mode if configured
    if (selenium.incognito === 'true' || selenium.incognito === true) {
      options.args.push('--incognito')
    }

    this._capabilities = Capabilities.chrome()
    // Apply Chrome-specific options via the goog:chromeOptions capability key
    this._capabilities.set('goog:chromeOptions', options)
    // Wait for the full page to load before returning control
    this._capabilities.set('pageLoadStrategy', 'normal')
    return this._capabilities
     
  }
}

export default Chrome
