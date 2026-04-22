import { Capabilities } from 'selenium-webdriver'
import config from '@nodebug/config'
import prefs from './preferences.js'

const seleniumConfig = config('selenium')

class Firefox {
  get capabilities() {
    const options = {
      args: [],
      prefs,
    }

    if (seleniumConfig.headless === 'true' || seleniumConfig.headless === true) {
      options.args.push('-headless')
    }
    if (seleniumConfig.incognito === 'true' || seleniumConfig.incognito === true) {
      options.args.push('-private')
    }

     
    this._capabilities = Capabilities.firefox()
    this._capabilities.set('moz:firefoxOptions', options)
    this._capabilities.setAcceptInsecureCerts(true)
    this._capabilities.set('pageLoadStrategy', 'normal')
    return this._capabilities
     
  }
}

export default Firefox
