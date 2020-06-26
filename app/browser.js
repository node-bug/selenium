const { log } = require('@nodebug/logger')
const { Builder, Capabilities } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const chromedriver = require('chromedriver')
require('geckodriver')

const config = require('@nodebug/config')('selenium')
const { resolve } = require('path')
const { existsSync, mkdirSync } = require('fs')

const downloadDir = (() => {
  const dir = resolve(config.downloadsPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
})()

const prefs = {
  'profile.content_settings.exceptions.automatic_downloads.*.setting': 1,
  'download.prompt_for_download': false,
  'download.default_directory': downloadDir,
}

const hub = (() => {
  if (config.hub !== null && config.hub !== undefined) {
    if (config.hubs !== null && config.hubs !== undefined) {
      if (config.hubs[config.hub] !== undefined) {
        return `${config.hubs[config.hub]}/wd/hub`
      }
    }
    log.error(
      `Running on locally...\nSpecified remote ${
        config.hub
      } is not set in ${JSON.stringify(config.hubs)}.`,
    )
  }
  return undefined
})()

function Browser() {
  let capabilities
  let options
  const builder = new Builder()

  log.info(`Launching ${config.browser}`)
  switch (config.browser.toLowerCase()) {
    case 'firefox':
      options = {
        args: [],
        prefs,
      }
      if (config.headless === true || config.h === true) {
        options.args.push('-headless')
      }
      if (config.incognito === true) {
        options.args.push('-private')
      }
      capabilities = Capabilities.firefox()
      capabilities.set('moz:firefoxOptions', options)
      break

    case 'safari':
      options = {
        args: ['--start-maximized', '--disable-infobars'],
        prefs,
      }
      capabilities = Capabilities.safari()
      capabilities.set('safariOptions', options)
      break

    case 'ie':
      log.info('IE not implement yet.')
      break
    case 'edge':
      log.info('Edge not implement yet.')
      break

    case 'chrome':
    default:
      chrome.setDefaultService(
        new chrome.ServiceBuilder(chromedriver.path).build(),
      )
      options = {
        args: ['force-device-scale-factor=1', 'disable-extensions'],
        prefs,
        excludeSwitches: ['enable-automation'],
      }
      if (config.headless === true || config.h === true) {
        options.args.push('headless')
      }
      if (config.incognito === true) {
        options.args.push('incognito')
      }
      capabilities = Capabilities.chrome()
      capabilities.set('goog:chromeOptions', options)
  }

  capabilities.set('pageLoadStrategy', 'normal')
  builder.withCapabilities(capabilities)

  if (hub !== undefined) {
    builder.usingServer(hub)
  }

  return builder.build()
}

module.exports = Browser
