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

  //required to store the title to check for in isDisplayed and switch functions
  title(value) {
    this._windowTitleToCheck = value
    return this
  }

  // In JavaScript, if you define both a setter/method named title(value) and a getter named get title(), the getter often overwrites the method property depending on the environment
  // so using desiredTitle as the property name for the getter to avoid conflicts with the title(value) method
  get desiredTitle() {
    return this._windowTitleToCheck
  }

  set desiredTitle(value) {
    this._windowTitleToCheck = value
  }

  async isDisplayed(t = null) {
    log.debug(`Checking window with title '${this.desiredTitle}' is displayed`)
    if (this.desiredTitle === undefined) {
      log.warn(`Window title is not defined. Please set a title to check for using the 'title' function.`)
    }
    let timeout = selenium.timeout * 1000
    if (t !== null) {
      timeout = t
    }

    let og
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

    const now = Date.now()

    while (Date.now() < now + timeout) {
      try {
        const handles = await this.driver.getAllWindowHandles()

        for (const handle of handles) {
          await this.driver.switchTo().window(handle)
          if ((await this.get.title()).includes(this.desiredTitle)) {
            if (og !== undefined) {
              await this.driver.switchTo().window(og)
            }
            log.debug(`Found window with title '${await this.get.title()}'`)
            await this.driver.switchTo().window(og)
            this.desiredTitle = undefined
            return true
          }
        }
      } catch (err) {
        log.error(
          `Unrecognized error while checking window is displayed : ${err.message}`,
        )
        this.desiredTitle = undefined
        throw err
      }
    }
    log.info(
      `Window was not found on screen after '${timeout} ms' timeout`,
    )
    await this.driver.switchTo().window(og)
    this.desiredTitle = undefined
    return false
  }

  async switch(t = null) {
    log.debug(`Switching to window with title '${this.desiredTitle}'`)
    if (this.desiredTitle === undefined) {
      log.warn(`Window title is not defined. Please set a title to check for using the 'title' function.`)
    }
    let timeout = selenium.timeout * 1000
    if (t !== null) {
      timeout = t
    }

    let og
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

    const now = Date.now()

    while (Date.now() < now + timeout) {
      try {
        const handles = await this.driver.getAllWindowHandles()

        for (const handle of handles) {
          await this.driver.switchTo().window(handle)
          if ((await this.get.title()).includes(this.desiredTitle)) {
            log.debug(
              `Successfully switched to window with title '${await this.get.title()}'`,
            )
            this.desiredTitle = undefined
            return true
          }
        }
      } catch (err) {
        log.error(
          `Unrecognized error while switching to window with title : ${err.message}`,
        )
        this.desiredTitle = undefined
        throw err
      }
      await this.driver.switchTo().window(og)
      this.desiredTitle = undefined
    }
    log.error(
      `Window was not found on screen after '${timeout} ms' timeout`,
    )
    throw new Error(
      `Window was not found on screen after '${timeout} ms' timeout`,
    )
  }

  async new() {
    log.info(`Opening new '${selenium.browser}' browser window`)
    return this.driver.switchTo().newWindow('window')
  }

  async close() {
    log.info(`Closing window with title '${await this.get.title()}'`)
    await this.driver.close()
    const windows = await this.driver.getAllWindowHandles()
    if (windows.length <= 0) {
      log.error(`No browser windows are currenlty open. Is this expected?`)
    } else {
      await this.driver.switchTo().window(windows[0])
    }
    log.info(`Currently active window is '${await this.get.title()}'`)
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
