/**
 * Browser preferences configuration
 * 
 * This module defines default browser preferences for different browsers
 * including download settings, security options, and UI configurations.
 * 
 * @module preferences
 * @property {Object} prefs - Browser preferences configuration
 * @example
 * import prefs from './app/capabilities/preferences.js';
 * console.log(prefs);
 */
import config from '@nodebug/config'
import { resolve } from 'path'
import { existsSync, mkdirSync } from 'fs'

const seleniumConfig = config('selenium')

/**
 * Ensures the download directory exists and returns the absolute path.
 * 
 * @returns {string} Absolute path to the download directory
 * @example
 * const dir = downloadsDirectory();
 * console.log(dir);
 */
function downloadsDirectory() {
  const dir = resolve(seleniumConfig.downloadsPath || './downloads')
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }
  return dir
}

const downloadPath = downloadsDirectory()

/**
 * Browser preferences configuration
 * 
 * @type {Object}
 * @property {string} download.default_directory - Directory for downloads (Chrome/Edge)
 * @property {boolean} download.prompt_for_download - Whether to prompt for downloads
 * @property {boolean} download.directory_upgrade - Whether to upgrade download directory
 * @property {number} profile.content_settings.exceptions.automatic_downloads.*.setting - Automatic download setting
 * @property {boolean} profile.password_manager_enabled - Whether password manager is enabled
 * @property {boolean} credentials_enable_service - Whether credentials service is enabled
 * @property {boolean} autofill.profile_enabled - Whether autofill is enabled
 * @property {boolean} translate.enabled - Whether translation is enabled
 * @property {string} browser.download.dir - Directory for downloads (Firefox)
 * @property {number} browser.download.folderList - Folder list setting (Firefox)
 * @property {boolean} browser.download.manager.showWhenStarting - Show download manager
 * @property {string} browser.helperApps.neverAsk.saveToDisk - File types to save without asking
 * @property {boolean} pdfjs.disabled - Whether PDFJS is disabled
 * @property {boolean} signon.rememberSignons - Whether to remember signons
 * @property {boolean} browser.sessionstore.resume_from_crash - Resume from crash
 * @property {boolean} browser.enable_spellchecking - Whether spell checking is enabled
 * @property {boolean} browser.enable_autospellcorrect - Whether auto spell correction is enabled
 */
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
