const desiredConfig = require('@nodebug/config')('selenium')
const Chrome = require('./chrome')
const Firefox = require('./firefox')
const Safari = require('./safari')

function capabilities(config = desiredConfig) {
  switch (config.browser.toLowerCase()) {
    case 'firefox':
      return new Firefox().capabilities

    case 'chrome':
      return new Chrome().capabilities

    case 'safari':
      return new Safari().capabilities

    default:
      return new Error(`${config.browser} is not a known platform name. \
              Known platforms are 'Firefox', 'Safari' and 'Chrome'`)
  }
}

module.exports = capabilities
