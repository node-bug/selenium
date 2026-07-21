/**
 * Centralized Selenium configuration with safe defaults.
 *
 * This module is the single source of truth for configuration values read from
 * the `selenium` section of the application config (typically `.config/selenium.json`).
 *
 * It merges user-provided values over a set of sane defaults, coerces common
 * JSON mistakes (e.g. `"true"` strings, missing numbers), and validates critical
 * fields so that a malformed or missing `selenium.json` never crashes the browser
 * session at construction time.
 *
 * @module config
 * @example
 * import { selenium } from './app/config.js';
 * console.log(selenium.browser); // always a known browser name
 */
import config from '@nodebug/config';
import { log } from '@nodebug/logger';

/**
 * Default configuration values applied when the user config is missing or partial.
 * @type {Object}
 */
const DEFAULTS = {
  browser: 'chrome',
  headless: true,
  timeout: 10000,
  downloadsPath: './reports/downloads',
  incognito: true,
  height: 768,
  width: 1366,
  hub: null,
  debug: false,
  // Tags to ignore during element traversal, ADDED on top of the library defaults
  // (SCRIPT, STYLE, TEMPLATE, NOSCRIPT). Empty array = no change to defaults.
  ignoredTags: [],
};

/**
 * Browsers that the capabilities factory can launch.
 * @type {string[]}
 */
const KNOWN_BROWSERS = ['chrome', 'firefox', 'safari'];

/**
 * Normalizes a raw configuration object into a fully-populated, type-safe config.
 *
 * @param {Object} [raw] - Raw configuration from the config provider
 * @returns {Object} Normalized configuration with defaults applied
 * @private
 */
function normalize(raw) {
  const cfg = { ...DEFAULTS, ...(raw ?? {}) };

  // Coerce boolean-ish values so consumers don't each re-implement coercion.
  cfg.headless = cfg.headless === true || cfg.headless === 'true';
  cfg.incognito = cfg.incognito === true || cfg.incognito === 'true';
  cfg.debug = cfg.debug === true || cfg.debug === 'true';

  // Coerce timeout to a positive finite number.
  cfg.timeout = Number.isFinite(cfg.timeout) && cfg.timeout > 0 ? cfg.timeout : DEFAULTS.timeout;

  // Validate and normalize the browser name.
  const browser = String(cfg.browser ?? '').toLowerCase();
  if (!KNOWN_BROWSERS.includes(browser)) {
    log.warn(`Unknown browser '${cfg.browser}', falling back to '${DEFAULTS.browser}'`);
    cfg.browser = DEFAULTS.browser;
  } else {
    cfg.browser = browser;
  }

  // Normalize ignoredTags: must be an array; each entry trimmed + uppercased so the
  // config is case-insensitive (mirrors the finder's internal normalizeTagList).
  if (Array.isArray(cfg.ignoredTags)) {
    cfg.ignoredTags = cfg.ignoredTags
      .filter((t) => typeof t === 'string' && t.trim() !== '')
      .map((t) => t.trim().toUpperCase());
  } else {
    cfg.ignoredTags = [];
  }

  return cfg;
}

// Read the user config defensively — a missing/misconfigured provider should not
// crash the module load. Fall back to an empty object so defaults are applied.
let loaded;
try {
  loaded = config('selenium');
} catch (err) {
  log.warn(`selenium config unavailable (${err.message}); using defaults`);
  loaded = {};
}

/** @type {Object} Normalized Selenium configuration */
export const selenium = normalize(loaded);

export default selenium;
