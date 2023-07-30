const { log } = require('@nodebug/logger')
const { until } = require('selenium-webdriver')

class Alert {
  constructor(driver) {
    this.driver = driver
  }

  async isVisible() {
    try {
      if (await this.driver.wait(until.alertIsPresent(), 10000)) {
        alert = await this.driver.switchTo().alert()
        log.info(`Alert ${await alert.getText()} is present on page`)
        return true
      }
      log.info('Alert is not present on page')
      return false
    } catch (err) {
      log.error(`Exception Occurred. ${err.stack}`)
      throw err
    }
  }

  get() {
    async function text() {
      await isVisible()
      return alert.getText()
    }

    return { text }
  }

  async accept() {
    log.info('Accepting Alert')
    await isVisible()
    try {
      return alert.accept()
    } catch (err) {
      log.error(`Exception Occurred. ${err.stack}`)
      throw err
    }
  }

  async dismiss() {
    log.info('Dismissing Alert')
    await isVisible()
    try {
      return alert.dismiss()
    } catch (err) {
      log.error(`Exception Occurred. ${err.stack}`)
      throw err
    }
  }
}

module.exports = Alert
