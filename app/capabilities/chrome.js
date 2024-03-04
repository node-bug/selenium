const { Capabilities } = require('selenium-webdriver')
const config = require('@nodebug/config')('selenium')
const prefs = require('./preferences')

class Chrome {
  get capabilities() {
    const options = {
      args: [
        'force-device-scale-factor=1',
        '--disable-extensions',
        '--disable-gpu',
        '--disable-notifications',
        '--enable-automation',
      ],
      prefs,
      excludeSwitches: ['enable-automation'],
    }
    if (config.headless === 'true' || config.headless === true) {
      options.args.push('headless')
    }
    if (config.incognito === 'true' || config.incognito === true) {
      options.args.push('incognito')
    }

    /* eslint-disable no-underscore-dangle */
    this._capabilities = Capabilities.chrome()
    this._capabilities.set('goog:chromeOptions', options)
    return this._capabilities
    /* eslint-enable no-underscore-dangle */
  }
}

module.exports = Chrome
