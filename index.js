const { log } = require('@nodebug/logger')
const { By, Key } = require('selenium-webdriver')
const config = require('@nodebug/config')('selenium')
const Browser = require('./app/browser')
const ElementLocator = require('./app/browser/elements')
const messenger = require('./app/messenger')
// const Alert = require('./app/alerts')
// const Visual = require('./app/visual')
class Driver extends Browser {
  // // const alert = new Alert(driver)
  constructor() {
    super()
    this.stack = []
    this.elementlocator = new ElementLocator()
  }

  get message() {
    return this._message
  }

  set message(value) {
    this._message = value
  }

  async start() {
    try {
      const { sessionId } = this.driver
      await this.close()
      log.info(`Deleted existing session linked to this test run ${sessionId}`)
    } catch (err) {
      if (
        ![
          "Cannot read properties of undefined (reading 'getSession')",
          "Cannot read properties of undefined (reading 'sessionId')",
          "Cannot destructure property 'sessionId' of 'this.driver' as it is undefined.",
        ].includes(err.message)
      ) {
        log.error(
          `Unrecognized error while deleting existing sessions : ${err.message}`,
        )
      }
    }
    await super.new()
    this.elementlocator.driver = this.driver
    this.window.driver = this.driver
  }

  get() {
    return this
  }

  getDescriptions() {
    const arrayOfArrays = []
    let arr = this.stack
    let index = arr.findIndex(
      (c) => c.type === 'condition' && c.operator === 'or',
    )
    while (index !== -1) {
      arrayOfArrays.push(arr.slice(0, index))
      arr = arr.splice(index + 1)
      index = arr.findIndex(
        (c) => c.type === 'condition' && c.operator === 'or',
      )
    }
    arrayOfArrays.push(arr)

    return arrayOfArrays
  }

  async finder(t = null, action = null) {
    let locator = null
    const stacks = this.getDescriptions()

    let timeout = config.timeout * 1000
    if (t !== null) {
      timeout = t
    }

    const now = await Date.now()
    while (Date.now() < now + timeout && [null, undefined].includes(locator)) {
      try {
        // eslint-disable-next-line no-await-in-loop
        for (let i = 0; i < stacks.length; i++) {
          const currentStack = stacks[i]
          try {
            // eslint-disable-next-line no-await-in-loop
            locator = await this.elementlocator.find(currentStack, action)
            break
          } catch (err) {
            // eslint-disable-next-line no-continue
            continue
          }
        }
        if (locator) break
      } catch (err) {
        continue
      }
    }

    if ([null, undefined].includes(locator)) {
      throw new Error(
        `Element was not found on screen after ${timeout} ms timeout`,
      )
    }

    return locator
  }

