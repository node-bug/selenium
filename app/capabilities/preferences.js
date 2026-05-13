/**
 * Shared download path utility
 * 
 * This module provides a shared download directory path used by Chrome and Firefox.
 * Browser-specific preferences are defined in their respective capability files.
 * 
 * @module preferences
 * @property {string} downloadPath - Absolute path to the download directory
 * @example
 * import { downloadPath } from './app/capabilities/preferences.js';
 * console.log(downloadPath);
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

export const downloadPath = downloadsDirectory()
