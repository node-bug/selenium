const { log } = require('@nodebug/logger')
const remote = require('selenium-webdriver/remote')
// const {openBrowser} = require('./driver')

function Browser(webdriver, settings) {
  const driver = webdriver
  const options = settings

  function timeout() {
    return parseInt(options.timeout, 10) * 1000
  }

  async function name() {
    return (await driver.getCapabilities())
      .get('browserName')
      .replace(/\s/g, '')
  }

  async function os() {
    return (await driver.getCapabilities())
      .get('platformName')
      .replace(/\s/g, '')
  }

  async function sleep(ms) {
    log.info(`Sleeping for ${ms} ms`)
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

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
            const og = await windowHandle()

            try {
              await driver.wait(
                async () => {
                  const hs = await driver.getAllWindowHandles()
                  for (let i = 0; i < hs.length; i++) {
                    /* eslint-disable no-await-in-loop */
                    await driver.switchTo().window(hs[i])
                    if ((await title()).includes(tab)) {
                      return true
                    }
                    /* eslint-enable no-await-in-loop */
                  }
                  return false
                },
                timeout(),
                `Tab ${tab} was not found`,
              )
            } catch (err) {
              await driver.switchTo().window(og)
              throw err
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
        await driver.manage().window().setRect(size)
        await driver.switchTo().defaultContent()
        const deltaWidth = await driver.executeScript(
          'return window.outerWidth - window.innerWidth',
        )
        const deltaHeight = await driver.executeScript(
          'return window.outerHeight - window.innerHeight',
        )
        const lSize = size
        lSize.width += deltaWidth
        lSize.height += deltaHeight
        lSize.x = 0
        lSize.y = 0
        await driver.manage().window().setRect(lSize)
      }
    } catch (err) {
      log.error(err)
      throw err
    }
    return false
  }

  async function getSize() {
    await driver.switchTo().defaultContent()
    const width = await driver.executeScript('return window.innerWidth')
    const height = await driver.executeScript('return window.innerHeight')
    return { width, height }
  }

  async function goto(url) {
    log.info(`Loading the url ${url} in the browser.`)
    try {
      await setSize({
        width: parseInt(options.width, 10),
        height: parseInt(options.height, 10),
      })
      await driver.manage().setTimeouts({
        // implicit: timeout(),
        pageLoad: 6 * timeout(),
        script: 6 * timeout(),
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
    const hs = await driver.getAllWindowHandles()
    for (let i = 1; i < hs.length; i++) {
      /* eslint-disable no-await-in-loop */
      await driver.switchTo().window(hs[i])
      await driver.close()
      await driver.switchTo().window(hs[0])
      /* eslint-enable no-await-in-loop */
    }
    await driver.manage().deleteAllCookies()
    return driver.executeScript(
      'window.sessionStorage.clear();window.localStorage.clear();',
    )
  }

  async function consoleErrors() {
    log.info(`Getting console errors on page ${await title()}`)

    const entries = []
    const logs = []
    const promises = ['browser'].map(async (type) => {
      entries.push(...(await driver.manage().logs().get(type)))
    })
    await Promise.all(promises)
    ;['SEVERE'].map(async (level) => {
      logs.push(...entries.filter((entry) => entry.level.name === level))
    })

    return logs
  }

  async function getDriver() {
    return driver
  }

  function actions() {
    // return driver.actions({ bridge: true })
    return driver.actions({ async: true })
  }

  return {
    name,
    os,
    sleep,
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
    consoleErrors,
    getDriver,
    actions,
  }
}

module.exports = Browser
