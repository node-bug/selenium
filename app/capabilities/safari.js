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
 * Configures Safari with minimal options. Note:
 * - Safari does not support headless mode like Chrome/Firefox; a warning is logged if configured
 * - Safari does not use the shared preferences from preferences.js
 * - Limited customization is available compared to Chrome and Firefox
 * 
 * @returns {Object} Safari browser capabilities configuration
 * @example
 * const safariCaps = new Safari().capabilities;
 * console.log(safariCaps);
 */
class Safari {
  get capabilities() {
    /**
     * Safari-specific WebDriver options.
     * Currently empty as Safari has limited configuration options
     * compared to Chrome and Firefox.
     * @type {Object}
     */
    const options = {}

    this._capabilities = Capabilities.safari()
    // Apply Safari-specific options via the safari:options capability key
    this._capabilities.set('safari:options', options)
    // Explicitly set the browser name to 'safari'
    this._capabilities.set('browserName', 'safari')
    // Wait for the full page to load before returning control
    this._capabilities.set('pageLoadStrategy', 'normal')

    // Safari does not support true headless mode like Chrome/Firefox.
    // Log a warning if headless is configured so the user is aware.
    if (selenium.headless === 'true' || selenium.headless === true) {
      log.warn('Safari does not support headless mode')
    }

    return this._capabilities

  }
}

export default Safari
