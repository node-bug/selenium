const { log } = require('@nodebug/logger')
const { By, Key, Condition } = require('selenium-webdriver')
const Browser = require('./app/browser')
const WebElement = require('./app/elements')
const Visual = require('./app/visual')

function Driver(driver, options) {
  const browser = new Browser(driver, options)
  const webElement = new WebElement(driver)
  let stack = []

  function message(a) {
    let msg = ''
    if (a.action === 'click') {
      msg = 'Clicking on '
    } else if (a.action === 'focus') {
      msg = `Focussing on `
    } else if (a.action === 'scroll') {
      msg = `Scrolling into view `
    } else if (a.action === 'drag') {
      msg = `Dragging `
    } else if (a.action === 'drop') {
      msg = `Dropping on `
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
    } else if (a.action === 'waitInvisibility') {
      msg = `Waiting for invisibility of `
    } else if (a.action === 'check') {
      msg = `Checking checkbox for `
    } else if (a.action === 'uncheck') {
      msg = `Unchecking checkbox for `
    } else if (a.action === 'screenshot') {
      msg = `Capturing screenshot of `
    } else if (a.action === 'getText') {
      msg = `Getting text of `
    } else if (a.action === 'hide') {
      msg = `Hiding all matching `
    } else if (a.action === 'unhide') {
      msg = `Unhiding all matching `
    }
    for (let i = 0; i < stack.length; i++) {
      const obj = stack[i]
      if (['element', 'row', 'column'].includes(obj.type)) {
        if (obj.exact) {
          msg += 'exact '
        }
        msg += `${obj.type} '${obj.id}' `
        if (obj.index) {
          msg += `of index '${obj.index}' `
        }
      } else if (obj.type === 'location') {
        msg += `located `
        if (obj.exactly === true) {
          msg += `exactly `
        }
        msg += `'${obj.located}' `
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

  function get() {
    return this
  }

  async function text() {
    let value
    message({ action: 'getText' })
    try {
      const locator = await webElement.find(stack)
      value = await locator.element.getAttribute('textContent')
    } catch (err) {
      log.error(`Error during getting text.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return value
  }

  async function attribute(name) {
    let value
    message({ action: 'getText' })
    try {
      const locator = await webElement.find(stack)
      value = await locator.element.getAttribute(name)
    } catch (err) {
      log.error(`Error during getting text.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return value
  }

  async function hover() {
    message({ action: 'hover' })
    try {
      const locator = await webElement.find(stack)
      await browser.actions().move({ origin: locator.element }).perform()
    } catch (err) {
      log.error(`Error during hover.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function scroll() {
    message({ action: 'scroll' })
    try {
      const locator = await webElement.find(stack)
      await driver.executeScript(
        'return arguments[0].scrollIntoView();',
        locator.element,
      )
    } catch (err) {
      log.error(`Error during scroll into view.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function focus() {
    message({ action: 'focus' })
    try {
      const locator = await webElement.find(stack)
      await driver.executeScript(
        'return arguments[0].focus();',
        locator.element,
      )
    } catch (err) {
      log.error(`Error during focus.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function clicker(e) {
    try {
      await e.click()
    } catch (err) {
      if (err.name === 'ElementNotInteractableError') {
        await driver.executeScript('return arguments[0].click();', e)
      } else if (err.name === 'ElementClickInterceptedError') {
        await browser.actions().move({ origin: e }).click().perform()
      } else {
        throw err
      }
    }
  }

  async function click() {
    message({ action: 'click' })
    try {
      const locator = await webElement.find(stack)
      await clicker(locator.element)
    } catch (err) {
      log.error(`Error during click.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function drag() {
    message({ action: 'click' })
    try {
      const locator = await webElement.find(stack)
      await browser
        .actions()
        .move({ origin: locator.element })
        .press()
        .perform()
    } catch (err) {
      log.error(`Error during click.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function drop() {
    message({ action: 'click' })
    try {
      const locator = await webElement.find(stack)
      await browser
        .actions()
        .move({ origin: locator.element })
        .release()
        .perform()
    } catch (err) {
      log.error(`Error during click.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function write(value) {
    message({ action: 'write', data: value })
    try {
      const locator = await webElement.find(stack, 'write')
      if (['input', 'textarea'].includes(locator.tagName)) {
        await locator.element.sendKeys(value)
      } else {
        const eleValue = await locator.element.getAttribute('textContent')
        await clicker(locator.element)
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await browser.actions().sendKeys(Key.RIGHT).perform()
        }
        await browser.actions().sendKeys(value).perform()
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
      if (['input', 'textarea'].includes(locator.tagName)) {
        await locator.element.clear()
      } else {
        const eleValue = await locator.element.getAttribute('textContent')
        await clicker(locator.element)
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await browser.actions().sendKeys(Key.RIGHT).perform()
        }
        await browser.actions().keyDown(Key.SHIFT).perform()
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await browser.actions().sendKeys(Key.LEFT).perform()
        }
        await browser
          .actions()
          .keyUp(Key.SHIFT)
          .sendKeys(Key.BACK_SPACE)
          .perform()
        await browser.actions().sendKeys(Key.BACK_SPACE).perform()
      }
    } catch (err) {
      log.error(`Error while clearing field.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function overwrite(value) {
    message({ action: 'overwrite', data: value })
    try {
      const locator = await webElement.find(stack, 'write')
      if (['input', 'textarea'].includes(locator.tagName)) {
        await locator.element.clear()
        const eleValue = await locator.element.getAttribute('value')
        if (eleValue !== '') {
          await clicker(locator.element)
          for (let i = 0; i < eleValue.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            await browser.actions().sendKeys(Key.RIGHT).perform()
          }
          await browser.actions().keyDown(Key.SHIFT).perform()
          for (let i = 0; i < eleValue.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            await browser.actions().sendKeys(Key.LEFT).perform()
          }
          await browser.actions().keyUp(Key.SHIFT).sendKeys(value).perform()
        } else {
          await locator.element.sendKeys(value)
        }
      } else {
        const eleValue = await locator.element.getAttribute('textContent')
        await clicker(locator.element)
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await browser.actions().sendKeys(Key.RIGHT).perform()
        }
        await browser.actions().keyDown(Key.SHIFT).perform()
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await browser.actions().sendKeys(Key.LEFT).perform()
        }
        await browser.actions().keyUp(Key.SHIFT).sendKeys(value).perform()
      }
    } catch (err) {
      log.error(`Error while overwriting text in field.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function select(value) {
    message({ action: 'select', data: value })
    try {
      const locator = await webElement.find(stack, 'select')
      if (locator.tagName === 'select') {
        await locator.element
          .findElement(By.xpath(`.//option[.="${value}"]`))
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
        await clicker(locator.element)
      }
    } catch (err) {
      log.error(`Error during checkbox set.\nError ${err.stack}`)
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
    stack.push({ exact: true })
    return this
  }

  function element(data) {
    const pop = stack.pop()
    if (JSON.stringify(pop) === JSON.stringify({ exact: true })) {
      stack.push({
        type: 'element',
        id: data,
        exact: true,
        matches: [],
        index: false,
      })
    } else {
      if (typeof pop !== 'undefined') {
        stack.push(pop)
      }
      stack.push({
        type: 'element',
        id: data,
        exact: false,
        matches: [],
        index: false,
      })
    }
    return this
  }

  function row(data) {
    if (typeof data !== 'string') {
      throw new TypeError(
        `Expected parameter for row is string. Received ${typeof data} instead`,
      )
    }
    const pop = stack.pop()
    if (JSON.stringify(pop) === JSON.stringify({ exact: true })) {
      stack.push({
        type: 'row',
        id: data,
        exact: true,
        matches: [],
        index: false,
      })
    } else {
      if (typeof pop !== 'undefined') {
        stack.push(pop)
      }
      stack.push({
        type: 'row',
        id: data,
        exact: false,
        matches: [],
        index: false,
      })
    }
    return this
  }

  function column(data) {
    if (typeof data !== 'string') {
      throw new TypeError(
        `Expected parameter for column is string. Received ${typeof data} instead`,
      )
    }
    const pop = stack.pop()
    if (JSON.stringify(pop) === JSON.stringify({ exact: true })) {
      stack.push({
        type: 'column',
        id: data,
        exact: true,
        matches: [],
        index: false,
      })
    } else {
      if (typeof pop !== 'undefined') {
        stack.push(pop)
      }
      stack.push({
        type: 'column',
        id: data,
        exact: false,
        matches: [],
        index: false,
      })
    }
    return this
  }

  function near() {
    stack.push({ type: 'location', located: 'near' })
    return this
  }

  function exactly() {
    stack.push({ exactly: true })
    return this
  }

  function above() {
    const pop = stack.pop()
    if (JSON.stringify(pop) === JSON.stringify({ exactly: true })) {
      stack.push({ type: 'location', located: 'above', exactly: true })
    } else {
      if (typeof pop !== 'undefined') {
        stack.push(pop)
      }
      stack.push({ type: 'location', located: 'above', exactly: false })
    }
    return this
  }

  function below() {
    const pop = stack.pop()
    if (JSON.stringify(pop) === JSON.stringify({ exactly: true })) {
      stack.push({ type: 'location', located: 'below', exactly: true })
    } else {
      if (typeof pop !== 'undefined') {
        stack.push(pop)
      }
      stack.push({ type: 'location', located: 'below', exactly: false })
    }
    return this
  }

  function toLeftOf() {
    const pop = stack.pop()
    if (JSON.stringify(pop) === JSON.stringify({ exactly: true })) {
      stack.push({ type: 'location', located: 'toLeftOf', exactly: true })
    } else {
      if (typeof pop !== 'undefined') {
        stack.push(pop)
      }
      stack.push({ type: 'location', located: 'toLeftOf', exactly: false })
    }
    return this
  }

  function toRightOf() {
    const pop = stack.pop()
    if (JSON.stringify(pop) === JSON.stringify({ exactly: true })) {
      stack.push({ type: 'location', located: 'toRightOf', exactly: true })
    } else {
      if (typeof pop !== 'undefined') {
        stack.push(pop)
      }
      stack.push({ type: 'location', located: 'toRightOf', exactly: false })
    }
    return this
  }

  function within() {
    stack.push({ type: 'location', located: 'within' })
    return this
  }

  function atIndex(index) {
    if (typeof index !== 'number') {
      throw new TypeError(
        `Expected parameter for atIndex is number. Received ${typeof index} instead`,
      )
    }
    const pop = stack.pop()
    if (typeof pop !== 'undefined') {
      pop.index = index
      stack.push(pop)
    }
    return this
  }

  async function visibility(method, timeout) {
    let locator
    const { implicit } = await driver.manage().getTimeouts()

    if (typeof timeout === 'number') {
      await driver.manage().setTimeouts({ implicit: timeout * 1000 })
    }

    try {
      await driver.wait(
        (async function x() {
          locator = await webElement.find(stack)
          return ![undefined, null, ''].includes(locator)
        })(),
      )
    } catch (err) {
      if (method === 'fail') {
        log.error(err.stack)
        throw err
      }
    } finally {
      await driver.manage().setTimeouts({ implicit })
    }

    stack = []
    return ![undefined, null, ''].includes(locator)
  }

  async function invisibility(method, timeout) {
    let locator
    let wait
    const { implicit } = await driver.manage().getTimeouts()

    if (typeof timeout === 'number') {
      wait = timeout * 1000
    } else {
      wait = implicit
    }

    await driver.manage().setTimeouts({ implicit: 1000 })
    try {
      await driver.wait(
        new Condition(
          `for element to be invisible. Element is still visible on page.`,
          async function x() {
            try {
              locator = await webElement.find(stack)
            } catch (err) {
              if (
                err.message.includes('has no matching elements on page') ||
                err.name === 'StaleElementReferenceError'
              ) {
                return true
              }
              throw err
            }
            return false
          },
        ),
        wait,
      )
    } catch (err) {
      if (method === 'fail') {
        log.error(err.stack)
        throw err
      }
    } finally {
      await driver.manage().setTimeouts({ implicit })
    }

    stack = []
    return [undefined, null, ''].includes(locator)
  }

  async function isVisible(timeout) {
    message({ action: 'isVisible' })
    return visibility('nofail', timeout)
  }

  async function waitForVisibility(timeout) {
    message({ action: 'waitVisibility' })
    return visibility('fail', timeout)
  }

  async function waitForInvisibility(timeout) {
    message({ action: 'waitInvisibility' })
    return invisibility('fail', timeout)
  }

  async function screenshot() {
    let dataUrl = false
    if (stack.length > 0) {
      let locator
      try {
        locator = await webElement.find(stack)
      } catch (err) {
        log.error(err.stack)
      }
      if (![undefined, null, ''].includes(locator)) {
        message({ action: 'screenshot' })
        dataUrl = await locator.element.takeScreenshot(true)
      }
    }

    if (!dataUrl) {
      log.info('Capturing screenshot of page')
      dataUrl = await driver.takeScreenshot()
    }

    stack = []
    return dataUrl
  }

  async function visual(path) {
    const name = await browser.name()
    const os = await browser.os()
    const rect = await browser.getSize()
    const image = await screenshot()

    return Visual.compare(name, os, rect, image, path)
  }

  async function hide() {
    message({ action: 'hide' })
    try {
      const locators = await webElement.findAll(stack)
      const promises = locators.map(async (locator) => {
        await driver.executeScript(
          'return arguments[0].style.opacity=0',
          locator.element,
        )
      })
      await Promise.all(promises)
    } catch (err) {
      log.error(`Error during hide.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  async function unhide() {
    message({ action: 'unhide' })
    try {
      const locators = await webElement.findAll(stack)
      const promises = locators.map(async (locator) => {
        await driver.executeScript(
          'return arguments[0].style.opacity=1',
          locator.element,
        )
      })
      await Promise.all(promises)
    } catch (err) {
      log.error(`Error during unhide.\nError ${err.stack}`)
      throw err
    }
    stack = []
    return true
  }

  return {
    get,
    text,
    attribute,
    hover,
    scroll,
    click,
    focus,
    drag,
    drop,
    write,
    clear,
    overwrite,
    select,
    check,
    uncheck,
    exact,
    element,
    row,
    column,
    exactly,
    above,
    below,
    near,
    toLeftOf,
    toRightOf,
    within,
    atIndex,
    isVisible,
    waitForVisibility,
    waitForInvisibility,
    screenshot,
    visual,
    hide,
    unhide,
    name: browser.name,
    os: browser.os,
    sleep: browser.sleep,
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
