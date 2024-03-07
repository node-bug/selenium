const { log } = require('@nodebug/logger')
const config = require('@nodebug/config')('selenium')

class Get {
  constructor(value) {
    this.driver = value
  }

  set driver(value) {
    // eslint-disable-next-line no-underscore-dangle
    this._driver = value
  }

  get driver() {
    // eslint-disable-next-line no-underscore-dangle
    return this._driver
  }

  async title() {
    try {
      return this.driver.getTitle()
    } catch (err) {
      log.error(
        `Unrecognized error while getting the window title : ${err.message}`,
      )
      throw err
    }
  }

  async url() {
    try {
      return this.driver.getCurrentUrl()
    } catch (err) {
      log.error(
        `Unrecognized error while getting the current URL : ${err.message}`,
      )
      throw err
    }
  }
}

class Tab {
  // eslint-disable-next-line class-methods-use-this
  get timeout() {
    return config.timeout * 1000
  }

  set driver(value) {
    // eslint-disable-next-line no-underscore-dangle
    this._driver = value
    this.get = new Get(value)
  }

  get driver() {
    // eslint-disable-next-line no-underscore-dangle
    return this._driver
  }

  with() {
    return this
  }

  title(value) {
    // eslint-disable-next-line no-underscore-dangle
    this.tabTitle = value
    return this
  }

  get tabTitle() {
    // eslint-disable-next-line no-underscore-dangle
    return this._title
  }

  set tabTitle(value) {
    // eslint-disable-next-line no-underscore-dangle
    this._title = value
  }

  async isDisplayed(t = null) {
    log.debug(`Checking tab with title '${this.tabTitle}' is displayed`)
    let timeout = config.timeout * 1000
    if (t !== null) {
      timeout = t
    }

    const now = await Date.now()
    /* eslint-disable no-await-in-loop */
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
        /* eslint-disable no-restricted-syntax */
        for (const handle of handles) {
          if (handle !== og) {
            await this.driver.switchTo().window(handle)
            if ((await this.get.title()).includes(this.tabTitle)) {
              if (og !== undefined) {
                await this.driver.switchTo().window(og)
              }
              log.debug(`Found window with title '${await this.get.title()}'`)
              return true
            }
          }
        }
        /* eslint-enable no-restricted-syntax */
      } catch (err) {
        log.error(
          `Unrecognized error while checking window is displayed : ${err.message}`,
        )
        throw err
      }
    }
    /* eslint-enable no-await-in-loop */

    throw new Error(
      `Window was not found on screen after ${timeout} ms timeout`,
    )
  }

  async switch(t = null) {
    log.debug(`Switching to tab with title '${this.tabTitle}'`)
    let timeout = config.timeout * 1000
    if (t !== null) {
      timeout = t
    }

    const now = await Date.now()
    /* eslint-disable no-await-in-loop */
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
        /* eslint-disable no-restricted-syntax */
        for (const handle of handles) {
          if (handle !== og) {
            await this.driver.switchTo().window(handle)
            if ((await this.get.title()).includes(this.tabTitle)) {
              log.debug(
                `Successfully switched to window with title '${await this.get.title()}'`,
              )
              return true
            }
          }
        }
        /* eslint-enable no-restricted-syntax */
      } catch (err) {
        log.error(
          `Unrecognized error while switching to window with title : ${err.message}`,
        )
        throw err
      }
    }
    /* eslint-enable no-await-in-loop */

    throw new Error(
      `Window was not found on screen after ${timeout} ms timeout`,
    )
  }

  async switchTab(tab) {
    log.info(`Switching to tab ${tab}`)
    const handles = await this.driver.getAllWindowHandles()
    try {
      switch (typeof tab) {
        case 'number':
          return this.driver.switchTo().window(handles[tab])

        case 'string':
          {
            const og = await this.driver.getWindowHandle()
            try {
              await this.driver.wait(
                async () => {
                  const hs = await this.driver.getAllWindowHandles()
                  for (let i = 0; i < hs.length; i++) {
                    /* eslint-disable no-await-in-loop */
                    await this.driver.switchTo().window(hs[i])
                    if ((await this.get.title()).includes(tab)) {
                      return true
                    }
                    /* eslint-enable no-await-in-loop */
                  }
                  return false
                },
                this.timeout(),
                `Tab ${tab} was not found`,
              )
            } catch (err) {
              await this.driver.switchTo().window(og)
              throw err
            }
          }
          return true

        default:
          return this.driver.switchTo().window(handles[0])
      }
    } catch (err) {
      log.error(`Unable to switch to tab ${tab}\nError ${err.stack}`)
      throw err
    }
  }

  async new() {
    log.info(`Opening new tab in the browser window`)
    return this.driver.switchTo().newWindow('tab')
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
}

module.exports = Tab
