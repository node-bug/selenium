const { log } = require('@nodebug/logger')
const { By } = require('selenium-webdriver')
const { Browser } = require('./app/_browser.js')
const { WebElement } = require('./app/elements.js')

module.exports = class Driver extends Browser {
  // constructor(options) {
  //   super(options)
  //   this.stack = []
  //   this.WebElement = new WebElement(this.driver)
  // }

  constructor(driver, options) {
    super(driver, options)
    this.stack = []
    this.WebElement = new WebElement(this.driver)
  }

  message(a) {
    let message = ''
    if (a.action === 'click') {
      message = 'Clicking on '
    } else if (a.action === 'hover') {
      message = `Hovering on `
    } else if (a.action === 'write') {
      message = `Writing '${a.data}' into `
    } else if (a.action === 'clear') {
      message = `Clearing text in `
    } else if (a.action === 'overwrite') {
      message = `Overwriting with '${a.data}' in `
    } else if (a.action === 'select') {
      message = `Selecting '${a.data}' from dropdown `
    } else if (a.action === 'isVisible') {
      message = `Checking `
    } else if (a.action === 'waitVisibility') {
      message = `Waiting for `
    } else if (a.action === 'check') {
      message = `Checking checkbox for `
    } else if (a.action === 'uncheck') {
      message = `Unchecking checkbox for `
    }
    for (let i = 0; i < this.stack.length; i++) {
      const obj = this.stack[i]
      if (Object.prototype.hasOwnProperty.call(obj, 'element')) {
        if (Object.prototype.hasOwnProperty.call(obj, 'exact')) {
          message += 'exact '
        }
        message += `element '${obj.element}' `
      } else if (Object.prototype.hasOwnProperty.call(obj, 'location')) {
        message += `located '${obj.location}' `
      }
    }
    if (a.action === 'isVisible') {
      message += `is visible`
    } else if (a.action === 'waitVisibility') {
      message += `to be visible`
    }
    log.info(message)
    return true
  }

  async hover() {
    this.message({ action: 'hover' })
    try {
      const locator = await this.WebElement.find(this.stack)
      await (await this.actions()).move({ origin: locator.element }).perform()
    } catch (err) {
      log.error(`Error during hover.\nError ${err.stack}`)
      throw err
    }
    this.stack = []
    return true
  }

  async click() {
    this.message({ action: 'click' })
    try {
      const locator = await this.WebElement.find(this.stack)
      await locator.element.click()
    } catch (err) {
      log.error(`Error during click.\nError ${err.stack}`)
      throw err
    }
    this.stack = []
    return true
  }

  async write(text) {
    this.message({ action: 'write', data: text })
    try {
      const locator = await this.WebElement.find(this.stack, 'write')
      if (locator.tagName === 'input') {
        await locator.element.sendKeys(text)
      } else {
        await locator.element.click()
        await locator.element.sendKeys(text)
      }
    } catch (err) {
      log.error(`Error while entering data.\nError ${err.stack}`)
      throw err
    }
    this.stack = []
    return true
  }

  async clear() {
    this.message({ action: 'clear' })
    try {
      const locator = await this.WebElement.find(this.stack, 'write')
      if (locator.tagName === 'input') {
        await locator.element.clear()
      } else {
        throw new ReferenceError(`Element is not of type input`)
      }
    } catch (err) {
      log.error(`Error while clearing field.\nError ${err.stack}`)
      throw err
    }
    this.stack = []
    return true
  }

  async overwrite(text) {
    this.message({ action: 'overwrite', data: text })
    try {
      const locator = await this.WebElement.find(this.stack, 'write')
      if (['input', 'textarea'].includes(locator.tagName)) {
        await locator.element.clear()
      } else {
        throw new ReferenceError(`Element is not of type input`)
      }
      await locator.element.sendKeys(text)
    } catch (err) {
      log.error(`Error while overwriting text in field.\nError ${err.stack}`)
      throw err
    }
    this.stack = []
    return true
  }

  async select(text) {
    this.message({ action: 'select', data: text })
    try {
      const locator = await this.WebElement.find(this.stack, 'select')
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
    this.stack = []
    return true
  }

  async check() {
    this.message({ action: 'check' })
    return this.checkbox('check')
  }

  async uncheck() {
    this.message({ action: 'uncheck' })
    return this.checkbox('uncheck')
  }

  async checkbox(action) {
    try {
      const locator = await this.WebElement.find(this.stack, 'check')
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
    this.stack = []
    return true
  }

  exact() {
    this.stack.push({ match: 'exact' })
    return this
  }

  element(data) {
    const pop = this.stack.pop()
    if (JSON.stringify(pop) === JSON.stringify({ match: 'exact' })) {
      this.stack.push({ element: data, match: 'exact' })
    } else {
      if (typeof pop !== 'undefined') {
        this.stack.push(pop)
      }
      this.stack.push({ element: data })
    }
    return this
  }

  above() {
    this.stack.push({ location: 'above' })
    return this
  }

  below() {
    this.stack.push({ location: 'below' })
    return this
  }

  near() {
    this.stack.push({ location: 'near' })
    return this
  }

  toLeftOf() {
    this.stack.push({ location: 'toLeftOf' })
    return this
  }

  toRightOf() {
    this.stack.push({ location: 'toRightOf' })
    return this
  }

  within() {
    this.stack.push({ location: 'within' })
    return this
  }

  async visibility(method, timeout) {
    let locator
    const { implicit } = await this.driver.manage().getTimeouts()

    if (typeof timeout === 'number') {
      await this.driver.manage().setTimeouts({ implicit: timeout * 1000 })
    }

    try {
      await this.driver.wait(async () => {
        locator = await this.WebElement.find(this.stack)
        return ![undefined, null, ''].includes(locator)
      })
    } catch (err) {
      if (method === 'fail') {
        throw err
      }
    }

    await this.driver.manage().setTimeouts({ implicit })
    this.stack = []
    return ![undefined, null, ''].includes(locator)
  }

  async isVisible(timeout) {
    this.message({ action: 'isVisible' })
    return this.visibility('nofail', timeout)
  }

  async waitForVisibility(timeout) {
    this.message({ action: 'waitVisibility' })
    return this.visibility('fail', timeout)
  }
}
