const { log } = require('@nodebug/logger')
const remote = require('selenium-webdriver/remote')
const imagemin = require('imagemin')
const pngquant = require('imagemin-pngquant')
// const {openBrowser} = require('./driver')

function Browser(dr, opt) {
  const options = opt
  const driver = dr

  async function windowHandle() {
    return driver.getWindowHandle()
  }

  async function title() {
    return driver.getTitle()
  }

  async function currentURL() {
    return driver.getCurrentUrl()
  }

  async function maximize() {
    log.info(`Maximizing browser`)
    return driver.manage().window().maximize()
  }

  async function minimize() {
    log.info(`Minimizing browser`)
    return driver.manage().window().minimize()
  }

  async function fullscreen() {
    log.info(`Switching to fullscreen`)
    return driver.manage().window().fullscreen()
  }

  async function newWindow() {
    log.info(`Opening new ${options.browser} browser window`)
    return driver.switchTo().newWindow('window')
  }

  async function close() {
    log.info(`Closing the browser. Current URL is ${await currentURL()}.`)
    await driver.quit()
    return true
  }

  async function newTab() {
    log.info(`Opening new tab in the browser`)
    return driver.switchTo().newWindow('tab')
  }

  async function switchTab(tab) {
    log.info(`Switching to tab ${tab}`)
    const handles = await driver.getAllWindowHandles()
    try {
      switch (typeof tab) {
        case 'number':
          return driver.switchTo().window(handles[tab])

        case 'string':
          {
            let found = false
            const og = await windowHandle()
            await driver.wait(async () => {
              const hs = await driver.getAllWindowHandles()
              for (let i = 0; i < hs.length; i++) {
                /* eslint-disable no-await-in-loop */
                await driver.switchTo().window(hs[i])
                if ((await title()).includes(tab)) {
                  found = true
                  break
                }
                /* eslint-enable no-await-in-loop */
              }
              return found
            })
            if (!found) {
              await driver.switchTo().window(og)
              throw new ReferenceError(`Tab ${tab} was not found`)
            }
          }
          return true

        default:
          return driver.switchTo().window(handles[0])
      }
    } catch (err) {
      log.error(`Unable to switch to tab ${tab}\nError ${err.stack}`)
      throw err
    }
  }

  async function closeTab() {
    log.info(`Closing tab with title ${await title()}`)
    await driver.close()
    await switchTab()
    log.info(`Current tab ${await title()}`)
    return true
  }

  async function setSize(size) {
    await maximize()
    try {
      if (size.height !== undefined && size.width !== undefined) {
        log.info(`Resizing the browser to ${JSON.stringify(size)}.`)
        return driver.manage().window().setRect(size)
      }
    } catch (err) {
      log.error(err)
      throw err
    }
    return false
  }

  async function getSize() {
    return driver.manage().window().getRect()
  }

  async function goto(url) {
    log.info(`Loading the url ${url} in the browser.`)
    try {
      await setSize({
        width: options.width,
        height: options.height,
      })
      await driver.manage().setTimeouts({
        implicit: options.timeout * 1000,
        pageLoad: 6 * options.timeout * 1000,
        script: 6 * options.timeout * 1000,
      })
      await driver.setFileDetector(new remote.FileDetector())
      await driver.get(url)
      return true
    } catch (err) {
      log.error(`Unable to navigate to ${url}\nError ${err.stack}`)
      throw err
    }
  }

  async function refresh() {
    log.info(`Refreshing ${await title()}`)
    return driver.navigate().refresh()
  }

  async function goBack() {
    log.info(`Current page is ${await title()}`)
    log.info(`Performing browser back`)
    await driver.navigate().back()
    log.info(`Loaded page is ${await title()}`)
    return true
  }

  async function goForward() {
    log.info(`Current page is ${await title()}`)
    log.info(`Performing browser forward`)
    await driver.navigate().forward()
    log.info(`Loaded page is ${await title()}`)
    return true
  }

  async function reset() {
    log.info(`Resetting the browser, cache and cookies`)
    return driver.manage().deleteAllCookies()
  }

  async function screenshot() {
    try {
      return (
        await imagemin.buffer(
          Buffer.from(await driver.takeScreenshot(), 'base64'),
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

  async function getDriver() {
    return driver
  }

  async function actions() {
    return driver.actions({ bridge: true })
  }

  return {
    newWindow,
    close,
    newTab,
    closeTab,
    switchTab,
    title,
    currentURL,
    maximize,
    minimize,
    fullscreen,
    setSize,
    getSize,
    goto,
    refresh,
    goBack,
    goForward,
    reset,
    screenshot,
    getDriver,
    actions,
  }
}

module.exports = Browser
