/**
 * Firefox capabilities configuration class
 * 
 * This class provides Firefox-specific browser capabilities for Selenium WebDriver.
 * It configures Firefox options including headless mode, incognito mode, and various
 * preferences for download handling and security.
 * 
 * @class Firefox
 */
import { Capabilities } from 'selenium-webdriver'
import config from '@nodebug/config'
import prefs from './preferences.js'

const seleniumConfig = config('selenium')

/**
 * Get Firefox browser capabilities
 * 
 * Configures Firefox with download and security preferences:
 * - Sets headless mode if `selenium.headless` is enabled in config
 * - Sets private browsing mode if `selenium.incognito` is enabled in config
 * - Applies shared browser preferences from preferences.js
 * - Accepts insecure certificates for testing flexibility
 * 
 * @returns {Object} Firefox browser capabilities configuration
 * @example
 * const firefoxCaps = new Firefox().capabilities;
 * console.log(firefoxCaps);
 */
class Firefox {
  get capabilities() {
    /**
     * Firefox-specific WebDriver options.
     * @type {Object}
     * @property {string[]} args - Command-line flags for Firefox.
     * Starts empty and conditionally adds `-headless` or `-private`.
     * @property {Object} prefs - Shared browser preferences (downloads, security, UI).
     */
    const options = {
      args: [],
      prefs,
    }

    // Enable headless mode if configured (supports both string 'true' and boolean true)
    if (seleniumConfig.headless === 'true' || seleniumConfig.headless === true) {
      options.args.push('-headless')
    }
    // Enable private browsing mode if configured
    if (seleniumConfig.incognito === 'true' || seleniumConfig.incognito === true) {
      options.args.push('-private')
    }

    this._capabilities = Capabilities.firefox()
    // Apply Firefox-specific options via the moz:firefoxOptions capability key
    this._capabilities.set('moz:firefoxOptions', options)
    // Accept insecure certificates to allow testing against self-signed certs
    this._capabilities.setAcceptInsecureCerts(true)
    // Wait for the full page to load before returning control
    this._capabilities.set('pageLoadStrategy', 'normal')
    return this._capabilities
     
  }
}

export default Firefox
