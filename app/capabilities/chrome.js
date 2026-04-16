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
 * @returns {Object} Chrome browser capabilities configuration
 * @example
 * const chromeCaps = new Chrome().capabilities;
 * console.log(chromeCaps);
 */
class Chrome {
  get capabilities() {
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

    if (selenium.headless === 'true' || selenium.headless === true) {
      options.args.push('--headless=new')
    }
    if (selenium.incognito === 'true' || selenium.incognito === true) {
      options.args.push('--incognito')
    }

     
    this._capabilities = Capabilities.chrome()
    this._capabilities.set('goog:chromeOptions', options)
    this._capabilities.set('pageLoadStrategy', 'normal')
    return this._capabilities
     
  }
}

export default Chrome
