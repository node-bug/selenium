const { Capabilities } = require('selenium-webdriver')
const config = require('@nodebug/config')('selenium')
const prefs = require('./preferences')

class Firefox {
  get capabilities() {
    const options = {
      args: [],
      prefs,
    }
    if (config.headless === 'true' || config.headless === true) {
      options.args.push('-headless')
    }
    if (config.incognito === 'true' || config.incognito === true) {
      options.args.push('-private')
    }

    /* eslint-disable no-underscore-dangle */
    this._capabilities = Capabilities.firefox()
    this._capabilities.set('moz:firefoxOptions', options)
    return this._capabilities
    /* eslint-enable no-underscore-dangle */
  }
}

module.exports = Firefox
