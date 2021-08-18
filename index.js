const { log } = require('@nodebug/logger')
const { By, Key, withTagName } = require('selenium-webdriver')
const Browser = require('./app/browser')
const WebElement = require('./app/elements')
const Alert = require('./app/alerts')
const Visual = require('./app/visual')

function Driver(driver, options) {
  const browser = new Browser(driver, options)
  const webElement = new WebElement(driver)
  const alert = new Alert(driver)
  let stack = []
  let currentMessage

  function message(a) {
    let msg = ''
    if (a.action === 'click') {
      msg = 'Clicking on '
    } else if (a.action === 'doubleclick') {
      msg = 'Double clicking on '
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
    } else if (a.action === 'isVisible' || a.action === 'isDisabled') {
      msg = `Checking `
    } else if (
      a.action === 'waitVisibility' ||
      a.action === 'waitInvisibility'
    ) {
      msg = `Waiting for `
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
      if (['element', 'radio', 'row', 'column'].includes(obj.type)) {
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
    } else if (a.action === 'waitInvisibility') {
      msg += `to not be visible`
    } else if (a.action === 'isDisabled') {
      msg += `is disabled`
    }
    currentMessage = msg
    log.info(msg)
    return true
  }

  function get() {
    return this
  }

  function timeout() {
    return parseInt(options.timeout, 10) * 1000
  }

  async function find(t = null, action = null) {
    let locator = null
    await driver.wait(
      async function x() {
        try {
          locator = await webElement.find(stack, action)
        } catch (err) {
          return false
        }
        if (locator) return true
        return false
      },
      t || timeout(),
      `Element ${stack[0].id} was not visible on page after ${
        t || timeout()
      } ms timeout`,
    )
    stack = []
    return locator
  }

  async function text() {
    let value
    message({ action: 'getText' })
    try {
      const locator = await find()
      value = await locator.element.getAttribute('textContent')
    } catch (err) {
      log.error(
        `${currentMessage}\nError during getting text.\nError ${err.stack}`,
      )
      stack = []
      throw err
    }
    stack = []
    return value
  }

  async function attribute(name) {
    let value
    message({ action: 'getText' })
    try {
      const locator = await find()
      value = await locator.element.getAttribute(name)
    } catch (err) {
      log.error(
        `${currentMessage}\nError during getting text.\nError ${err.stack}`,
      )
      stack = []
      throw err
    }
    stack = []
    return value
  }

  async function hover() {
    message({ action: 'hover' })
    try {
      const locator = await find()
      await browser.actions().move({ origin: locator.element }).perform()
    } catch (err) {
      log.error(`${currentMessage}\nError during hover.\nError ${err.stack}`)
      stack = []
      throw err
    }
    stack = []
    return true
  }

  async function scroll() {
    message({ action: 'scroll' })
    try {
      const locator = await find()
      await driver.executeScript(
        'return arguments[0].scrollIntoView();',
        locator.element,
      )
    } catch (err) {
      log.error(
        `${currentMessage}\nError during scroll into view.\nError ${err.stack}`,
      )
      stack = []
      throw err
    }
    stack = []
    return true
  }

  async function focus() {
    message({ action: 'focus' })
    try {
      const locator = await find()
      await driver.executeScript(
        'return arguments[0].focus();',
        locator.element,
      )
    } catch (err) {
      log.error(`${currentMessage}\nError during focus.\nError ${err.stack}`)
      stack = []
      throw err
    }
    stack = []
    return true
  }

  async function clicker(e) {
    try {
      await e.click()
    } catch (err) {
      if (
        err.name === 'ElementNotInteractableError' ||
        err.name === 'ElementClickInterceptedError'
      ) {
        await driver.executeScript('return arguments[0].click();', e)
        await browser.actions().move({ origin: e }).click().perform()
        // } else if (err.name === 'ElementClickInterceptedError') {
        //   await browser.actions().move({ origin: e }).click().perform()
      } else {
        throw err
      }
    }
  }

  async function click() {
    message({ action: 'click' })
    try {
      const locator = await find()
      await clicker(locator.element)
    } catch (err) {
      log.error(`${currentMessage}\nError during click.\nError ${err.stack}`)
      stack = []
      throw err
    }
    stack = []
    return true
  }

  async function doubleClick() {
    message({ action: 'doubleclick' })
    try {
      const locator = await find()
      await browser.actions().doubleClick(locator.element).perform()
    } catch (err) {
      log.error(
        `${currentMessage}\nError during double click.\nError ${err.stack}`,
      )
      stack = []
      throw err
    }
    stack = []
    return true
  }

  async function drag() {
    message({ action: 'drag' })
    try {
      const locator = await find()
      await browser.actions().move({ origin: locator.element }).perform()
      await browser.actions().press().perform()
    } catch (err) {
      log.error(`${currentMessage}\nError during drag.\nError ${err.stack}`)
      stack = []
      throw err
    }
    stack = []
    return true
  }

  async function drop() {
    message({ action: 'drop' })
    try {
      const locator = await find()
      await browser.actions().move({ origin: locator.element }).perform()
      await browser.actions().release().perform()
    } catch (err) {
      log.error(`${currentMessage}\nError during drop.\nError ${err.stack}`)
      stack = []
      throw err
    }
    stack = []
    return true
  }

  async function write(value) {
    message({ action: 'write', data: value })
    try {
      const locator = await find(null, 'write')
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
      log.error(
        `${currentMessage}\nError while entering data.\nError ${err.stack}`,
      )
      stack = []
      throw err
    }
    stack = []
    return true
  }

  async function clear() {
    message({ action: 'clear' })
    try {
      const locator = await find(null, 'write')
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
      log.error(
        `${currentMessage}\nError while clearing field.\nError ${err.stack}`,
      )
      stack = []
      throw err
    }
    stack = []
    return true
  }

  async function overwrite(value) {
    message({ action: 'overwrite', data: value })
    try {
      const locator = await find(null, 'write')
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
      log.error(
        `${currentMessage}\nError while overwriting text in field.\nError ${err.stack}`,
      )
      stack = []
      throw err
    }
    stack = []
    return true
  }

  async function select(value) {
    message({ action: 'select', data: value })
    try {
      const locator = await find(null, 'select')
      if (locator.tagName === 'select') {
        await locator.element
          .findElement(By.xpath(`.//option[.="${value}"]`))
          .click()
      } else {
        throw new ReferenceError(`Element is not of type select`)
      }
    } catch (err) {
      log.error(
        `${currentMessage}\nError while selecting value in dropdown.\nError ${err.stack}`,
      )
      stack = []
      throw err
    }
    stack = []
    return true
  }

  async function checkboxaction(action) {
    try {
      const locator = await find()
      const type = await locator.element.getAttribute('type')
      if (type !== 'checkbox') {
        locator.element = await driver.findElement(
          withTagName('[type=checkbox]').near(locator.element),
        )
      }
      const isChecked = await locator.element.isSelected()
      if (
        (action === 'check' && !isChecked) ||
        (action === 'uncheck' && isChecked)
      ) {
        await clicker(locator.element)
      }
    } catch (err) {
      log.error(
        `${currentMessage}\nError during checkbox set.\nError ${err.stack}`,
      )
      stack = []
      throw err
    }
    stack = []
    return true
  }

  async function check() {
    message({ action: 'check' })
    return checkboxaction('check')
  }

  async function uncheck() {
    message({ action: 'uncheck' })
    return checkboxaction('uncheck')
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
        id: data.toString(),
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
        id: data.toString(),
        exact: false,
        matches: [],
        index: false,
      })
    }
    return this
  }

  function radio(data) {
    element(data)
    const pop = stack.pop()
    pop.type = 'radio'
    stack.push(pop)
    return this
  }

  function textbox(data) {
    element(data)
    const pop = stack.pop()
    pop.type = 'textbox'
    stack.push(pop)
    return this
  }

  function checkbox(data) {
    element(data)
    const pop = stack.pop()
    pop.type = 'checkbox'
    stack.push(pop)
    return this
  }

  function button(data) {
    element(data)
    const pop = stack.pop()
    pop.type = 'button'
    stack.push(pop)
    return this
  }

  async function isDisabled() {
    message({ action: 'isDisabled' })

    let result
    try {
      const e = await find()
      result = !(await e.element.isEnabled())
    } catch (err) {
      stack = []
      log.info(err.message)
      throw err
    }
    stack = []
    return result
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

  async function isVisible(t = null) {
    message({ action: 'isVisible' })
    let e
    try {
      e = await find(t)
    } catch (err) {
      log.info(err.message)
    }

    stack = []
    if (![null, undefined, ''].includes(e)) {
      log.info('Element is visible on page')
      return true
    }
    log.info('Element is not visible on page')
    return false
  }

  async function waitForVisibility(t = null) {
    message({ action: 'waitVisibility' })
    try {
      await find(t)
    } catch (err) {
      log.error(
        `${currentMessage}\nElement is not visible on page\n${err.message}`,
      )
      stack = []
      throw err
    }
    log.info('Element is visible on page')
    stack = []
    return true
  }

  async function invisibility(t = null) {
    await driver.wait(async function x() {
      let locator = null
      try {
        locator = await webElement.find(stack)
      } catch (err) {
        return true
      }
      if (locator) {
        return false
      }
      return true
    }, t || timeout())
    stack = []
    return false
  }

  async function waitForInvisibility(t = null) {
    message({ action: 'waitInvisibility' })
    try {
      await invisibility(t)
    } catch (err) {
      log.error(`${currentMessage}\n${err.message}\nElement is visible on page`)
      stack = []
      throw err
    }
    log.info('Element is not visible on page')
    stack = []
    return true
  }

  async function screenshot() {
    let dataUrl = false
    if (stack.length > 0) {
      let locator
      try {
        locator = await find()
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
      log.error(`${currentMessage}\nError during hide.\nError ${err.stack}`)
      stack = []
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
      log.error(`${currentMessage}\nError during unhide.\nError ${err.stack}`)
      stack = []
      throw err
    }
    stack = []
    return true
  }

  return {
    alert,
    get,
    text,
    attribute,
    hover,
    scroll,
    click,
    doubleClick,
    focus,
    drag,
    drop,
    write,
    clear,
    overwrite,
    select,
    check,
    uncheck,
    radio,
    textbox,
    checkbox,
    button,
    isDisabled,
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
    find,
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
    consoleErrors: browser.consoleErrors,
    getDriver: browser.getDriver,
    actions: browser.actions,
  }
}

module.exports = Driver
