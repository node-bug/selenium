import { Key } from 'selenium-webdriver';
import messenger from '../messenger.js';

/**
 * Base delegate class providing common functionality for all delegates.
 * 
 * Consolidates shared patterns:
 * - Error handling with try-catch-finally
 * - Platform name detection
 * - Modifier key handling
 * - Stack management
 */
export class BaseDelegate {
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Executes an async operation with standardized error handling.
   * 
   * @param {string} action - The action name for messaging
   * @param {Function} operation - The async operation to execute
   * @param {Object} [options={}] - Options object
   * @param {Object} [options.messageData={}] - Additional data for the messenger
   * @param {string} [options.errorMessage] - Custom error message (defaults to action)
   * @returns {Promise<boolean>} True if successful
   */
  async withErrorHandling(action, operation, options = {}) {
    const browser = this.browser;
    const { messageData = {}, errorMessage } = options;
    browser.message = messenger({ stack: browser.stack, action, ...messageData });
    try {
      await operation();
    } catch (err) {
      browser.handleError(err, errorMessage || action);
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Gets the normalized platform name from browser capabilities.
   * 
   * @returns {Promise<string>} Platform name with spaces removed (e.g., 'mac', 'windows')
   */
  async getPlatformName() {
    const browser = this.browser;
    return (await browser.driver.getCapabilities()).get('platformName').replace(/\s/g, '');
  }

  /**
   * Builds a modifiers array from browser._tempMods.
   * 
   * @returns {string[]} Array of active modifier names
   */
  getModifiers() {
    const mods = this.browser._tempMods;
    const modifiers = [];
    if (mods.control) modifiers.push('ctrl');
    if (mods.shift) modifiers.push('shift');
    if (mods.alt) modifiers.push('alt');
    if (mods.meta) modifiers.push('meta');
    return modifiers;
  }

  /**
   * Checks if any modifier keys are active.
   * 
   * @returns {boolean} True if any modifier is pressed
   */
  hasModifiers() {
    const mods = this.browser._tempMods;
    return mods.control || mods.shift || mods.alt || mods.meta;
  }

  /**
   * Presses modifier keys using Actions API.
   * 
   * @param {Object} actions - Selenium Actions instance
   * @param {string} [platformName] - Optional platform name (fetched if not provided)
   */
  async pressModifiers(actions, platformName) {
    const browser = this.browser;
    const mods = browser._tempMods;
    const platform = platformName || await this.getPlatformName();

    if (mods.control) actions.keyDown(Key.CONTROL);
    if (mods.shift) actions.keyDown(Key.SHIFT);
    if (mods.alt) actions.keyDown(Key.ALT);
    if (mods.meta) {
      if (platform === 'mac') actions.keyDown(Key.COMMAND);
      else actions.keyDown(Key.META);
    }
  }

  /**
   * Releases modifier keys using Actions API.
   * 
   * @param {Object} actions - Selenium Actions instance
   * @param {string} [platformName] - Optional platform name (fetched if not provided)
   */
  async releaseModifiers(actions, platformName) {
    const browser = this.browser;
    const mods = browser._tempMods;
    const platform = platformName || await this.getPlatformName();

    if (mods.meta) {
      if (platform === 'mac') actions.keyUp(Key.COMMAND);
      else actions.keyUp(Key.META);
    }
    if (mods.alt) actions.keyUp(Key.ALT);
    if (mods.shift) actions.keyUp(Key.SHIFT);
    if (mods.control) actions.keyUp(Key.CONTROL);
  }

  /**
   * Executes an operation with modifier keys held down.
   * Automatically releases modifiers after completion.
   * 
   * @param {Function} operation - Async function that receives the actions instance
   * @returns {Promise<void>}
   */
  async withModifiers(operation) {
    const browser = this.browser;
    const platformName = await this.getPlatformName();
    const actions = browser.actions();

    await this.pressModifiers(actions, platformName);
    await operation(actions);
    await actions.perform();

    const releaseActions = browser.actions();
    await this.releaseModifiers(releaseActions, platformName);
    await releaseActions.perform();
  }

  /**
   * Resets temporary modifiers on the browser instance.
   */
  resetModifiers() {
    this.browser._resetMods();
  }

  /**
   * Finds an element using the browser's finder.
   * 
   * @returns {Promise<Object>} The located WebElement
   */
  async findElement() {
    return await this.browser._finder();
  }
}