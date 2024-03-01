const { log } = require('@nodebug/logger')
const config = require('@nodebug/config')('selenium')

class Get {
  constructor(driver) {
    this.driver = driver
  }

  async title() {
    try {
      return this.driver.getTitle()
    } catch (err) {
      log.error(
        `Unrecognized error while getting the window title : ${err.message}`,
      )
    }
  }

  async url() {
    try {
      return this.driver.getCurrentUrl()
    } catch (err) {
      log.error(
        `Unrecognized error while getting the current URL : ${err.message}`,
      )
    }
  }
}

class Window {
  get timeout() {
    return config.timeout * 1000
  }

  set driver(value) {
    this._driver = value
    this.get = new Get(value)
  }

  get driver() {
    return this._driver
  }

  with() {
    return this
  }

  title(value) {
    this._title = value
    return this
  }

  async isDisplayed(t = null) {
    log.debug(`Checking window with title '${this._title}' is displayed`)
    let timeout = config.timeout * 1000
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
            log.error(
              `The active window was closed. Is that expected?`,
            )
          } else {
            log.error(
              `Unrecognized error while switching window. ${err}`,
            )
            throw err
          }
        }

        const handles = await this.driver.getAllWindowHandles()
        for (let handle of handles) {
          if (handle !== og) {
            await this.driver.switchTo().window(handle)
            if ((await this.get.title()).includes(this._title)) {
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
    log.debug(`Switching to window with title '${this._title}'`)
    let timeout = config.timeout * 1000
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
            log.error(
              `The active window was closed. Is that expected?`,
            )
          } else {
            log.error(
              `Unrecognized error while switching window. ${err}`,
            )
            throw err
          }
        }

        const handles = await this.driver.getAllWindowHandles()
        for (let handle of handles) {
          if (handle !== og) {
            await this.driver.switchTo().window(handle)
            if ((await this.get.title()).includes(this._title)) {
              log.debug(`Successfully switched to window with title '${await this.get.title()}'`)
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
    log.info(`Opening new ${config.browser} browser window`)
    return this.driver.switchTo().newWindow('window')
  }

  async close() {
    log.info(`Closing window with title ${await this.get.title()}`)
    await this.driver.close()
    const windows = await this.driver.getAllWindowHandles()
    if(windows.length < 0){
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

module.exports = Window