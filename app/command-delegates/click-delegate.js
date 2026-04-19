import messenger from '../messenger.js';

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
   * @param {number} [x] - X coordinate for click (optional)
   * @param {number} [y] - Y coordinate for click (optional)
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.button('submit').click();
   * await browser.element('menu').click(10, 20); // Click at coordinates
   */
  async click(x = null, y = null) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'click', x, y });
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
      await browser.actions().click(locator).perform();
      await browser.actions().click(locator).perform();
      await browser.actions().click(locator).perform();
    } catch (err) {
      browser.handleError(err, 'triple clicking');
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
   * Performs multiple clicks on the element.
   * 
   * Clicks on an element a specified number of times.
   * 
   * @param {number} times - Number of times to click (default: 2)
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('button').clickMultiple(3); // Click 3 times
   * await browser.button('repeat').clickMultiple(5); // Click 5 times
   */
  async multipleClick(times = 2) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'click', times });
    try {
      const locator = await browser._finder();
      // Perform multiple clicks
      for (let i = 0; i < times; i++) {
        await browser.actions().click(locator).perform();
      }
    } catch (err) {
      browser.handleError(err, 'clicking multiple times');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Performs a click with modifier keys.
   * 
   * Uses Selenium WebDriver Actions API to simulate a click with modifier keys.
   * 
   * @param {Object} [options] - Options for the click
   * @param {boolean} [options.shift=false] - Whether to hold shift key
   * @param {boolean} [options.ctrl=false] - Whether to hold control key
   * @param {boolean} [options.alt=false] - Whether to hold alt key
   * @param {boolean} [options.meta=false] - Whether to hold meta key
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('link').clickWithModifier({ ctrl: true }); // Ctrl+click
   * await browser.button('select').clickWithModifier({ shift: true, alt: true }); // Shift+Alt+click
   */
  async clickWithModifier(options = {}) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'click', options });
    try {
      const locator = await browser._finder();
      const actions = browser.actions();
      
      // Add modifier keys if specified
      if (options.shift) actions.keyDown('SHIFT');
      if (options.ctrl) actions.keyDown('CONTROL');
      if (options.alt) actions.keyDown('ALT');
      if (options.meta) actions.keyDown('META');
      
      // Perform the click
      actions.click(locator);
      
      // Release modifier keys
      if (options.meta) actions.keyUp('META');
      if (options.alt) actions.keyUp('ALT');
      if (options.ctrl) actions.keyUp('CONTROL');
      if (options.shift) actions.keyUp('SHIFT');
      
      await actions.perform();
    } catch (err) {
      browser.handleError(err, 'clicking with modifier keys');
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
    const hasCoordinates = (x !== null && x !== undefined) && (y !== null && y !== undefined);

    if (hasCoordinates) {
      const rect = await e.getRect();
      if (x >= rect.width || y >= rect.height) {
        throw new Error(`Click out of bounds: target x:${x} y:${y}, element size ${rect.width}x${rect.height}`);
      }
      const ex = rect.x + isNaN(parseInt(x, 10)) ? 0 : parseInt(x, 10);
      const ey = rect.y + isNaN(parseInt(y, 10)) ? 0 : parseInt(y, 10);

      await browser.actions()
        .move({ x: Math.ceil(ex), y: Math.ceil(ey) })
        .pause(500) // Reduced from 1000 for speed
        .click()
        .perform();
    } else {
      try {
        await e.click();
      } catch (err) {
        // Fallback to JS click if element is blocked or not interactable
        if (['ElementNotInteractableError', 'ElementClickInterceptedError'].includes(err.name)) {
          await browser.driver.executeScript('arguments[0].click();', e);
        } else {
          throw err;
        }
      }
    }
  }
}