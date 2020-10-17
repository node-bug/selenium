const remote = require('selenium-webdriver/remote')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const { log } = require('@nodebug/logger')
const config = require('@nodebug/config')('selenium')
const { sleep } = require('./utils')
const { openBrowser } = require('./app/driver')

const browser = openBrowser(config)

const capabilities = (async () =>
  // eslint-disable-next-line no-underscore-dangle
  Object.fromEntries((await browser.getCapabilities()).map_))()

function getDriver() {
  return browser
}
async function closeCurrentTab() {
  return browser.close()
}
async function getTitle() {
  return browser.getTitle()
}
async function getURL() {
  return browser.getCurrentUrl()
}
async function switchToTab(tab) {
  return browser.switchTo().window(tab)
}
async function refresh() {
  return browser.navigate().refresh()
}
async function maximize() {
  return browser.manage().window().maximize()
}

async function setSize(size) {
  await maximize()
  try {
    if (size.height !== undefined && size.width !== undefined) {
      log.info(`Resizing the browser to ${JSON.stringify(size)}.`)
      return browser.manage().window().setRect(size)
    }
  } catch (err) {
    log.error(err)
    throw err
  }
  return false
}

async function visitURL(url) {
  const size = {}
  if (config.height !== null && config.width !== null) {
    size.height = config.height
    size.width = config.width
  }
  log.info(`Loading the url ${url} in the browser.`)
  await setSize(size)
  await browser.manage().setTimeouts({
    implicit: config.timeout * 1000,
    pageLoad: 6 * config.timeout * 1000,
    script: 6 * config.timeout * 1000,
  })
  await browser.setFileDetector(new remote.FileDetector())
  await browser.get(url)
}

async function closeBrowser() {
  try {
    log.info(
      `Closing the browser. Current URL is ${await browser.getCurrentUrl()}.`,
    )
    return browser.quit()
  } catch (err) {
    log.error(`Error while quitting the browser. ${err.stack}`)
  }
  return false
}

async function resetBrowser() {
  const tabs = await browser.getAllWindowHandles()
  if (tabs.length > 1) {
    for (let index = 1; index < tabs.length; index += 1) {
      /* eslint-disable no-await-in-loop */
      await switchToTab(tabs[index])
      log.info(`Closing tab ${await getTitle()}.`)
      await browser.close()
      /* eslint-enable no-await-in-loop */
    }
  }
  await switchToTab(tabs[0])
  log.info(
    `Clearing cache and cookies. Current URL is ${await browser.getCurrentUrl()}.`,
  )
  await browser.manage().deleteAllCookies()
  return browser.executeScript(
    'window.sessionStorage.clear();window.localStorage.clear();',
  )
}

async function activateTab(tabName) {
  const startTimer = Date.now()
  while (Date.now() - startTimer < config.timeout * 1000) {
    /* eslint-disable no-await-in-loop */
    const tabs = await browser.getAllWindowHandles()
    for (let index = 0; index < tabs.length; index += 1) {
      await switchToTab(tabs[index])
      const currentTabName = await getTitle()
      if (currentTabName.includes(tabName)) {
        log.info(`${currentTabName} tab activated.`)
        return true
      }
    }
    await sleep(5000)
    /* eslint-enable no-await-in-loop */
  }
  return false
}

async function closeTabAndSwitch(tabName) {
  const startTimer = Date.now()
  while (Date.now() - startTimer < config.timeout * 1000) {
    /* eslint-disable no-await-in-loop */
    const tabs = await browser.getAllWindowHandles()
    if (tabs.length < 2) {
      log.error(`There is only 1 tab existing. Script will not closing the ${tabName}
            tab to avoid issues. Please check your test.`)
      return false
    }
    for (let index = 0; index < tabs.length; index += 1) {
      await switchToTab(tabs[index])
      const currentTabName = await getTitle()
      if (currentTabName.includes(tabName)) {
        await closeCurrentTab()
        log.info(`${currentTabName} tab closed.`)
        await switchToTab(tabs[0])
        log.info(`${await getTitle()} tab activated.`)
        return true
      }
    }
    await sleep(5000)
    /* eslint-enable no-await-in-loop */
  }
  return false
}

async function takeScreenshot() {
  try {
    return (
      await imagemin.buffer(
        Buffer.from(await browser.takeScreenshot(), 'base64'),
        {
          plugins: [
            imageminPngquant({
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

module.exports = {
  capabilities,
  getDriver,
  closeCurrentTab,
  getTitle,
  getURL,
  switchToTab,
  refresh,
  maximize,
  setSize,
  visitURL,
  closeBrowser,
  resetBrowser,
  activateTab,
  closeTabAndSwitch,
  takeScreenshot,
}