  async write(value) {
    this.message = messenger({ stack: this.stack, action: 'write', data: value })
    try {
      const locator = await this.finder(null, 'write')
      if (['input', 'textarea'].includes(locator.tagName)) {
        await locator.sendKeys(value)
      } else {
        const eleValue = await locator.getAttribute('textContent')
        await this.clicker(locator)
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await this.actions().sendKeys(Key.RIGHT).perform()
        }
        await this.actions().sendKeys(value).perform()
      }
    } catch (err) {
      log.error(
        `${this.message}\nError while entering data.\nError ${err.stack}`,
      )
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async find() {
    let locator
    this.message = messenger({ stack: this.stack, action: 'find' })
    try {
      locator = await this.finder()
    } catch (err) {
      log.error(`${this.message}\nError while finding element.\n${err.stack}`)
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return locator
  }

  async findAll(t = null) {
    let locators = []
    this.message = messenger({ stack: this.stack, action: 'find' })
    const stacks = this.getDescriptions()

    let timeout = config.timeout * 1000
    if (t !== null) {
      timeout = t
    }

    const now = await Date.now()
    while (Date.now() < now + timeout && !(locators.length > 0)) {
      try {
        // eslint-disable-next-line no-await-in-loop
        for (let i = 0; i < stacks.length; i++) {
          const currentStack = stacks[i]
          try {
            // eslint-disable-next-line no-await-in-loop
            locators = await this.elementlocator.findAll(currentStack)
            break
          } catch (err) {
            // eslint-disable-next-line no-continue
            continue
          }
        }
        if (locators.length > 0) break
      } catch (err) {
        continue
      }
    }

    if (!(locators.length > 0)) {
      this.stack = []
      throw new Error(
        `Element was not found on screen after ${timeout} ms timeout`,
      )
    }

    this.stack = []
    return locators
  }

  async text() {
    let value
    this.message = messenger({ stack: this.stack, action: 'getText' })
    try {
      const locator = await this.finder()
      value = await locator.getAttribute('textContent')
      if (value === '' && ['input', 'textarea'].includes(locator.tagName)) {
        value = await locator.getAttribute('value')
      }
    } catch (err) {
      log.error(
        `${this.message}\nError during getting text.\nError ${err.stack}`,
      )
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return value
  }

  async attribute(name) {
    let value
    this.message = messenger({ stack: this.stack, action: 'getAttribute', data: name })
    try {
      const locator = await this.finder()
      value = await locator.getAttribute(name)
    } catch (err) {
      log.error(
        `${this.message}\nError during getting text.\nError ${err.stack}`,
      )
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return value
  }

  async hover() {
    this.message = messenger({ stack: this.stack, action: 'hover' })
    try {
      const locator = await this.finder()
      await this.actions().move({ origin: locator }).perform()
    } catch (err) {
      log.error(`${this.message}\nError during hover.\nError ${err.stack}`)
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async scroll(d = null) {
    this.message = messenger({ stack: this.stack, action: 'scroll' })
    try {
      const locator = await this.finder()
      await this.driver.executeScript(
        'return arguments[0].scrollIntoView(true);',
        locator,
      )
      if (d !== null) {
        await this.driver.executeScript(
          'arguments[0].scrollLeft = arguments[0].scrollWidth',
          locator,
        )
      }
    } catch (err) {
      log.error(
        `${this.message}\nError during scroll into view.\nError ${err.stack}`,
      )
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async focus() {
    this.message = messenger({ stack: this.stack, action: 'focus' })
    try {
      const locator = await this.finder()
      await this.driver.executeScript('return arguments[0].focus();', locator)
    } catch (err) {
      log.error(`${this.message}\nError during focus.\nError ${err.stack}`)
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async clicker(e, x, y) {
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
      await this.actions()
        .move({ x: Math.ceil(ex), y: Math.ceil(ey) })
        .pause(1000)
        .click()
        .perform()
    } else {
      try {
        await e.click()
      } catch (err) {
        if (err.name === 'ElementNotInteractableError') {
          await this.driver.executeScript('return arguments[0].click();', e)
        } else if (err.name === 'ElementClickInterceptedError') {
          // this is required for clicking on Froala edit boxes
          await this.actions()
            .move({ origin: e })
            .pause(1000)
            .click()
            .perform()
        } else {
          throw err
        }
      }
    }
  }

  async click(x = null, y = null) {
    this.message = messenger({ stack: this.stack, action: 'click', x, y })
    try {
      const locator = await this.finder()
      await this.clicker(locator, x, y)
    } catch (err) {
      log.error(`${this.message}\nError during click.\nError ${err.stack}`)
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async doubleClick() {
    this.message = messenger({ stack: this.stack, action: 'doubleclick' })
    try {
      const locator = await this.finder()
      await this.actions().doubleClick(locator).perform()
    } catch (err) {
      log.error(
        `${this.message}\nError during double click.\nError ${err.stack}`,
      )
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async rightClick() {
    this.message = messenger({ stack: this.stack, action: 'rightclick' })
    try {
      const locator = await this.finder()
      await this.actions().contextClick(locator).perform()
    } catch (err) {
      log.error(
        `${this.message}\nError during right click.\nError ${err.stack}`,
      )
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async drop() {
    let indx
    indx = this.stack.findIndex((c) => c.type === 'action' && c.perform === 'drag')
    stack = this.stack.splice(indx + 1)
    indx = this.stack.findIndex((c) => c.type === 'action' && c.perform === 'onto')
    const dropStack = this.stack.splice(indx + 1)
    this.stack = this.stack.slice(0, indx)

    try {
      this.message = messenger({ stack: this.stack, action: 'drag' })
      const draglocator = await this.finder()
      this.stack = dropStack
      this.message = messenger({ stack: this.stack, action: 'drop' })
      const droplocator = await this.finder()

      const actions = await driver.actions({ async: true })
      await actions
        .move({ origin: draglocator, x: 2, y: 2 })
        .pause(1000)
        .press()
        .move({ origin: draglocator, x: 20, y: 20 })
        .pause(1000)
        .move({ origin: droplocator })
        .pause(1000)
        .release()
        .perform()
    } catch (err) {
      log.error(`${this.message}\nError during drop.\nError ${err.stack}`)
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async clear() {
    this.message = messenger({ stack: this.stack, action: 'clear' })
    try {
      const locator = await this.finder(null, 'write')
      if (['input', 'textarea'].includes(locator.tagName)) {
        await locator.clear()
      } else {
        const eleValue = await locator.getAttribute('textContent')
        await this.clicker(locator)
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await this.actions().sendKeys(Key.RIGHT).perform()
        }
        await this.actions().keyDown(Key.SHIFT).perform()
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await this.actions().sendKeys(Key.LEFT).perform()
        }
        await this.actions()
          .keyUp(Key.SHIFT)
          .sendKeys(Key.BACK_SPACE)
          .perform()
        await this.actions().sendKeys(Key.BACK_SPACE).perform()
      }
    } catch (err) {
      log.error(
        `${this.message}\nError while clearing field.\nError ${err.stack}`,
      )
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async overwrite(value) {
    this.message = messenger({ stack: this.stack, action: 'overwrite', data: value })
    try {
      let locator = await this.finder(null, 'write')
      if (['input', 'textarea'].includes(locator.tagName)) {
        if ((await locator.getAttribute('type')) !== 'number') {
          await locator.clear()
        }
        try {
          await this.clicker(locator)
        } catch (err) {
          if (err.name === 'StaleElementReferenceError') {
            locator = await this.finder(null, 'write')
            await this.clicker(locator)
          }
        }
        const eleValue = await locator.getAttribute('value')
        if (eleValue !== '') {
          await this.clicker(locator)
          for (let i = 0; i < eleValue.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            await this.actions().sendKeys(Key.RIGHT).perform()
          }
          await this.actions().keyDown(Key.SHIFT).perform()
          for (let i = 0; i < eleValue.length; i++) {
            // eslint-disable-next-line no-await-in-loop
            await this.actions().sendKeys(Key.LEFT).perform()
          }
          await this.actions().keyUp(Key.SHIFT).sendKeys(value).perform()
        } else {
          try {
            await locator.sendKeys(value)
          } catch (err) {
            if (err.name === 'StaleElementReferenceError') {
              locator = await this.finder(null, 'write')
              await locator.sendKeys(value)
            } else {
              throw err
            }
          }
        }
      } else {
        const eleValue = await locator.getAttribute('textContent')
        await this.clicker(locator)
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await this.actions().sendKeys(Key.RIGHT).perform()
        }
        await this.actions().keyDown(Key.SHIFT).perform()
        for (let i = 0; i < eleValue.length; i++) {
          // eslint-disable-next-line no-await-in-loop
          await this.actions().sendKeys(Key.LEFT).perform()
        }
        await this.actions().keyUp(Key.SHIFT).sendKeys(value).perform()
      }
    } catch (err) {
      log.error(
        `${this.message}\nError while overwriting text in field.\nError ${err.stack}`,
      )
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async select(value) {
    this.message = messenger({ stack: this.stack, action: 'select', data: value })
    try {
      const locator = await this.finder(null, 'select')
      if (['select'].includes(locator.tagName)) {
        const selected = await locator.findElements(
          By.xpath(`.//option[.="${value}"][@selected]`),
        )
        if (selected.length > 0) {
          log.debug(
            `'${value}' is already selected in the dropdown. Skipping select.`,
          )
        } else if (await locator.isEnabled()) {
          await locator.click()
          await locator.findElement(By.xpath(`.//option[.="${value}"]`)).click()
        } else {
          throw new ReferenceError(`Select element is disabled.`)
        }
      } else {
        throw new ReferenceError(`Element is not of type select`)
      }
    } catch (err) {
      log.error(
        `${this.message}\nError while selecting value in dropdown.\n${err.stack}`,
      )
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async checkboxaction(action) {
    try {
      const locator = await this.finder(null, 'check')
      const isChecked = await locator.isSelected()
      if (
        (action === 'check' && !isChecked) ||
        (action === 'uncheck' && isChecked)
      ) {
        await this.clicker(locator)
      }
      if (isChecked === (await locator.isSelected())) {
        if (
          (action === 'check' && !isChecked) ||
          (action === 'uncheck' && isChecked)
        ) {
          await this.driver.executeScript('return arguments[0].click();', locator)
        }
      }
    } catch (err) {
      log.error(
        `${this.message}\nError during checkbox set.\nError ${err.stack}`,
      )
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async check() {
    this.message = messenger({ stack: this.stack, action: 'check' })
    return this.checkboxaction('check')
  }

  async uncheck() {
    this.message = messenger({ stack: this.stack, action: 'uncheck' })
    return this.checkboxaction('uncheck')
  }

  async isDisabled() {
    this.message = messenger({ stack: this.stack, action: 'isDisabled' })

    let result
    try {
      const e = await this.finder()
      result = await e.isEnabled()
    } catch (err) {
      this.stack = []
      log.info(`Error while ${this.message}\n${err.message}`)
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return !result
  }

  async isVisible(t = null) {
    this.message = messenger({ stack: this.stack, action: 'isVisible' })
    let e
    try {
      e = await this.finder(t)
    } catch (err) {
      log.info(err.message)
    }

    this.stack = []
    if (![null, undefined, ''].includes(e)) {
      log.info('Element is visible on page')
      return true
    }
    log.info('Element is not visible on page')
    return false
  }

  async isDisplayed(t = null) {
    this.message = messenger({ stack: this.stack, action: 'waitVisibility' })
    try {
      await this.finder(t)
    } catch (err) {
      log.error(
        `${this.message}\nElement is not visible on screen.`,
      )
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    log.info('Element is visible on page')
    this.stack = []
    return true
  }

  async isNotDisplayed(t = null) {
    this.message = messenger({ stack: this.stack, action: 'waitInvisibility' })

    let timeout = config.timeout * 1000
    if (t !== null) {
      timeout = t
    }

    const now = await Date.now()
    /* eslint-disable no-await-in-loop */
    while (Date.now() < now + timeout) {
      try {
        await this.finder(1000)
        continue
      } catch (err) {
        log.info('Element is not visible on screen')
        this.stack = []
        return true
      }
    }
    /* eslint-enable no-await-in-loop */
    log.error(`${this.message}\nElement is visible on screen after ${timeout} ms`)
    this.stack = []
    throw new Error(`Error while ${this.message}\nElement is visible on screen after ${timeout} ms`)
  }

  async screenshot() {
    let dataUrl = false
    if (this.stack.length > 0) {
      let locator
      try {
        locator = await this.finder()
      } catch (err) {
        log.error(err.stack)
      }
      if (![undefined, null, ''].includes(locator)) {
        this.message = messenger({ stack: this.stack, action: 'screenshot' })
        dataUrl = await locator.takeScreenshot(true)
      }
    }

    if (!dataUrl) {
      log.info('Capturing screenshot of page')
      dataUrl = await this.driver.takeScreenshot()
    }

    this.stack = []
    return dataUrl
  }

  async hide() {
    this.message = messenger({ stack: this.stack, action: 'hide' })
    try {
      const elements = await this.findAll()
      log.debug(`${elements.length} matching elements found.`)
      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < elements.length; i++) {
        const e = elements[i]
        await this.driver.switchTo().defaultContent()
        if (e.frame >= 0) {
          await this.driver.switchTo().frame(e.frame)
        }
        await this.driver.executeScript('return arguments[0].style.opacity=0', e)
      }
      /* eslint-enable no-await-in-loop */
    } catch (err) {
      log.error(`${this.message}\nError during hide.\nError ${err.stack}`)
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async unhide() {
    this.message = messenger({ stack: this.stack, action: 'unhide' })
    try {
      const elements = await this.findAll()
      log.debug(`${elements.length} matching elements found.`)
      /* eslint-disable no-await-in-loop */
      for (let i = 0; i < elements.length; i++) {
        const e = elements[i]
        await this.driver.switchTo().defaultContent()
        if (e.frame >= 0) {
          await this.driver.switchTo().frame(e.frame)
        }
        await this.driver.executeScript('return arguments[0].style.opacity=1', e)
      }
      /* eslint-enable no-await-in-loop */
    } catch (err) {
      log.error(`${this.message}\nError during unhide.\nError ${err.stack}`)
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  async upload(value) {
    this.message = messenger({ stack: this.stack, action: 'upload', data: value })
    try {
      const locator = await this.finder()
      await locator.sendKeys(value)
    } catch (err) {
      log.error(
        `${this.message}\nError while uploading file.\nError ${err.stack}`,
      )
      this.stack = []
      err.message = `Error while ${this.message}\n${err.message}`
      throw err
    }
    this.stack = []
    return true
  }

  element(data) {
    const member = {
      type: 'element',
      id: data.toString(),
      exact: false,
      hidden: false,
      matches: [],
      index: false,
    }
    const og = this.stack.pop()
    if (typeof og !== 'undefined') {
      if ([
        JSON.stringify({ exact: true, hidden: true }),
        JSON.stringify({ exact: false, hidden: true }),
        JSON.stringify({ exact: true, hidden: false }),
        JSON.stringify({ exact: false, hidden: false }),
      ].includes(JSON.stringify(og))) {
        member.exact = og.exact
        member.hidden = og.hidden
        this.stack.push(member)
      } else {
        this.stack.push(og)
      }
    }
    this.stack.push(member)
    return this
  }

  exact() {
    const member = {
      exact: false,
      hidden: false,
    }
    const og = this.stack.pop()
    if (typeof og === 'undefined') {
      member.exact = true
      this.stack.push(member)
    } else {
      if ([
        JSON.stringify({ exact: true, hidden: true }),
        JSON.stringify({ exact: false, hidden: true }),
        JSON.stringify({ exact: true, hidden: false }),
        JSON.stringify({ exact: false, hidden: false }),
      ].includes(JSON.stringify(og))) {
        og.exact = true
        this.stack.push(og)
      } else {
        this.stack.push(og)
        member.exact = true
        this.stack.push(member)
      }
    }
    return this
  }

  hidden() {
    const member = {
      exact: false,
      hidden: false,
    }
    const og = this.stack.pop()
    if (typeof og === 'undefined') {
      member.hidden = true
      this.stack.push(member)
    } else {
      if ([
        JSON.stringify({ exact: true, hidden: true }),
        JSON.stringify({ exact: false, hidden: true }),
        JSON.stringify({ exact: true, hidden: false }),
        JSON.stringify({ exact: false, hidden: false }),
      ].includes(JSON.stringify(og))) {
        og.hidden = true
        this.stack.push(og)
      } else {
        this.stack.push(og)
        member.hidden = true
        this.stack.push(member)
      }
    }
    return this
  }

  typefixer(data, type) {
    this.element(data)
    const description = this.stack.pop()
    description.type = type
    this.stack.push(description)
    return this
  }

  button(data) {
    return this.typefixer(data, 'button')
  }

  radio(data) {
    return this.typefixer(data, 'radio')
  }

  textbox(data) {
    return this.typefixer(data, 'textbox')
  }

  checkbox(data) {
    return this.typefixer(data, 'checkbox')
  }

  image(data) {
    return this.typefixer(data, 'image')
  }

  toolbar(data) {
    return this.typefixer(data, 'toolbar')
  }

  tab(data) {
    return this.typefixer(data, 'tab')
  }

  link(data) {
    return this.typefixer(data, 'link')
  }

  dialog(data) {
    return this.typefixer(data, 'dialog')
  }

  fileElement(data) {
    return this.typefixer(data, 'file')
  }

  // row(data) {
  //   if (typeof data !== 'string') {
  //     throw new TypeError(
  //       `Expected parameter for row is string. Received ${typeof data} instead`,
  //     )
  //   }
  //   return this.typefixer(data, 'row')
  // }

  // column(data) {
  //   if (typeof data !== 'string') {
  //     throw new TypeError(
  //       `Expected parameter for column is string. Received ${typeof data} instead`,
  //     )
  //   }
  //   return this.typefixer(data, 'column')
  // }

  // table(data) {
  //   if (typeof data !== 'string') {
  //     throw new TypeError(
  //       `Expected parameter for table is string. Received ${typeof data} instead`,
  //     )
  //   }

  //   for (let i = this.stack.length - 1; i >= 0; i--) {
  //     if (this.stack[i].type === 'row' || this.stack[i].type === 'column')
  //     this.stack[i].table = data
  //   }

  //   const description = this.stack.pop()
  //   if (
  //     JSON.stringify(description) !==
  //     JSON.stringify({ type: 'location', located: 'within' })
  //   ) {
  //     if (typeof description !== 'undefined') {
  //       this.stack.push(description)
  //     }
  //   }
  //   return this
  // }

  relativePositioner(position) {
    const description = this.stack.pop()
    if (JSON.stringify(description) === JSON.stringify({ exactly: true })) {
      this.stack.push({ type: 'location', located: position, exactly: true })
    } else {
      if (typeof description !== 'undefined') {
        this.stack.push(description)
      }
      this.stack.push({ type: 'location', located: position, exactly: false })
    }
    return this
  }

  above() {
    return this.relativePositioner('above')
  }

  below() {
    return this.relativePositioner('below')
  }

  toLeftOf() {
    return this.relativePositioner('toLeftOf')
  }

  toRightOf() {
    return this.relativePositioner('toRightOf')
  }

  atIndex(index) {
    if (typeof index !== 'number') {
      throw new TypeError(
        `Expected parameter for atIndex is number. Received ${typeof index} instead`,
      )
    }
    const description = this.stack.pop()
    if (typeof description !== 'undefined') {
      description.index = index
      this.stack.push(description)
    }
    return this
  }

  exactly() {
    this.stack.push({ exactly: true })
    return this
  }

  within() {
    this.stack.push({ type: 'location', located: 'within' })
    return this
  }

  near() {
    this.stack.push({ type: 'location', located: 'near' })
    return this
  }

  or() {
    this.stack.push({ type: 'condition', operator: 'or' })
    return this
  }

  drag() {
    this.stack.push({ type: 'action', perform: 'drag' })
    return this
  }

  onto() {
    this.stack.push({ type: 'action', perform: 'onto' })
    return this
  }

  // async visual(path) {
  //   const name = await browser.name()
  //   const os = await browser.os()
  //   const rect = await browser.getSize()
  //   const image = await screenshot()

  //   return Visual.compare(name, os, rect, image, path)
  // }
}

module.exports = Driver
