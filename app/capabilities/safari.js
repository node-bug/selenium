/**
 * Safari capabilities configuration class
 * 
 * This class provides Safari-specific browser capabilities for Selenium WebDriver.
 * It configures Safari options including browser name and page load strategy.
 * Note: Safari has limited support for headless mode compared to Chrome and Firefox.
 * 
 * @class Safari
 */
import { log } from '@nodebug/logger'
import { Capabilities } from 'selenium-webdriver'
import config from '@nodebug/config'
const selenium = config('selenium')

/**
 * Get Safari browser capabilities
 * 
 * @returns {Object} Safari browser capabilities configuration
 * @example
 * const safariCaps = new Safari().capabilities;
 * console.log(safariCaps);
 */
class Safari {
  get capabilities() {
    const options = {}

    this._capabilities = Capabilities.safari()
    this._capabilities.set('safari:options', options)
    this._capabilities.set('browserName', 'safari')
    this._capabilities.set('pageLoadStrategy', 'normal')

    // Handle headless mode if needed
    if (selenium.headless === 'true' || selenium.headless === true) {
      // Safari doesn't support headless mode in the same way as Chrome/Firefox
      // This is just a placeholder for consistency
      log.warn('Safari does not support headless mode')
    }

    return this._capabilities

  }
}

export default Safari
