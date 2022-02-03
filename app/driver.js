const { log } = require('@nodebug/logger')
const { Builder, Capabilities } = require('selenium-webdriver')
const chrome = require('selenium-webdriver/chrome')
const chromedriver = require('chromedriver')
require('geckodriver')
const { resolve } = require('path')
const { existsSync, mkdirSync } = require('fs')

function setHub(grid, grids) {
  if (grid !== null && grid !== undefined) {
    if (grids !== null && grids !== undefined) {
      if (grids[grid] !== undefined) {
        return `${grids[grid]}/wd/hub`
      }
    }
    log.error(
      `Running on locally...\nSpecified remote ${grid}
       is not set in ${JSON.stringify(grids)}.`,
    )
  }
  return undefined
}

function setDownloadsDir(path) {
  const dir = resolve(path)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

function setPreferences(opts) {
  const downloadDir = setDownloadsDir(opts.downloadsPath)
  const prefs = {
    'browser.enable_spellchecking': false,
    'browser.enable_autospellcorrect': false,
    'spellcheck.use_spelling_service': '',
    'spellcheck.dictionary': '',
    'translate.enabled': false,
    'browser.sessionstore.resume_from_crash': false,
    'profile.content_settings.exceptions.automatic_downloads.*.setting': 1,
    credentials_enable_service: false,
    'profile.password_manager_enabled': false,
    'download.prompt_for_download': false,
    'download.default_directory': downloadDir,
  }
  return prefs
}

function setSafariCapabilities(opts) {
  const prefs = setPreferences(opts)
  const options = {
    args: ['--start-maximized', '--disable-infobars', '--disable-gpu'],
    prefs,
  }
  const capabilities = Capabilities.safari()
  capabilities.set('safariOptions', options)
  return capabilities
}

function setFirefoxCapabilities(opts) {
  const prefs = setPreferences(opts)
  const options = {
    args: [],
    prefs,
  }
  if (opts.headless === 'true' || opts.headless === true || opts.h === true) {
    options.args.push('-headless')
  }
  if (opts.incognito === 'true' || opts.incognito === true) {
    options.args.push('-private')
  }
  const capabilities = Capabilities.firefox()
  capabilities.set('moz:firefoxOptions', options)
  return capabilities
}

function setChromeCapabilities(opts) {
  try {
    chrome.setDefaultService(
      new chrome.ServiceBuilder(chromedriver.path).build(),
    )
  } catch (err) {
    log.error(`Error while launching chrome\nError ${err.stack}`)
  }
  const prefs = setPreferences(opts)
  const options = {
    args: [
      'force-device-scale-factor=1',
      'disable-extensions',
      '--disable-gpu',
    ],
    prefs,
    excludeSwitches: ['enable-automation'],
  }
  if (opts.headless === 'true' || opts.headless === true || opts.h === true) {
    options.args.push('headless')
  }
  if (opts.incognito === 'true' || opts.incognito === true) {
    options.args.push('incognito')
  }
  const capabilities = Capabilities.chrome()
  capabilities.set('goog:chromeOptions', options)
  return capabilities
}

function setCapabilities(options) {
  let capabilities
  switch (options.browser.toLowerCase()) {
    case 'ie':
      log.info('IE not implement yet.')
      // capabilities = setIECapabilities(options)
      break
    case 'edge':
      log.info('IE not implement yet.')
      // capabilities = setEdgeCapabilities(options)
      break
    case 'firefox':
      capabilities = setFirefoxCapabilities(options)
      break
    case 'safari':
      capabilities = setSafariCapabilities(options)
      break
    case 'chrome':
    default:
      capabilities = setChromeCapabilities(options)
  }
  capabilities.set('pageLoadStrategy', 'none')
  return capabilities
}

exports.openBrowser = function openBrowser(options) {
  log.info(`Launching ${options.browser}`)

  const builder = new Builder()
  const capabilities = setCapabilities(options)
  const hub = setHub(options.grid, options.grids)

  builder.withCapabilities(capabilities)
  if (hub !== undefined) {
    builder.usingServer(hub)
  }
  return builder.build()
}
