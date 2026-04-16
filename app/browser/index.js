import config from '@nodebug/config'
import { log } from '@nodebug/logger'
import { Builder } from 'selenium-webdriver'
import remote from 'selenium-webdriver/remote/index.js'
import capabilities from '../capabilities/index.js'
import Window from './window.js'
import Tab from './tab.js'

const selenium = config('selenium')

/**
 * Base Browser class for Selenium WebDriver operations
 */
class Browser {
  /**
   * Create a new Browser instance
   */
  constructor() {
    this._windowInstance = new Window();
    this._tabInstance = new Tab();
    this.window = (title) => {
      this._windowInstance.title(title);
      return this._windowInstance;
    };

    this.tab = (title) => {
      this._tabInstance.title(title);
      return this._tabInstance;
    };

    this.capabilities = capabilities()

    if (selenium.hub !== null) {
      this.hub = selenium.hub
    }
  }

  /**
   * Get browser capabilities
   * @returns {Object} Browser capabilities
   */
  get capabilities() {
    return this._capabilities
  }

  /**
   * Set browser capabilities
   * @param {Object} value - Browser capabilities
   */
  set capabilities(value) {
    this._capabilities = value
  }

  /**
   * Get the WebDriver instance
   * @returns {Object} WebDriver instance
   */
  get driver() {
    return this._driver
  }

  /**
   * Set the WebDriver instance
   * @param {Object} value - WebDriver instance
   */
  set driver(value) {
    this._driver = value
    this._windowInstance.driver = value;
    this._tabInstance.driver = value;
  }

  /**
   * Initialize a new browser session
   * @returns {Promise<void>}
   */
  async new() {
    const builder = new Builder()
    builder.withCapabilities(this.capabilities)

    if (this.hub !== undefined && this.hub !== null && this.hub !== '') {
      builder.usingServer(this.hub)
    }

    this.driver = await builder.build()

    if (this.hub && this.hub !== '' && this.hub !== null && this.hub !== undefined) {
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
   * Get the default timeout value
   * @returns {number} Timeout in milliseconds
   */
  get timeout() {
    return parseInt(selenium.timeout, 10) * 1000
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  async sleep(ms) {
    log.info(`Sleeping for ${ms} ms`)
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get browser name
   * @returns {Promise<string>} Browser name
   */
  async name() {
    const capabilities = await this.driver.getCapabilities()
    return capabilities.get('browserName').replace(/\s/g, '')
  }

  /**
   * Get operating system
   * @returns {Promise<string>} Operating system name
   */
  async os() {
    const capabilities = await this.driver.getCapabilities()
    log.info(`Running tests on platform: '${capabilities.get('platformName')}'`)
    return capabilities.get('platformName').replace(/\s/g, '')
  }

  /**
   * Close the browser session
   * @returns {Promise<boolean>} True if successful
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
   * @param {Object} size - Window size object with width and height
   * @returns {Promise<boolean>} True if successful
   */
  async setSize(size) {
    const isValidSize = size &&
      typeof size === 'object' &&
      typeof size.width === 'number' &&
      !Number.isNaN(size.width) &&
      typeof size.height === 'number' &&
      !Number.isNaN(size.height);

    // //maximize no matter what if this function is called
    // await this.window.maximize()
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
   * Get browser window size
   * @returns {Promise<Object>} Window size with width and height
   */
  async getSize() {
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
  }

  /**
   * Navigate to a URL
   * @param {string} url - URL to navigate to
   * @returns {Promise<boolean>} True if successful
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
   * @returns {Promise<void>}
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
   * @returns {Promise<boolean>} True if successful
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
   * @returns {Promise<boolean>} True if successful
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
   * @returns {Promise<void>}
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
   * Get console errors from the browser
   * @returns {Promise<Array>} Array of console error entries
   */
  async consoleErrors() {
    try {
      const title = await this.window().get.title()
      log.info(`Getting console errors on page '${title}'`)

      const entries = []
      const logs = []

      const promises = ['browser'].map(async (type) => {
        entries.push(...(await this.driver.manage().logs().get(type)))
      })

      await Promise.all(promises)
      logs.push(...entries.filter((entry) => entry.level.name === 'SEVERE'))
      log.info(`Found ${logs.length} console error(s) on page '${title}'`)
      return logs
    } catch (err) {
      log.error(`Error getting console errors: ${err.message}`)
      throw err
    }
  }

  /**
   * Get the WebDriver actions instance
   * @returns {Object} WebDriver actions instance
   */
  actions() {
    return this.driver.actions({ async: true })
  }
}

export default Browser
