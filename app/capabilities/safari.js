const prefs = require('./preferences')
const config = require('@nodebug/config')('selenium')
const { Capabilities } = require('selenium-webdriver')

class Safari {
    get capabilities(){
        const options = {
            args: [
                '--start-maximized',
                '--disable-infobars', 
                '--disable-gpu',
            ],
            prefs,
        }
        if (config.headless === 'true' || config.headless === true) {
            options.args.push('-headless')
        }
        if (config.incognito === 'true' || config.incognito === true) {
            options.args.push('-private')
        }
        this._capabilities = Capabilities.safari()
        this._capabilities.set('safariOptions', options)
        return this._capabilities
    }
}

module.exports = Safari