import config from '@nodebug/config'
import { log } from '@nodebug/logger'
import { Builder } from 'selenium-webdriver'
import remote from 'selenium-webdriver/remote/index.js'
import capabilities from '../capabilities/index.js'
import Window from './window.js'
import Tab from './tab.js'
import Alert from './alerts.js'

const selenium = config('selenium')

/**
 * Base Browser class for Selenium WebDriver operations
 * 
 * This class provides a high-level API for automating web browsers using Selenium WebDriver.
 * It supports multiple browsers (Chrome, Firefox, Safari) and provides convenient methods
 * for window management, navigation, and browser state control.
 * 
 * @class Browser
 * @property {Function} window - Window management accessor. Call with a value to set the window identifier.
 * @property {Function} tab - Tab management accessor. Call with a value to set the tab identifier.
 * @property {Function} alert - Alert handling accessor. Call with a text identifier to target an alert.
 * @property {Object} capabilities - Browser capabilities configuration
 * @property {Object} driver - Selenium WebDriver instance
 * @property {string} [hub] - Selenium Grid hub URL (read from config)
 */
class Browser {
  /**
   * Create a new Browser instance
   * 
   * Configuration is read from the `selenium` section of the application config.
   * The `hub` property will be populated if `selenium.hub` is set in config.
   * 
   * @constructor
   */
  constructor() {
    this._windowInstance = new Window();
    this._tabInstance = new Tab();
    this._alertInstance = new Alert();

    this.window = (value) => {
      this._windowInstance.identifier(value);
      return this._windowInstance;
    };
    this.tab = (value) => {
      this._tabInstance.identifier(value);
      return this._tabInstance;
    };
    this.alert = (identifier) => {
      this._alertInstance.text(identifier);
      return this._alertInstance;
    }

    this.capabilities = capabilities()
    if (selenium.hub && selenium.hub !== null && selenium.hub !== undefined && selenium.hub !== '') {
      this.hub = selenium.hub
    }
  }

  /**
   * Get browser capabilities
   * 
   * @returns {Object} Browser capabilities configuration object
   * @example
   * const capabilities = browser.capabilities;
   * console.log(capabilities);
   */
  get capabilities() {
    return this._capabilities
  }

  /**
   * Set browser capabilities
   * 
   * @param {Object} value - Browser capabilities configuration object
   * @example
   * browser.capabilities = { browserName: 'chrome' };
   */
  set capabilities(value) {
    this._capabilities = value
  }

  /**
   * Get the WebDriver instance
   * 
   * @returns {Object} Selenium WebDriver instance
   * @example
   * const driver = browser.driver;
   * console.log(driver);
   */
  get driver() {
    return this._driver
  }

  /**
   * Set the WebDriver instance
   * 
   * @param {Object} value - Selenium WebDriver instance
   * @example
   * browser.driver = driver;
   */
  set driver(value) {
    this._driver = value
    this._windowInstance.driver = value;
    this._tabInstance.driver = value;
    this._alertInstance.driver = value;
  }

  /**
   * Initialize a new browser session with specified capabilities
   * 
   * This method creates a new browser session using the configured capabilities.
   * If a Selenium Grid hub is configured, it will connect to that hub.
   * Also registers process signal handlers for graceful cleanup.
   * 
   * @returns {Promise<void>} Resolves when the browser session is initialized
   * @throws {Error} If the WebDriver session cannot be created
   * @throws {Error} If no window handle appears within the timeout period
   * @example
   * await browser.new();
   */
  async new() {
    const builder = new Builder()
    builder.withCapabilities(this.capabilities)

    if (this.hub && this.hub !== undefined && this.hub !== null && this.hub !== '') {
      builder.usingServer(this.hub)
    }

    this.driver = await builder.build()

    if (this.hub && this.hub !== undefined && this.hub !== null && this.hub !== '') {
      await this.driver.setFileDetector(new remote.FileDetector())
    }

    await this.driver.wait(async (d) => {
      const handles = await d.getAllWindowHandles();
      return handles.length > 0;
    }, 10000, 'Timeout waiting for initial window handle');

    const cleanup = async () => {
      if (this.driver) try {
        await this.driver.quit();
      } catch {
        // Ignore errors if session was already closed
      } finally {
        this.driver = null; // CRITICAL: Nullify the reference
      }
      process.exit(0);
    };

    if (process.listenerCount('SIGINT') === 0) {
      ['SIGINT', 'SIGTERM', 'exit', 'uncaughtException'].forEach(signal => process.on(signal, cleanup));
    }
  }

