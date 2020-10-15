const { log } = require('@nodebug/logger')
const imagemin = require('imagemin')
const pngquant = require('imagemin-pngquant')
const { By, Key } = require('selenium-webdriver')
const Browser = require('./app/_browser.js')
const WebElement = require('./app/elements.js')
const Visual = require('./app/visual.js')

function Driver(driver, options) {
  const browser = new Browser(driver, options)
  const webElement = new WebElement(driver)
  const comparison = new Visual()
  let stack = []

  function message(a) {
    let msg = ''
    if (a.action === 'click') {
      msg = 'Clicking on '
    } else if (a.action === 'hover') {
      msg = `Hovering on `
    } else if (a.action === 'write') {
      msg = `Writing '${a.data}' into `
    } else if (a.action === 'clear') {
      msg = `Clearing text in `
    } else if (a.action === 'overwrite') {
      msg = `Overwriting with '${a.data}' in `
    } else if (a.action === 'select') {
      msg = `Selecting '${a.data}' from dropdown `
    } else if (a.action === 'isVisible') {
      msg = `Checking `
    } else if (a.action === 'waitVisibility') {
      msg = `Waiting for `
    } else if (a.action === 'check') {
      msg = `Checking checkbox for `
    } else if (a.action === 'uncheck') {
      msg = `Unchecking checkbox for `
    } else if (a.action === 'screenshot') {
      msg = `Capturing screenshot of `
    }
    for (let i = 0; i < stack.length; i++) {
      const obj = stack[i]
      if (Object.prototype.hasOwnProperty.call(obj, 'element')) {
        if (Object.prototype.hasOwnProperty.call(obj, 'exact')) {
          msg += 'exact '
        }
        msg += `element '${obj.element}' `
      } else if (Object.prototype.hasOwnProperty.call(obj, 'location')) {
        msg += `located '${obj.location}' `
      }
    }
    if (a.action === 'isVisible') {
      msg += `is visible`
    } else if (a.action === 'waitVisibility') {
      msg += `to be visible`
    }
    log.info(msg)
    return true
  }

  async function hover() {
    message({ action: 'hover' })
    try {
      const locator = await webElement.find(stack)
      await (await browser.actions())
        .move({ origin: locator.element })
        .perform()
    } catch (err) {
      log.error(`Error during hover.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function click() {
    message({ action: 'click' })
    try {
      const locator = await webElement.find(stack)
      await locator.element.click()
    } catch (err) {
      log.error(`Error during click.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function write(text) {
    message({ action: 'write', data: text })
    try {
      const locator = await webElement.find(stack, 'write')
      if (locator.tagName === 'input') {
        await locator.element.sendKeys(text)
      } else {
        const eleValue = await locator.element.getAttribute('textContent')
        await locator.element.click()
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await (await browser.actions()).sendKeys(Key.RIGHT).perform()
        }
        await (await browser.actions()).sendKeys(text).perform()
      }
    } catch (err) {
      log.error(`Error while entering data.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function clear() {
    message({ action: 'clear' })
    try {
      const locator = await webElement.find(stack, 'write')
      if (locator.tagName === 'input') {
        await locator.element.clear()
      } else {
        const eleValue = await locator.element.getAttribute('textContent')
        await locator.element.click()
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await (await browser.actions()).sendKeys(Key.RIGHT).perform()
        }
        await (await browser.actions()).keyDown(Key.SHIFT).perform()
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await (await browser.actions()).sendKeys(Key.LEFT).perform()
        }
        await (await browser.actions()).keyUp(Key.SHIFT).perform()
        await (await browser.actions()).sendKeys('').perform()
        // throw new ReferenceError(`Element is not of type input`)
      }
    } catch (err) {
      log.error(`Error while clearing field.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function overwrite(text) {
    message({ action: 'overwrite', data: text })
    try {
      const locator = await webElement.find(stack, 'write')
      if (['input', 'textarea'].includes(locator.tagName)) {
        await locator.element.clear()
        await locator.element.sendKeys(text)
      } else {
        const eleValue = await locator.element.getAttribute('textContent')
        await locator.element.click()
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await (await browser.actions()).sendKeys(Key.RIGHT).perform()
        }
        await (await browser.actions()).keyDown(Key.SHIFT).perform()
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await (await browser.actions()).sendKeys(Key.LEFT).perform()
        }
        await (await browser.actions()).keyUp(Key.SHIFT).perform()
        await (await browser.actions()).sendKeys(text).perform()
        // throw new ReferenceError(`Element is not of type input`)
      }
    } catch (err) {
      log.error(`Error while overwriting text in field.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function select(text) {
    message({ action: 'select', data: text })
    try {
      const locator = await webElement.find(stack, 'select')
      if (locator.tagName === 'select') {
        await locator.element
          .findElement(By.xpath(`option[.="${text}"]`))
          .click()
      } else {
        throw new ReferenceError(`Element is not of type select`)
      }
    } catch (err) {
      log.error(`Error while selecting value in dropdown.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function checkbox(action) {
    try {
      const locator = await webElement.find(stack, 'check')
      const isChecked = await locator.element.isSelected()
      if (
        (action === 'check' && !isChecked) ||
        (action === 'uncheck' && isChecked)
      ) {
        await locator.element.click()
      }
    } catch (err) {
      log.error(`Error during click.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function check() {
    message({ action: 'check' })
    return checkbox('check')
  }

  async function uncheck() {
    message({ action: 'uncheck' })
    return checkbox('uncheck')
  }

  function exact() {
    stack.push({ match: 'exact' })
    return this
  }

  function element(data) {
    const pop = stack.pop()
    if (JSON.stringify(pop) === JSON.stringify({ match: 'exact' })) {
      stack.push({ element: data, match: 'exact' })
    } else {
      if (typeof pop !== 'undefined') {
        stack.push(pop)
      }
      stack.push({ element: data })
    }
    return this
  }

  function above() {
    stack.push({ location: 'above' })
    return this
  }

  function below() {
    stack.push({ location: 'below' })
    return this
  }

  function near() {
    stack.push({ location: 'near' })
    return this
  }

  function toLeftOf() {
    stack.push({ location: 'toLeftOf' })
    return this
  }

  function toRightOf() {
    stack.push({ location: 'toRightOf' })
    return this
  }

  function within() {
    stack.push({ location: 'within' })
    return this
  }

  async function visibility(method, timeout) {
    let locator
    const { implicit } = await driver.manage().getTimeouts()

    if (typeof timeout === 'number') {
      await driver.manage().setTimeouts({ implicit: timeout * 1000 })
    }

    try {
      await driver.wait(async () => {
        locator = await webElement.find(stack)
        return ![undefined, null, ''].includes(locator)
      })
    } catch (err) {
      if (method === 'fail') {
        throw err
      }
    }

    await driver.manage().setTimeouts({ implicit })
    stack = []
    return ![undefined, null, ''].includes(locator)
  }

  async function isVisible(timeout) {
    message({ action: 'isVisible' })
    return visibility('nofail', timeout)
  }

  async function waitForVisibility(timeout) {
    message({ action: 'waitVisibility' })
    return visibility('fail', timeout)
  }

  async function screenshot() {
    let dataUrl
    const locator = await webElement.find(stack)
    if ([undefined, null, ''].includes(locator)) {
      log.info('Capturing screenshot of page')
      dataUrl = await driver.takeScreenshot()
    } else {
      message({ action: 'screenshot' })
      dataUrl = await locator.element.takeScreenshot(true)
    }
    stack = []
    try {
      return (
        await imagemin.buffer(Buffer.from(dataUrl, 'base64'), {
          plugins: [
            pngquant({
              quality: [0.1, 0.4],
            }),
          ],
        })
      ).toString('base64')
    } catch (err) {
      log.error(err.stack)
      return false
    }
  }

  async function visual(path) {
    const image = await screenshot()
    return comparison.perform(path, image)
  }

  return {
    hover,
    click,
    write,
    clear,
    overwrite,
    select,
    check,
    uncheck,
    exact,
    element,
    above,
    below,
    near,
    toLeftOf,
    toRightOf,
    within,
    isVisible,
    waitForVisibility,
    screenshot,
    visual,
    newWindow: browser.newWindow,
    close: browser.close,
    newTab: browser.newTab,
    closeTab: browser.closeTab,
    switchTab: browser.switchTab,
    title: browser.title,
    currentURL: browser.currentURL,
    maximize: browser.maximize,
    minimize: browser.minimize,
    fullscreen: browser.fullscreen,
    setSize: browser.setSize,
    getSize: browser.getSize,
    goto: browser.goto,
    refresh: browser.refresh,
    goBack: browser.goBack,
    goForward: browser.goForward,
    reset: browser.reset,
    getDriver: browser.getDriver,
    actions: browser.actions,
  }
}

module.exports = Driver
