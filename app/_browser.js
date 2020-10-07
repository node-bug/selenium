const { log } = require('@nodebug/logger')
const remote = require('selenium-webdriver/remote')
const imagemin = require('imagemin')
const pngquant = require('imagemin-pngquant')
// const {openBrowser} = require('./driver')

exports.Browser = class {
  constructor(driver, options) {
    this.options = options
    this.driver = driver
  }

  // constructor(options) {
  //     this.options = options
  //     this.driver = openBrowser(options)
  // }

  async newWindow() {
    log.info(`Opening new ${this.options.browser} browser window`)
    return this.driver.switchTo().newWindow('window')
  }

  async close() {
    log.info(`Closing the browser. Current URL is ${await this.currentURL()}.`)
    await this.driver.quit()
    return true
  }

  async newTab() {
    log.info(`Opening new tab in the browser`)
    return this.driver.switchTo().newWindow('tab')
  }

  async closeTab() {
    log.info(`Closing tab with title ${await this.title()}`)
    await this.driver.close()
    await this.switchTab()
    log.info(`Current tab ${await this.title()}`)
    return true
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
            let found = false
            const og = await this.windowHandle()
            await this.driver.wait(async () => {
              const hs = await this.driver.getAllWindowHandles()
              for (let i = 0; i < hs.length; i++) {
                /* eslint-disable no-await-in-loop */
                await this.driver.switchTo().window(hs[i])
                if ((await this.title()).includes(tab)) {
                  found = true
                  break
                }
                /* eslint-enable no-await-in-loop */
              }
              return found
            })
            if (!found) {
              await this.driver.switchTo().window(og)
              throw new ReferenceError(`Tab ${tab} was not found`)
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

  async windowHandle() {
    return this.driver.getWindowHandle()
  }

  async title() {
    return this.driver.getTitle()
  }

  async currentURL() {
    return this.driver.getCurrentUrl()
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

  async setSize(size) {
    await this.maximize()
    try {
      if (size.height !== undefined && size.width !== undefined) {
        log.info(`Resizing the browser to ${JSON.stringify(size)}.`)
        return this.driver.manage().window().setRect(size)
      }
    } catch (err) {
      log.error(err)
      throw err
    }
    return false
  }

  async getSize() {
    return this.driver.manage().window().getRect()
  }

  async goto(url) {
    log.info(`Loading the url ${url} in the browser.`)
    try {
      await this.setSize({
        width: this.options.width,
        height: this.options.height,
      })
      await this.driver.manage().setTimeouts({
        implicit: this.options.timeout * 1000,
        pageLoad: 6 * this.options.timeout * 1000,
        script: 6 * this.options.timeout * 1000,
      })
      await this.driver.setFileDetector(new remote.FileDetector())
      await this.driver.get(url)
      return true
    } catch (err) {
      log.error(`Unable to navigate to ${url}\nError ${err.stack}`)
      throw err
    }
  }

  async refresh() {
    log.info(`Refreshing ${await this.title()}`)
    return this.driver.navigate().refresh()
  }

  async goBack() {
    log.info(`Current page is ${await this.title()}`)
    log.info(`Performing browser back`)
    await this.driver.navigate().back()
    log.info(`Loaded page is ${await this.title()}`)
    return true
  }

  async goForward() {
    log.info(`Current page is ${await this.title()}`)
    log.info(`Performing browser forward`)
    await this.driver.navigate().forward()
    log.info(`Loaded page is ${await this.title()}`)
    return true
  }

  async reset() {
    log.info(`Resetting the browser, cache and cookies`)
    return this.driver.manage().deleteAllCookies()
  }

  async screenshot() {
    try {
      return (
        await imagemin.buffer(
          Buffer.from(await this.driver.takeScreenshot(), 'base64'),
          {
            plugins: [
              pngquant({
                quality: [0.1, 0.4],
              }),
            ],
          },
        )
      ).toString('base64')
    } catch (err) {
      log.error(err.stack)
      return false
    }
  }

  async getDriver() {
    return this.driver
  }
}