  /**
   * Get the default timeout value in milliseconds
   * 
   * @returns {number} Timeout value in milliseconds
   * @example
   * const timeout = browser.timeout;
   * console.log(timeout); // e.g., 30000
   */
  get timeout() {
    const timeoutValue = parseInt(selenium.timeout, 10);
    return isNaN(timeoutValue) ? 10000 : timeoutValue * 1000;
  }

  /**
   * Sleep for specified milliseconds
   * 
   * Pauses execution for the specified number of milliseconds.
   * 
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>} Resolves after the specified time
   * @example
   * await browser.sleep(1000); // Sleep for 1 second
   */
  async sleep(ms) {
    log.info(`Sleeping for ${ms} ms`)
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Close the browser session
   * 
   * Closes the current browser session and cleans up resources.
   * 
   * @returns {Promise<boolean>} True if successful
   * @throws {Error} If the driver cannot be quit or the current URL cannot be retrieved
   * @example
   * await browser.close();
   */
  async close() {
    try {
      const currentUrl = await this.window().get.url()
      log.info(`Closing the browser. Current URL is '${currentUrl}'.`)
      await this.driver.quit()
    } catch (err) {
      log.error(`Error closing browser session: ${err.message}`)
      throw err
    }
    return true
  }

  /**
   * Set browser window size
   * 
   * Resizes the browser window to the specified dimensions.
   * The method compensates for browser chrome (toolbars, address bar) by measuring
   * the delta between outer and inner dimensions.
   * 
   * @param {Object} size - Window size object with width and height
   * @param {number} size.width - Width in pixels
   * @param {number} size.height - Height in pixels
   * @returns {Promise<boolean>} True if successful, false if size is invalid
   * @throws {Error} If the WebDriver cannot apply the new window dimensions
   * @example
   * await browser.setSize({ width: 1280, height: 800 });
   */
  async setSize(size) {
    const isValidSize = size &&
      typeof size === 'object' &&
      typeof size.width === 'number' &&
      !Number.isNaN(size.width) &&
      typeof size.height === 'number' &&
      !Number.isNaN(size.height);

    // //maximize no matter what if this function is called
    // await this.window().maximize()
    try {
      if (isValidSize) {
        await this.driver.manage().window().setRect(size)
        await this.driver.switchTo().defaultContent()

        const deltaWidth = await this.driver.executeScript(
          'return window.outerWidth - window.innerWidth'
        )
        const deltaHeight = await this.driver.executeScript(
          'return window.outerHeight - window.innerHeight'
        )

        const lSize = { ...size }
        lSize.width += deltaWidth
        lSize.height += deltaHeight
        lSize.x = 0
        lSize.y = 0

        await this.driver.manage().window().setRect(lSize)
        log.info(`Resizing the browser to (${JSON.stringify(size)}).`)

        return await this.driver.manage().window().setRect(size)
      } else {
        log.info(`Invalid size provided (${JSON.stringify(size)}). Browser will not be resized.`)
      }
    } catch (err) {
      log.error(`Error setting browser size: ${err.message}`)
      throw err
    }
    return false
  }

  /**
   * Navigate to a URL
   * 
   * Loads the specified URL in the browser. Also sets the window size
   * and configures implicit, page load, and script timeouts.
   * 
   * @param {string} url - URL to navigate to
   * @returns {Promise<boolean>} True if successful
   * @throws {Error} If the URL is invalid or navigation fails
   * @example
   * await browser.goto('https://www.google.com');
   */
  async goto(url) {
    try {
      // Validate URL
      if (!url || typeof url !== 'string') {
        throw new Error('Invalid URL provided')
      }

      log.info(`Loading the url '${url}' in the browser.`)

      await this.setSize({
        width: parseInt(selenium.width, 10),
        height: parseInt(selenium.height, 10),
      })

      await this.driver.manage().setTimeouts({
        implicit: 500,
        pageLoad: 6 * this.timeout,
        script: 6 * this.timeout,
      })

      await this.driver.get(url)
      return true
    } catch (err) {
      log.error(`Unable to navigate to '${url}': ${err.message}`)
      throw err
    }
  }

  /**
   * Refresh the current page
   * 
   * Reloads the current page.
   * 
   * @returns {Promise<void>} Resolves when the page is refreshed
   * @throws {Error} If the page cannot be refreshed
   * @example
   * await browser.refresh();
   */
  async refresh() {
    try {
      const title = await this.window().get.title()
      log.info(`Refreshing window with title '${title}'.`)
      await this.driver.navigate().refresh()
    } catch (err) {
      log.error(`Error refreshing page: ${err.message}`)
      throw err
    }
  }

  /**
   * Go back in browser history
   * 
   * Navigates to the previous page in the browser history.
   * 
   * @returns {Promise<boolean>} True if successful
   * @throws {Error} If navigation fails
   * @example
   * await browser.goBack();
   */
  async goBack() {
    try {
      const currentTitle = await this.window().get.title()
      log.info(`Current page is '${currentTitle}'`)
      log.info(`Performing browser back`)
      await this.driver.navigate().back()
      const newTitle = await this.window().get.title()
      log.info(`Loaded page is '${newTitle}'`)
      return true
    } catch (err) {
      log.error(`Error going back: ${err.message}`)
      throw err
    }
  }

  /**
   * Go forward in browser history
   * 
   * Navigates to the next page in the browser history.
   * 
   * @returns {Promise<boolean>} True if successful
   * @throws {Error} If navigation fails
   * @example
   * await browser.goForward();
   */
  async goForward() {
    try {
      const currentTitle = await this.window().get.title()
      log.info(`Current page is '${currentTitle}'`)
      log.info(`Performing browser forward`)
      await this.driver.navigate().forward()
      const newTitle = await this.window().get.title()
      log.info(`Loaded page is '${newTitle}'`)
      return true
    } catch (err) {
      log.error(`Error going forward: ${err.message}`)
      throw err
    }
  }

  /**
   * Reset browser state (close all windows, delete cookies, clear storage)
   * 
   * Resets the browser to a clean state by closing all windows, deleting cookies,
   * clearing local storage and session storage, and navigating to about:blank.
   * 
   * @returns {Promise<void>} Resolves when the browser is reset
   * @throws {Error} If the browser cannot be reset
   * @example
   * await browser.reset();
   */
  async reset() {
    try {
      log.info(`Resetting the browser, cache and cookies`)

      const windowHandles = await this.driver.getAllWindowHandles()
      for (let i = 1; i < windowHandles.length; i++) {
        await this.driver.switchTo().window(windowHandles[i])
        await this.driver.close()
        await this.driver.switchTo().window(windowHandles[0])
      }

      await this.driver.manage().deleteAllCookies()
      await this.driver.executeScript(
        'window.sessionStorage.clear(); window.localStorage.clear();'
      )
      await this.driver.get('about:blank');
    } catch (err) {
      log.error(`Error resetting browser: ${err.message}`)
      throw err
    }
  }

  /**
   * Get the WebDriver actions sequence builder
   * 
   * Returns a WebDriver Actions instance for constructing complex user interactions
   * such as key presses, mouse movements, drag-and-drop, and multi-step gestures.
   * 
   * @returns {WebdriverIO.Actions} WebDriver actions sequence builder
   * @example
   * const actions = browser.actions();
   * await actions.keyDown(Key.SHIFT).sendKeys('a').keyUp(Key.SHIFT).perform();
   */
  actions() {
    return this.driver.actions({ async: true })
  }

  /**
   * Accessor for retrieving current browser and page state.
   * 
   * Provides async methods to query the page title, current URL, browser name,
   * operating system platform, and viewport dimensions.
   * 
   * @type {Object}
   * @returns {Object} Object containing state accessor methods
   * @example
   * const title = await browser.get.title();
   * const url = await browser.get.url();
   * const browserName = await browser.get.name();
   * const platform = await browser.get.os();
   * const dimensions = await browser.get.size();
   */
  get get() {
    return {
      /**
       * Get the current page title
       * @returns {Promise<string>} The page title
       */
      title: async () => {
        return this._windowInstance.get.title()
      },
      /**
       * Get the current page URL
       * @returns {Promise<string>} The current URL
       */
      url: async () => {
        return this._windowInstance.get.url()
      },
      /**
       * Get the browser name (e.g., "chrome", "firefox", "safari")
       * @returns {Promise<string>} The browser name with whitespace removed
       */
      name: async () => {
        const capabilities = await this.driver.getCapabilities()
        return capabilities.get('browserName').replace(/\s/g, '')
      },
      /**
       * Get the operating system platform name
       * @returns {Promise<string>} The platform name with whitespace removed
       */
      os: async () => {
        const capabilities = await this.driver.getCapabilities()
        log.info(`Running tests on platform: '${capabilities.get('platformName')}'`)
        return capabilities.get('platformName').replace(/\s/g, '')
      },
      /**
       * Get the current viewport dimensions
       * @returns {Promise<{width: number, height: number}>} Object with width and height in pixels
       * @throws {Error} If the viewport size cannot be determined
       */
      size: async () => {
        try {
          await this.driver.switchTo().defaultContent()
          const width = await this.driver.executeScript('return window.innerWidth')
          const height = await this.driver.executeScript('return window.innerHeight')
          log.info(`Current browser size is '${width}x${height}'.`)
          return { width, height }
        } catch (err) {
          log.error(`Error getting browser size: ${err.message}`)
          throw err
        }
      },
    };
  }
}

export default Browser
