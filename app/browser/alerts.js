const { log } = require('@nodebug/logger')
const { until } = require('selenium-webdriver')

class Alert {
  set driver(value) {
    // eslint-disable-next-line no-underscore-dangle
    this._driver = value
    this.alert = null
  }

  get driver() {
    // eslint-disable-next-line no-underscore-dangle
    return this._driver
  }

  // eslint-disable-next-line class-methods-use-this
  async get() {
    async function text() {
      await this.isVisible()
      return this.alert.getText()
    }

    return { text }
  }

  async isVisible() {
    try {
      if (await this.driver.wait(until.alertIsPresent(), 10000)) {
        this.alert = await this.driver.switchTo().alert()
        log.info(`Alert ${await this.alert.getText()} is present on page`)
        return true
      }
      log.info('Alert is not present on page')
      return false
    } catch (err) {
      log.error(`Exception Occurred. ${err.stack}`)
      throw err
    }
  }

  async accept() {
    log.info('Accepting Alert')
    await this.isVisible()
    try {
      return this.alert.accept()
    } catch (err) {
      log.error(`Exception Occurred. ${err.stack}`)
      throw err
    }
  }

  async dismiss() {
    log.info('Dismissing Alert')
    await this.isVisible()
    try {
      return this.alert.dismiss()
    } catch (err) {
      log.error(`Exception Occurred. ${err.stack}`)
      throw err
    }
  }
}

module.exports = Alert
