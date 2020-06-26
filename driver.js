const remote = require('selenium-webdriver/remote')
const imagemin = require('imagemin')
const imageminPngquant = require('imagemin-pngquant')
const { log } = require('@nodebug/logger')
const config = require('@nodebug/config')('selenium')
const { sleep } = require('./utils')
const Browser = require('./app/browser')

const browser = new Browser()

// eslint-disable-next-line no-underscore-dangle
const capabilities = (async () => (await browser.getCapabilities()).map_)()

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
  try {
    if (size !== undefined) {
      log.info(`Resizing the browser to ${JSON.stringify(size)}.`)
      return browser.manage().window().setRect(size)
    }
    return maximize()
  } catch (err) {
    log.error(err)
    throw err
  }
}

async function visitURL(url) {
  log.info(`Loading the url ${url} in the browser.`)
  await setSize(config.size)
  await browser.manage().setTimeouts({
    implicit: config.timeout,
    pageLoad: config.timeout,
    script: config.timeout,
  })
  await browser.setFileDetector(new remote.FileDetector())
  await browser.get(url)
  await sleep(2000)
}

async function closeBrowser() {
  log.info(
    `Closing the browser. Current URL is ${await browser.getCurrentUrl()}.`,
  )
  return browser.quit()
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
  while (Date.now() - startTimer < config.timeout) {
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
  while (Date.now() - startTimer < config.timeout) {
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

//   const that = {}
//   that.capabilities = capabilities
//   that.getDriver = getDriver
//   that.closeCurrentTab = closeCurrentTab
//   that.getTitle = getTitle
//   that.getURL = getURL
//   that.switchToTab = switchToTab
//   that.refresh = refresh
//   that.maximize = maximize
//   that.setSize = setSize
//   that.visitURL = visitURL
//   that.closeBrowser = closeBrowser
//   that.resetBrowser = resetBrowser
//   that.activateTab = activateTab
//   that.closeTabAndSwitch = closeTabAndSwitch
//   that.takeScreenshot = takeScreenshot
//   return that

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

// const {By, until} = require('selenium-webdriver');

// const onWaitForElementToBeVisible = async (element) => {
//   log.debug(`Waiting for element (${element}) to appear...`);
//   try {
//     await browser.wait(until.elementLocated(element, 10000));
//     await browser.wait(
//       until.elementIsVisible(browser.findElement(element)),
//       10000,
//     );
//   } catch (err) {
//     log.error(err.stack);
//   }
// };

// const onPageLoadedWaitById = async (elementIdOnNextPage) => {
//   const by = By.id(elementIdOnNextPage);
//   log.debug(`Page Loaded - waited on id: ${elementIdOnNextPage}`);
//   onWaitForElementToBeVisible(by);
// };

// const onWaitForElementToBeInvisible = async (element) => {
//   log.debug('Waiting for element to disappear...');
//   try {
//     await browser.wait(until.elementLocated(element, 10000));
//     await browser.wait(
//       until.elementIsNotVisible(browser.findElement(element)),
//       15000,
//     );
//   } catch (err) {
//     log.error(err.stack);
//   }
// };

// const onWaitForWebElementToBeEnabled = async (webElement) => {
//   log.debug('Waiting for webElement to become enabled...');
//   try {
//     await browser.wait(until.elementIsEnabled(webElement, 10000));
//   } catch (err) {
//     log.error(err.stack);
//   }
// };

// const onWaitForWebElementToBeDisabled = async (webElement) => {
//   log.debug('Waiting for webElement to become disabled...');
//   try {
//     await browser.wait(until.elementIsDisabled(webElement), 3000);
//   } catch (err) {
//     log.error(err.stack);
//   }
// };

// const onWaitForElementToBeLocated = async (element) => {
//   log.debug('Waiting for element to become located...');
//   try {
//     await browser.wait(until.elementLocated(element, 10000));
//   } catch (err) {
//     log.error(err.stack);
//   }
// };

// Show Process config files
// process.argv.forEach((val, index) => {
//   log.debug(`${index}: ${val}`);
// });

// module.exports = {
//   onPageLoadedWaitById,
//   onWaitForElementToBeLocated,
//   onWaitForWebElementToBeEnabled,
//   onWaitForWebElementToBeDisabled,
//   onWaitForElementToBeVisible,
//   onWaitForElementToBeInvisible,
// };
