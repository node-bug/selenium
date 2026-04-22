import config from '@nodebug/config'
import Chrome from './chrome.js'
import Firefox from './firefox.js'
import Safari from './safari.js'

const selenium = config('selenium')

function capabilities(configuration = selenium) {
  switch (configuration.browser.toLowerCase()) {
    case 'firefox':
      return new Firefox().capabilities

    case 'chrome':
      return new Chrome().capabilities

    case 'safari':
      return new Safari().capabilities

    default:
      return new Error(`${configuration.browser} is not a known platform name. \
              Known platforms are 'Firefox', 'Safari' and 'Chrome'`)
  }
}

export default capabilities
