import { log } from '@nodebug/logger'
import Browser from './app/browser/index.js'
// import { Key } from 'selenium-webdriver'
// import config from '@nodebug/config'('selenium')
// import ElementLocator from './app/browser/elements.js'
// import messenger from './app/messenger.js'
// import Alert from './app/browser/alerts.js'

class WebBrowser extends Browser {
  constructor() {
    super()
    this.stack = []
    // this.elementlocator = new ElementLocator()
    // this.alert = new Alert()
  }

  get message() {
    return this._message
  }

  set message(value) {
    this._message = value
  }

  async start() {
    try {
      const { sessionId } = this.driver
      await this.close()
      log.info(`Deleted existing session linked to this test run ${sessionId}`)
    } catch (err) {
      if (
        ![
          "Cannot read properties of undefined (reading 'getSession')",
          "Cannot read properties of undefined (reading 'sessionId')",
          "Cannot destructure property 'sessionId' of 'this.driver' as it is undefined.",
        ].includes(err.message)
      ) {
        log.error(
          `Unrecognized error while deleting existing sessions : ${err.message}`,
        )
      }
    }
    await super.new()
    // this.elementlocator.driver = this.driver
    // this.window.driver = this.driver
    // this.alert.driver = this.driver
  }
}

export default WebBrowser
