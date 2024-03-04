const config = require('@nodebug/config')('selenium')
const { resolve } = require('path')
const { existsSync, mkdirSync } = require('fs')

function downloadsDirectory() {
  const dir = resolve(config.downloadsPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

const prefs = {
  'browser.enable_spellchecking': false,
  'browser.enable_autospellcorrect': false,
  'browser.sessionstore.resume_from_crash': false,
  credentials_enable_service: false,
  'download.prompt_for_download': false,
  'download.default_directory': downloadsDirectory(),
  'profile.content_settings.exceptions.automatic_downloads.*.setting': 1,
  'profile.password_manager_enabled': false,
  'spellcheck.use_spelling_service': '',
  'spellcheck.dictionary': '',
  'signon.rememberSignons': false,
  'translate.enabled': false,
}

module.exports = {
  prefs,
}
