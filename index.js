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
    } else if (a.action === 'getAttribute') {
      msg = `Getting attribute '${a.data}' of `
    } else if (a.action === 'hide') {
      msg = `Hiding all matching `
    } else if (a.action === 'unhide') {
      msg = `Unhiding all matching `
    }
    for (let i = 0; i < stack.length; i++) {
      const obj = stack[i]
      if (
        [
          'element',
          'radio',
          'checkbox',
          'textbox',
          'button',
          'row',
          'column',
        ].includes(obj.type)
      ) {
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
    } else if (a.action === 'click') {
      if (a.x !== null && a.y !== null) {
        msg += `at location x:${a.x} y:${a.y}`
      }
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
      `Element was not visible on page after ${t || timeout()} ms timeout`,
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
      err.message = `Error while ${currentMessage}\n${err.message}`
      throw err
    }
    stack = []
    return value
  }

  async function attribute(name) {
    let value
    message({ action: 'getAttribute', data: name })
    try {
      const locator = await find()
      value = await locator.element.getAttribute(name)
    } catch (err) {
      log.error(
        `${currentMessage}\nError during getting text.\nError ${err.stack}`,
      )
      stack = []
      err.message = `Error while ${currentMessage}\n${err.message}`
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
      err.message = `Error while ${currentMessage}\n${err.message}`
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
        'return arguments[0].scrollIntoView(true);',
        locator.element,
      )
    } catch (err) {
      log.error(
        `${currentMessage}\nError during scroll into view.\nError ${err.stack}`,
      )
      stack = []
      err.message = `Error while ${currentMessage}\n${err.message}`
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
      err.message = `Error while ${currentMessage}\n${err.message}`
      throw err
    }
    stack = []
    return true
  }

  async function clicker(e, x, y) {
    let ex
    let ey
    if (
      ![null, undefined, ''].includes(x) &&
      ![null, undefined, ''].includes(y)
    ) {
      const rect = await e.getRect()
      if (x >= rect.width) {
        throw new Error(
          `Cannot click on element at x:${x} y:${y} as element width is ${rect.width}`,
        )
      } else {
        ex = rect.x + parseInt(x, 10)
      }
      if (y >= rect.height) {
        throw new Error(
          `Cannot click on element at x:${x} y:${y} as element height is ${rect.height}`,
        )
      } else {
        ey = rect.y + parseInt(y, 10)
      }
      await browser
        .actions()
        .move({ x: Math.ceil(ex), y: Math.ceil(ey) })
        .pause(1000)
        .click()
        .perform()
    } else {
      try {
        await e.click()
      } catch (err) {
        if (err.name === 'ElementNotInteractableError') {
          await driver.executeScript('return arguments[0].click();', e)
        } else if (err.name === 'ElementClickInterceptedError') {
          // this is required for clicking on Froala edit boxes
          await browser
            .actions()
            .move({ origin: e })
            .pause(500)
            .click()
            .perform()
        } else {
          throw err
        }
      }
    }
  }

  async function click(x = null, y = null) {
    message({ action: 'click', x, y })
    try {
      const locator = await find()
      await clicker(locator.element, x, y)
    } catch (err) {
      log.error(`${currentMessage}\nError during click.\nError ${err.stack}`)
      stack = []
      err.message = `Error while ${currentMessage}\n${err.message}`
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
      err.message = `Error while ${currentMessage}\n${err.message}`
      throw err
    }
    stack = []
    return true
  }

  function drag() {
    stack.push({ type: 'action', perform: 'drag' })
    return this
  }

  function onto() {
    stack.push({ type: 'action', perform: 'onto' })
    return this
  }

  async function drop() {
    let indx
    indx = stack.findIndex((c) => c.type === 'action' && c.perform === 'drag')
    stack = stack.splice(indx + 1)
    indx = stack.findIndex((c) => c.type === 'action' && c.perform === 'onto')
    const dropStack = stack.splice(indx + 1)
    stack = stack.slice(0, indx)

    try {
      message({ action: 'drag' })
      const draglocator = await find()
      stack = dropStack
      message({ action: 'drop' })
      const droplocator = await find()

      const actions = await driver.actions({ async: true })
      await actions
        .move({ origin: draglocator.element, x: 2, y: 2 })
        .pause(1000)
        .press()
        .move({ origin: draglocator.element, x: 20, y: 20 })
        .pause(1000)
        .move({ origin: droplocator.element })
        .pause(500)
        .release()
        .perform()
    } catch (err) {
      log.error(`${currentMessage}\nError during drop.\nError ${err.stack}`)
      stack = []
      err.message = `Error while ${currentMessage}\n${err.message}`
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
      err.message = `Error while ${currentMessage}\n${err.message}`
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
      err.message = `Error while ${currentMessage}\n${err.message}`
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
      err.message = `Error while ${currentMessage}\n${err.message}`
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
      err.message = `Error while ${currentMessage}\n${err.message}`
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

      if (isChecked === (await locator.element.isSelected())) {
        if (
          (action === 'check' && !isChecked) ||
          (action === 'uncheck' && isChecked)
        ) {
          await driver.executeScript(
            'return arguments[0].click();',
            locator.element,
          )
        }
      }
    } catch (err) {
      log.error(
        `${currentMessage}\nError during checkbox set.\nError ${err.stack}`,
      )
      stack = []
      err.message = `Error while ${currentMessage}\n${err.message}`
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
    const description = stack.pop()
    if (JSON.stringify(description) === JSON.stringify({ exact: true })) {
      stack.push({
        type: 'element',
        id: data.toString(),
        exact: true,
        matches: [],
        index: false,
      })
    } else {
      if (typeof description !== 'undefined') {
        stack.push(description)
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
    const description = stack.pop()
    description.type = 'radio'
    stack.push(description)
    return this
  }

  function textbox(data) {
    element(data)
    const description = stack.pop()
    description.type = 'textbox'
    stack.push(description)
    return this
  }

  function checkbox(data) {
    element(data)
    const description = stack.pop()
    description.type = 'checkbox'
    stack.push(description)
    return this
  }

  function button(data) {
    element(data)
    const description = stack.pop()
    description.type = 'button'
    stack.push(description)
    return this
  }

  async function isDisabled() {
    message({ action: 'isDisabled' })

    let result
    try {
      const e = await find()
      result = await e.element.isEnabled()
    } catch (err) {
      stack = []
      log.info(`Error while ${currentMessage}\n${err.message}`)
      err.message = `Error while ${currentMessage}\n${err.message}`
      throw err
    }
    stack = []
    return !result
  }

  function row(data) {
    if (typeof data !== 'string') {
      throw new TypeError(
        `Expected parameter for row is string. Received ${typeof data} instead`,
      )
    }
    const description = stack.pop()
    if (JSON.stringify(description) === JSON.stringify({ exact: true })) {
      stack.push({
        type: 'row',
        id: data,
        exact: true,
        matches: [],
        index: false,
      })
    } else {
      if (typeof description !== 'undefined') {
        stack.push(description)
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
    const description = stack.pop()
    if (JSON.stringify(description) === JSON.stringify({ exact: true })) {
      stack.push({
        type: 'column',
        id: data,
        exact: true,
        matches: [],
        index: false,
      })
    } else {
      if (typeof description !== 'undefined') {
        stack.push(description)
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

  function table(data) {
    if (typeof data !== 'string') {
      throw new TypeError(
        `Expected parameter for table is string. Received ${typeof data} instead`,
      )
    }

    for (let i = stack.length - 1; i >= 0; i--) {
      if (stack[i].type === 'row' || stack[i].type === 'column')
        stack[i].table = data
    }

    const description = stack.pop()
    if (
      JSON.stringify(description) !==
      JSON.stringify({ type: 'location', located: 'within' })
    ) {
      if (typeof description !== 'undefined') {
        stack.push(description)
      }
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
    const description = stack.pop()
    if (JSON.stringify(description) === JSON.stringify({ exactly: true })) {
      stack.push({ type: 'location', located: 'above', exactly: true })
    } else {
      if (typeof description !== 'undefined') {
        stack.push(description)
      }
      stack.push({ type: 'location', located: 'above', exactly: false })
    }
    return this
  }

  function below() {
    const description = stack.pop()
    if (JSON.stringify(description) === JSON.stringify({ exactly: true })) {
      stack.push({ type: 'location', located: 'below', exactly: true })
    } else {
      if (typeof description !== 'undefined') {
        stack.push(description)
      }
      stack.push({ type: 'location', located: 'below', exactly: false })
    }
    return this
  }

  function toLeftOf() {
    const description = stack.pop()
    if (JSON.stringify(description) === JSON.stringify({ exactly: true })) {
      stack.push({ type: 'location', located: 'toLeftOf', exactly: true })
    } else {
      if (typeof description !== 'undefined') {
        stack.push(description)
      }
      stack.push({ type: 'location', located: 'toLeftOf', exactly: false })
    }
    return this
  }

  function toRightOf() {
    const description = stack.pop()
    if (JSON.stringify(description) === JSON.stringify({ exactly: true })) {
      stack.push({ type: 'location', located: 'toRightOf', exactly: true })
    } else {
      if (typeof description !== 'undefined') {
        stack.push(description)
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
    const description = stack.pop()
    if (typeof description !== 'undefined') {
      description.index = index
      stack.push(description)
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
      err.message = `Error while ${currentMessage}\n${err.message}`
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
      err.message = `Error while ${currentMessage}\n${err.message}`
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
      const elements = await webElement.findAll(stack)
      log.debug(`${elements.length} matching elements found.`)
      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < elements.length; i++) {
        const e = elements[i]
        await driver.switchTo().defaultContent()
        if (e.element.frame >= 0) {
          await driver.switchTo().frame(e.element.frame)
        }
        await driver.executeScript(
          'return arguments[0].style.opacity=0',
          e.element,
        )
      }
      /* eslint-enable no-await-in-loop */
    } catch (err) {
      log.error(`${currentMessage}\nError during hide.\nError ${err.stack}`)
      stack = []
      err.message = `Error while ${currentMessage}\n${err.message}`
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
      err.message = `Error while ${currentMessage}\n${err.message}`
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
    onto,
    drop,
    write,
    clear,
    overwrite,
    select,
    check,
    uncheck,
    isDisabled,
    exact,
    radio,
    textbox,
    checkbox,
    button,
    element,
    row,
    column,
    table,
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
