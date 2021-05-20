const { log } = require('@nodebug/logger')
const { until } = require('selenium-webdriver')

function Alert(driver) {
  let alert

  async function isVisible() {
    try {
      if (await driver.wait(until.alertIsPresent(), 10000)) {
        alert = await driver.switchTo().alert()
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

  function Get() {
    async function text() {
      await isVisible()
      return alert.getText()
    }

    return { text }
  }

  async function accept() {
    log.info('Accepting Alert')
    await isVisible()
    try {
      return alert.accept()
    } catch (err) {
      log.error(`Exception Occurred. ${err.stack}`)
      throw err
    }
  }

  async function dismiss() {
    log.info('Dismissing Alert')
    await isVisible()
    try {
      return alert.dismiss()
    } catch (err) {
      log.error(`Exception Occurred. ${err.stack}`)
      throw err
    }
  }

  const get = new Get()

  return { isVisible, accept, dismiss, get }
}

module.exports = Alert
