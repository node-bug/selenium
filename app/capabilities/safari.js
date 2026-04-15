import { Capabilities } from 'selenium-webdriver'
import config from '@nodebug/config'
const selenium = config('selenium')

class Safari {
  get capabilities() {
    const options = {}

    this._capabilities = Capabilities.safari()
    this._capabilities.set('safari:options', options)
    this._capabilities.set('browserName', 'safari')
    this._capabilities.set('pageLoadStrategy', 'normal')
    
    // Handle headless mode if needed
    if (selenium.headless === 'true' || selenium.headless === true) {
      // Safari doesn't support headless mode in the same way as Chrome/Firefox
      // This is just a placeholder for consistency
      console.warn('Safari does not support headless mode')
    }
    
    return this._capabilities
     
  }
}

export default Safari
