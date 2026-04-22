import { log } from '@nodebug/logger'
import config from '@nodebug/config';
const selenium = config('selenium');

/**
 * Get class for retrieving information about tabs/windows
 */
class Get {
  /**
   * Create a new Get instance
   * @param {Object} value - WebDriver instance
   */
  constructor(value) {
    this.driver = value
  }

  /**
   * Set the WebDriver instance
   * @param {Object} value - WebDriver instance
   */
  set driver(value) {
    this._driver = value
  }

  /**
   * Get the WebDriver instance
   * @returns {Object} WebDriver instance
   */
  get driver() {
    return this._driver
  }

  /**
   * Get tab/window title
   * @returns {Promise<string>} Title
   */
  async title() {
    try {
      return await this.driver.getTitle()
    } catch (err) {
      log.error(`Error getting title: ${err.message}`)
      throw err
    }
  }

  /**
   * Get current URL
   * @returns {Promise<string>} URL
   */
  async url() {
    try {
      return await this.driver.getCurrentUrl()
    } catch (err) {
      log.error(`Error getting URL: ${err.message}`)
      throw err
    }
  }
}

/**
 * Window management class
 */
class Window {
  /**
   * Get default timeout
   * @returns {number} Timeout in milliseconds
   */
  get timeout() {
    return selenium.timeout * 1000
  }

  /**
   * Set the WebDriver instance
   * @param {Object} value - WebDriver instance
   */
  set driver(value) {
    this._driver = value
    this.get = new Get(value)
  }

  /**
   * Get the WebDriver instance
   * @returns {Object} WebDriver instance
   */
  get driver() {
    return this._driver
  }

  /**
   * Start building a window operation
   * @returns {Window} Window instance
   */
  with() {
    return this
  }

  /**
   * Set window title
   * @param {string} value - Window title
   * @returns {Window} Window instance
   */
  title(value) {
    this.windowTitle = value
    return this
  }

  /**
   * Get window title
   * @returns {string} Window title
   */
  get windowTitle() {
    return this._title
  }

  /**
   * Set window title
   * @param {string} value - Window title
   */
  set windowTitle(value) {
    this._title = value
  }

  async isDisplayed(t = null) {
    log.debug(`Checking window with title '${this.windowTitle}' is displayed`)
    let timeout = selenium.timeout * 1000
    if (t !== null) {
      timeout = t
    }

    const now = await Date.now()
     
    while (Date.now() < now + timeout) {
      let og
      try {
        try {
          og = await this.driver.getWindowHandle()
        } catch (err) {
          if (err.name === 'NoSuchWindowError') {
            log.error(`The active window was closed. Is that expected?`)
          } else {
            log.error(`Unrecognized error while switching window. ${err}`)
            throw err
          }
        }

        const handles = await this.driver.getAllWindowHandles()
         
        for (const handle of handles) {
          if (handle !== og) {
            await this.driver.switchTo().window(handle)
            if ((await this.get.title()).includes(this.windowTitle)) {
              if (og !== undefined) {
                await this.driver.switchTo().window(og)
              }
              log.debug(`Found window with title '${await this.get.title()}'`)
              return true
            }
          }
        }
         
      } catch (err) {
        log.error(
          `Unrecognized error while checking window is displayed : ${err.message}`,
        )
        throw err
      }
    }
     

    throw new Error(
      `Window was not found on screen after ${timeout} ms timeout`,
    )
  }

  async switch(t = null) {
    log.debug(`Switching to window with title '${this.windowTitle}'`)
    let timeout = selenium.timeout * 1000
    if (t !== null) {
      timeout = t
    }

    const now = await Date.now()
     
    while (Date.now() < now + timeout) {
      let og
      try {
        try {
          og = await this.driver.getWindowHandle()
        } catch (err) {
          if (err.name === 'NoSuchWindowError') {
            log.error(`The active window was closed. Is that expected?`)
          } else {
            log.error(`Unrecognized error while switching window. ${err}`)
            throw err
          }
        }

        const handles = await this.driver.getAllWindowHandles()
         
        for (const handle of handles) {
          if (handle !== og) {
            await this.driver.switchTo().window(handle)
            if ((await this.get.title()).includes(this.windowTitle)) {
              log.debug(
                `Successfully switched to window with title '${await this.get.title()}'`,
              )
              return true
            }
          }
        }
         
      } catch (err) {
        log.error(
          `Unrecognized error while switching to window with title : ${err.message}`,
        )
        throw err
      }
    }
     

    throw new Error(
      `Window was not found on screen after ${timeout} ms timeout`,
    )
  }

  async new() {
    log.info(`Opening new ${selenium.browser} browser window`)
    return this.driver.switchTo().newWindow('window')
  }

  async close() {
    log.info(`Closing window with title ${await this.get.title()}`)
    await this.driver.close()
    const windows = await this.driver.getAllWindowHandles()
    if (windows.length < 0) {
      log.error(`No browser windows are currenlty open. Is this expected?`)
    } else {
      await this.driver.switchTo().window(windows[0])
    }
    log.info(`Currently active window is ${await this.get.title()}`)
    return true
  }

  async maximize() {
    log.info(`Maximizing browser`)
    return this.driver.manage().window().maximize()
  }

  async minimize() {
    log.info(`Minimizing browser`)
    return this.driver.manage().window().minimize()
  }

  async fullscreen() {
    log.info(`Switching to fullscreen`)
    return this.driver.manage().window().fullscreen()
  }
}

export default Window
