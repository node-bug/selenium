const prefs = require('./preferences')
const config = require('@nodebug/config')('selenium')
const { Capabilities } = require('selenium-webdriver')

class Firefox {
    get capabilities(){
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
        this._capabilities = Capabilities.firefox()
        this._capabilities.set('moz:firefoxOptions', options)

        return this._capabilities
    }
}

module.exports = Firefox