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
 * @returns {Object} Firefox browser capabilities configuration
 * @example
 * const firefoxCaps = new Firefox().capabilities;
 * console.log(firefoxCaps);
 */
class Firefox {
  get capabilities() {
    const options = {
      args: [],
      prefs,
    }

    if (seleniumConfig.headless === 'true' || seleniumConfig.headless === true) {
      options.args.push('-headless')
    }
    if (seleniumConfig.incognito === 'true' || seleniumConfig.incognito === true) {
      options.args.push('-private')
    }

     
    this._capabilities = Capabilities.firefox()
    this._capabilities.set('moz:firefoxOptions', options)
    this._capabilities.setAcceptInsecureCerts(true)
    this._capabilities.set('pageLoadStrategy', 'normal')
    return this._capabilities
     
  }
}

export default Firefox
