/**
 * Chrome capabilities configuration class
 * 
 * This class provides Chrome-specific browser capabilities for Selenium WebDriver.
 * It configures Chrome options including headless mode, incognito mode, and various
 * performance and security settings.
 * 
 * @class Chrome
 */
import { Capabilities } from 'selenium-webdriver';
import { Options } from 'selenium-webdriver/chrome.js'
import config from '@nodebug/config'
import { downloadPath } from './preferences.js'

const selenium = config('selenium')

class Chrome {
  /**
   * Get Chrome browser capabilities
   * 
   * Configures Chrome with performance and security optimizations:
   * - Disables extensions, GPU, notifications, and the automation indicator
   * - Sets headless mode if `selenium.headless` is enabled in config
   * - Sets incognito mode if `selenium.incognito` is enabled in config
   * - Applies Chrome-specific preferences (downloads, security, UI)
   * 
   * @returns {Object} Chrome browser capabilities configuration
   */
  get capabilities() {
    const options = new Options()

    // Add Chrome command-line flags (Arguments)
    options.addArguments([
      '--force-device-scale-factor=1',
      '--disable-extensions',
      '--disable-gpu',
      '--disable-notifications',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
      '--no-first-run',
      '--password-store=basic',
      '--disable-search-engine-choice-screen',
      '--disable-features=SafeBrowsingCheckEveryUrl,SafeBrowsingPasswordCheck',
      '--disable-safebrowsing-aggressive-on-focus',
      '--disable-background-networking',
      '--disable-sync',
      '--disable-default-apps'
    ])

    // Exclude automation switch to avoid detection
    options.excludeSwitches(['enable-automation'])

    // Apply Chrome-specific preferences (User Prefs)
    options.setUserPreferences({
      // Downloads
      'download.default_directory': downloadPath,
      'download.prompt_for_download': false,
      'download.directory_upgrade': true,
      'profile.content_settings.exceptions.automatic_downloads.*.setting': 1,

      // Password & credentials (silences "Change Password" popups)
      'credentials_enable_service': false,
      'profile.password_manager_enabled': false,
      'password_manager_enable_autofill': false,
      'password_manager_bubble_enabled': false,

      // Security & Performance
      'safebrowsing.enabled': false, // Disables background security checks for speed
      'browser.check_default_action': 0,
      'browser.default_popups_setting': 0,
      'browser.show_first_run_ui': false,
      'browser.enable_webrtc_privacy_indicator': false,

      // Autofill
      'autofill.profile_enabled': false,
      'autofill.address_enabled': false,
      'autofill.credit_card_enabled': false,
      'autofill.merchant_data_collection_enabled': false,

      // Translation & Metrics
      'translate.enabled': false,
      'metrics.reporting_enabled': false,
      'metrics.client_metrics_opt_in_status': 0,

      // Notifications & permissions (2 = Block)
      'profile.default_content_setting_values.notifications': 2,
      'profile.default_content_setting_values.geolocation': 2,
      'profile.default_content_setting_values.midi_sysex': 2,
      'profile.default_content_setting_values.popups': 2,

      // Spell checking
      'browser.enable_spellchecking': false,
      'browser.enable_autospellcorrect': false,
    })

    // Enable headless mode if configured
    if (String(selenium.headless) === 'true') {
      options.addArguments('--headless=new')
    }

    // Enable incognito (private browsing) mode if configured
    if (String(selenium.incognito) === 'true') {
      options.addArguments('--incognito')
    }

    // 1. Start with a standard Chrome capabilities object
    const caps = Capabilities.chrome();

    // 2. Merge the Options into the Capabilities object
    // This correctly populates 'goog:chromeOptions' under the hood
    caps.merge(options);

    // 3. Set additional top-level WebDriver capabilities
    caps.set('pageLoadStrategy', 'normal');

    return caps;
  }
}

export default Chrome