/**
 * Browser capabilities factory function
 * 
 * This module provides a factory function for creating browser capabilities
 * based on the configuration. It supports Chrome, Firefox, and Safari browsers.
 * 
 * @module capabilities
 * @param {Object} [configuration] - Browser configuration object
 * @returns {Object|Error} Browser capabilities or error if browser is not supported
 * @example
 * import capabilities from './app/capabilities/index.js';
 * const caps = capabilities();
 * console.log(caps);
 */
import config from '@nodebug/config'
import Chrome from './chrome.js'
import Firefox from './firefox.js'
import Safari from './safari.js'

const selenium = config('selenium')

/**
 * Get browser capabilities based on configuration
 * 
 * Factory function that returns browser-specific capabilities by reading
 * the `browser` property from the configuration object. The browser name
 * is compared case-insensitively.
 * 
 * @param {Object} [configuration=selenium] - Browser configuration object
 * @param {string} configuration.browser - The browser name ('chrome', 'firefox', or 'safari')
 * @returns {Object|Error} Browser capabilities object on success, or an Error
 * if the browser name is not recognized
 * @throws {Error} Returns an Error (not thrown) when `configuration.browser`
 * is not one of 'chrome', 'firefox', or 'safari'
 * @example
 * const caps = capabilities();
 * console.log(caps);
 */
function capabilities(configuration = selenium) {
  switch (configuration.browser.toLowerCase()) {
    case 'firefox':
      return new Firefox().capabilities

    case 'chrome':
      return new Chrome().capabilities

    case 'safari':
      return new Safari().capabilities

    default:
      // Return an Error for unsupported browsers rather than throwing,
      // so the caller can handle it gracefully
      return new Error(`${configuration.browser} is not a known platform name. \
              Known platforms are 'Firefox', 'Safari' and 'Chrome'`)
  }
}

export default capabilities
