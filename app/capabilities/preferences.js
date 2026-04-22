import config from '@nodebug/config'
import { resolve } from 'path'
import { existsSync, mkdirSync } from 'fs'

const seleniumConfig = config('selenium')

/**
 * Ensures the download directory exists and returns the absolute path.
 */
function downloadsDirectory() {
  const dir = resolve(seleniumConfig.downloadsPath || './downloads')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

const downloadPath = downloadsDirectory()

const prefs = {
  // --- Chromium Specific (Chrome / Edge) ---
  'download.default_directory': downloadPath,
  'download.prompt_for_download': false,
  'download.directory_upgrade': true,
  'profile.content_settings.exceptions.automatic_downloads.*.setting': 1,
  'profile.password_manager_enabled': false,
  'credentials_enable_service': false,
  'autofill.profile_enabled': false,
  'translate.enabled': false,

  // --- Gecko Specific (Firefox) ---
  'browser.download.dir': downloadPath,
  'browser.download.folderList': 2, 
  'browser.download.manager.showWhenStarting': false,
  'browser.helperApps.neverAsk.saveToDisk': 'application/octet-stream,application/pdf,application/zip,text/csv',
  'pdfjs.disabled': true,
  'signon.rememberSignons': false,
  'browser.sessionstore.resume_from_crash': false,

  // --- General UI ---
  'browser.enable_spellchecking': false,
  'browser.enable_autospellcorrect': false,
}

export default prefs
