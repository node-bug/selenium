import { Capabilities } from 'selenium-webdriver'
// import config from '@nodebug/config'
// const selenium = config('selenium')

class Safari {
  get capabilities() {
    const options = {}

    this._capabilities = Capabilities.safari()
    this._capabilities.set('safari:options', options)
    this._capabilities.set('browserName', 'safari')
    this._capabilities.set('pageLoadStrategy', 'normal')
    
    return this._capabilities
     
  }
}

export default Safari
