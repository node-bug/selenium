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
import { downloadPath } from './preferences.js'
import { selenium as seleniumConfig } from '../config.js'

/**
 * Get Firefox browser capabilities
 * 
 * Configures Firefox with download and security preferences:
 * - Sets headless mode if `selenium.headless` is enabled in config
 * - Sets private browsing mode if `selenium.incognito` is enabled in config
 * - Applies Firefox-specific preferences (downloads, security, UI)
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
     * @property {Object} prefs - Firefox preferences (downloads, security, UI).
     */
    const options = {
      args: [],
      prefs: {
        // Downloads
        'browser.download.dir': downloadPath,
        'browser.download.folderList': 2,
        'browser.download.manager.showWhenStarting': false,
        'browser.helperApps.neverAsk.saveToDisk': 'application/octet-stream,application/pdf,application/zip,text/csv',

        // PDF
        'pdfjs.disabled': true,

        // Signons
        'signon.rememberSignons': false,

        // Session
        'browser.sessionstore.resume_from_crash': false,

        // Spell checking
        'browser.enable_spellchecking': false,
        'browser.enable_autospellcorrect': false,
      },
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
