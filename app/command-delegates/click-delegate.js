import messenger from '../messenger.js';
import { BaseDelegate } from './base-delegate.js';

/**
 * Click delegate class for handling element click operations
 * 
 * This class encapsulates all click-related functionality including:
 * - Standard clicks
 * - Double-clicks
 * - Right-clicks (context clicks)
 * - Middle-clicks
 * - Triple-clicks
 * - Multiple times clicks
 * - Clicks with modifier keys
 * - Coordinate-based clicks
 * - Internal click handling with fallbacks
 */
export class ClickDelegate extends BaseDelegate {
  /**
   * Performs a click on an element.
   * 
   * Clicks on an element at its center or at specified coordinates.
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
    const modifiers = this.getModifiers();
    browser.message = messenger({ stack: browser.stack, action: 'click', x, y, modifiers });
    try {
      const locator = await browser._finder();
      await browser._clicker(locator, x, y);
    } catch (err) {
      browser.handleError(err, 'clicking');
    } finally {
      this.resetModifiers();
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
    return this.withErrorHandling('doubleclick', async () => {
      const locator = await this.findElement();
      await this.browser.actions().doubleClick(locator).perform();
    }, { errorMessage: 'double clicking' });
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
    return this.withErrorHandling('rightclick', async () => {
      const locator = await this.findElement();
      await this.browser.actions().contextClick(locator).perform();
    }, { errorMessage: 'right clicking' });
  }

  /**
   * Performs a middle-click on the element.
   * 
   * Uses JavaScript to simulate a middle-click (auxclick event with button=1).
   * Selenium WebDriver Actions API does not have native middle-click support.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('middle-click-target').middleClick();
   * await browser.button('tab').middleClick();
   */
  async middleClick() {
    return this.withErrorHandling('middleclick', async () => {
      const locator = await this.findElement();
      await this.browser.driver.executeScript(`
        const event = new MouseEvent('auxclick', {
          bubbles: true,
          cancelable: true,
          button: 1
        });
        arguments[0].dispatchEvent(event);
      `, locator);
    }, { errorMessage: 'middle clicking' });
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
    return this.withErrorHandling('tripleclick', async () => {
      const locator = await this.findElement();
      await this.browser.actions().click(locator).click(locator).click(locator).perform();
    }, { errorMessage: 'triple clicking' });
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
      const actions = browser.actions();
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
   * Internal click handler for elements.
   * 
   * Handles both standard clicks and coordinate-based clicks.
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
      await e.click();
      return true;
    }

    const platformName = await this.getPlatformName();

    // Use Actions API for modifier keys or coordinate clicks
    try {
      const actions = browser.actions();
      await this.pressModifiers(actions, platformName);

      if (hasCoordinates) {
        const parsedX = parseInt(x, 10);
        const parsedY = parseInt(y, 10);
        if (isNaN(parsedX) || isNaN(parsedY)) {
          throw new Error(
            `Invalid click coordinate: ${isNaN(parsedX) ? `x (${x})` : ''}${
              isNaN(parsedX) && isNaN(parsedY) ? ' and ' : ''
            }${isNaN(parsedY) ? `y (${y})` : ''} is NaN. Provide numeric coordinates.`
          );
        }

        const rect = await e.getRect();
        if (parsedX >= rect.width || parsedY >= rect.height) {
          throw new Error(`Click out of bounds: target x:${parsedX} y:${parsedY}, element size ${rect.width}x${rect.height}`);
        }
        const offsetX = parsedX;
        const offsetY = parsedY;

        // Our API expresses coordinates relative to the element's TOP-LEFT
        // (matching rect.x/rect.y and Playwright's position option). Selenium's
        // move() origin is the element's CENTER, so convert the top-left offset
        // to a center-relative offset. Using the element as origin also
        // auto-scrolls it into view, avoiding MoveTargetOutOfBoundsError that
        // would occur with viewport-absolute coordinates from getRect().
        const cx = offsetX - rect.width / 2;
        const cy = offsetY - rect.height / 2;

        actions
          .move({ origin: e, x: Math.ceil(cx), y: Math.ceil(cy) })
          .pause(500)
          .click();
      } else {
        actions.click(e);
      }
      await actions.perform();
    } finally {
      const actions = browser.actions();
      await this.releaseModifiers(actions, platformName);
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
    return this.withErrorHandling('hover', async () => {
      const locator = await this.findElement();
      await this.browser.actions().move({ origin: locator }).perform();
    }, { errorMessage: 'hovering' });
  }
}