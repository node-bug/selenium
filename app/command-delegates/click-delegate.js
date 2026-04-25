import { Key } from 'selenium-webdriver';
import messenger from '../messenger.js';
import { log } from '@nodebug/logger'

/**
 * Click delegate class for handling element click operations
 * 
 * This class encapsulates all click-related functionality including:
 * - Standard clicks
 * - Double-clicks
 * - Right-clicks (context clicks)
 * - Middle-clicks
 * - Triple-clicks
 * - Long press clicks
 * - Multiple times clicks
 * - Clicks with modifier keys
 * - Coordinate-based clicks
 * - Internal click handling with fallbacks
 */
export class ClickDelegate {
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Performs a click on an element.
   * 
   * Clicks on an element at its center or at specified coordinates.
   * Falls back to JavaScript click if Selenium click fails.
   *
   * Supports modifier keys via chaining: `browser.button('link').ctrl.click()`.
   * Modifiers (ctrl, shift, alt, meta) are read from `browser._tempMods` and
   * released automatically after the click.
   *
   * @param {number} [x] - X coordinate for click (optional)
   * @param {number} [y] - Y coordinate for click (optional)
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.button('submit').click();
   * await browser.element('menu').click(10, 20); // Click at coordinates
   * await browser.button('link').ctrl.click(); // Ctrl+click (open in new tab)
   * await browser.element('item').shift.alt.click(); // Shift+Alt+click
   * await browser.element('canvas').ctrl.click(10, 20); // Ctrl+click at coordinates
   */
  async click(x = null, y = null) {
    const browser = this.browser;
    const mods = browser._tempMods;
    const modifiers = [];
    if (mods.control) modifiers.push('ctrl');
    if (mods.shift) modifiers.push('shift');
    if (mods.alt) modifiers.push('alt');
    if (mods.meta) modifiers.push('meta');
    browser.message = messenger({ stack: browser.stack, action: 'click', x, y, modifiers });
    try {
      const locator = await browser._finder();
      await browser._clicker(locator, x, y);
    } catch (err) {
      browser.handleError(err, 'clicking');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Performs a double-click on the element.
   * 
   * Uses Selenium WebDriver Actions API to simulate a double-click.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('text').doubleClick();
   * await browser.button('edit').doubleClick();
   */
  async doubleClick() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'doubleclick' });
    try {
      const locator = await browser._finder();
      // Actions API is required for true double-click simulation
      await browser.actions().doubleClick(locator).perform();
    } catch (err) {
      browser.handleError(err, 'double clicking');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Performs a right-click (context click) on the element.
   * 
   * Uses Selenium WebDriver Actions API to simulate a right-click.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('context-menu').rightClick();
   * await browser.button('options').rightClick();
   */
  async rightClick() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'rightclick' });
    try {
      const locator = await browser._finder();
      // contextClick is the Selenium equivalent of a right-click
      await browser.actions().contextClick(locator).perform();
    } catch (err) {
      browser.handleError(err, 'right clicking');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Performs a middle-click on the element.
   * 
   * Uses Selenium WebDriver Actions API to simulate a middle-click.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('middle-click-target').middleClick();
   * await browser.button('tab').middleClick();
   */
  async middleClick() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'middleclick' });
    try {
      const locator = await browser._finder();
      // middleClick is the Selenium equivalent of a middle-click
      await browser.actions().middleClick(locator).perform();
    } catch (err) {
      browser.handleError(err, 'middle clicking');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Performs a triple-click on the element.
   * 
   * Simulates a triple-click by performing three individual clicks.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('text').tripleClick();
   * await browser.button('select').tripleClick();
   */
  async tripleClick() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'tripleclick' });
    try {
      const locator = await browser._finder();
      // Simulate triple-click by performing three individual clicks
      await browser.actions().click(locator).click(locator).click(locator).perform();
    } catch (err) {
      browser.handleError(err, 'triple clicking');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Performs multiple clicks on the element.
   * 
   * Clicks on an element a specified number of times.
   * 
   * @param {number} times - Number of times to click (default: 2)
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('button').multipleClick(3); // Click 3 times
   * await browser.button('repeat').multipleClick(5); // Click 5 times
   */
  async multipleClick(times = 2) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'click', times });
    try {
      const locator = await browser._finder();
      const actions = browser.actions()
      // Perform multiple clicks
      for (let i = 0; i < times; i++) {
        actions.click(locator);
      }
      await actions.perform();
    } catch (err) {
      browser.handleError(err, 'clicking multiple times');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Performs a long press click on the element.
   * 
   * Uses Selenium WebDriver Actions API to simulate a long press.
   * 
   * @param {number} [duration=1000] - Duration of the long press in milliseconds
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('long-press-target').longPress(); // Default 1000ms
   * await browser.button('menu').longPress(2000); // 2 seconds
   */
  async longPress(duration = 1000) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'longpress' });
    try {
      const locator = await browser._finder();
      // longPress is the Selenium equivalent of a long press
      await browser.actions().clickAndHold(locator).pause(duration).release().perform();
    } catch (err) {
      browser.handleError(err, 'long pressing');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Internal click handler for elements.
   * 
   * Handles both standard clicks and coordinate-based clicks.
   * Falls back to JavaScript click if Selenium click fails.
   * 
   * @private
   * @param {Object} e - WebElement to click
   * @param {number} [x] - X coordinate (optional)
   * @param {number} [y] - Y coordinate (optional)
   * @returns {Promise<void>}
   */
  async _clicker(e, x, y) {
    const browser = this.browser;
    const mods = browser._tempMods;
    const hasCoordinates = (x !== null && x !== undefined) && (y !== null && y !== undefined);

    // If no modifiers and no coordinates, use simple click
    const hasMods = mods.control || mods.shift || mods.alt || mods.meta;
    if (!hasMods && !hasCoordinates) {
      try {
        await e.click();
      } catch (err) {
        // Fallback to JS click if element is blocked or not interactable
        if (['ElementNotInteractableError', 'ElementClickInterceptedError'].includes(err.name)) {
          await browser.driver.executeScript('arguments[0].click();', e);
          log.warn(`Due to "${err.name}" error, javascript click was used to click.`)
          return true;
        } else {
          throw err;
        }
      }
      return true;
    }

    const platformName = (await browser.driver.getCapabilities()).get('platformName').replace(/\s/g, '')

    // Use Actions API for modifier keys or coordinate clicks
    try {
      const actions = browser.actions();

      // Press modifier keys
      if (mods.control) actions.keyDown(Key.CONTROL);
      if (mods.shift) actions.keyDown(Key.SHIFT);
      if (mods.alt) actions.keyDown(Key.ALT);
      if (mods.meta) if (platformName === 'mac') actions.keyDown(Key.COMMAND); else actions.keyDown(Key.META);

      if (hasCoordinates) {
        const rect = await e.getRect();
        if (x >= rect.width || y >= rect.height) {
          throw new Error(`Click out of bounds: target x:${x} y:${y}, element size ${rect.width}x${rect.height}`);
        }
        const ex = rect.x + isNaN(parseInt(x, 10)) ? 0 : parseInt(x, 10);
        const ey = rect.y + isNaN(parseInt(y, 10)) ? 0 : parseInt(y, 10);

        actions
          .move({ x: Math.ceil(ex), y: Math.ceil(ey) })
          .pause(500)
          .click();

      } else {
        actions.click(e);
      }

      await actions.perform();
    } finally {
      const actions = browser.actions();
      // Release modifier keys
      if (mods.meta) if (platformName === 'mac') actions.keyUp(Key.COMMAND); else actions.keyUp(Key.META);
      if (mods.alt) actions.keyUp(Key.ALT);
      if (mods.shift) actions.keyUp(Key.SHIFT);
      if (mods.control) actions.keyUp(Key.CONTROL);
      await actions.perform();
    }
  }

  /**
   * Hovers the mouse over an element.
   * 
   * Moves the mouse cursor to the center of the element to trigger hover states.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('menu').hover();
   * await browser.button('dropdown').hover();
   */
  async hover() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'hover' });
    try {
      const locator = await browser._finder();
      // Move mouse to the center of the element
      await browser.actions().move({ origin: locator }).perform();
    } catch (err) {
      browser.handleError(err, 'hovering');
    } finally {
      browser.stack = [];
    }
    return true;
  }
}