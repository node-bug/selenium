import { log } from '@nodebug/logger';
import messenger from '../messenger.js';
import config from '@nodebug/config';

const selenium = config('selenium');

/**
 * Visibility delegate for handling element visibility operations
 * 
 * This class encapsulates all visibility-related functionality that was previously
 * part of the WebBrowser class, including scroll, isVisible, isDisplayed, 
 * isNotDisplayed, isDisabled, hide, and unhide operations.
 * 
 * @class VisibilityDelegate
 */
export class VisibilityDelegate {
  constructor(browser) {
    this.browser = browser;
  }

  /**
   * Scrolls an element into the viewport.
   * 
   * @param {boolean} [alignToTop=true] - If true, top of element aligns to top of viewport.
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('submit').scroll();
   * await browser.element('footer').scroll(false); // Align to bottom
   */
  async scroll(alignToTop = true) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'scroll' });
    
    try {
      const locator = await browser._finder();

      // 'smooth' behavior can be added here if desired for visual debugging
      await browser.driver.executeScript(
        'arguments[0].scrollIntoView({ behavior: "instant", block: arguments[1] ? "start" : "end" });',
        locator,
        alignToTop
      );

      // Optional: Horizontal scroll handling for tables or carousels
      if (alignToTop === 'right') {
        await browser.driver.executeScript('arguments[0].scrollLeft = arguments[0].scrollWidth;', locator);
      }
    } catch (err) {
      browser.handleError(err, 'scrolling into view');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Checks if an element is currently in the DOM and visible.
   * Does not throw an error if not found; returns boolean.
   * 
   * @param {number} [t] - Custom timeout in milliseconds
   * @returns {Promise<boolean>} True if element is visible
   * @example
   * const visible = await browser.element('submit').isVisible();
   * if (visible) {
   *   await browser.element('submit').click();
   * }
   */
  async isVisible(t = null) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'isVisible' });
    let found = false;
    try {
      // Use a shorter default timeout for a simple check
      const locator = await browser._finder(t ?? 2000);
      found = !!locator;
    } catch (err) {
      log.info(`Element not visible: ${err.message}`);
    } finally {
      browser.stack = [];
    }
    return found;
  }

  /**
   * Waits for an element to be visible.
   * Throws an error if the element does not appear within the timeout.
   * 
   * @param {number} [t] - Custom timeout in milliseconds
   * @returns {Promise<boolean>} True if element becomes visible
   * @throws {Error} If element doesn't become visible within timeout
   * @example
   * await browser.element('loading-indicator').isDisplayed();
   * await browser.button('submit').isDisplayed(10000); // 10 second timeout
   */
  async isDisplayed(t = null) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'waitVisibility' });
    try {
      await browser._finder(t);
      log.info('Element is visible on page');
      return true;
    } catch (err) {
      browser.handleError(err, 'waiting for visibility');
    } finally {
      browser.stack = [];
    }
  }

  /**
   * Waits for an element to disappear or become hidden.
   * 
   * @param {number} [t] - Custom timeout in milliseconds
   * @returns {Promise<boolean>} True if element becomes invisible
   * @throws {Error} If element doesn't become invisible within timeout
   * @example
   * await browser.element('loading-spinner').isNotDisplayed();
   * await browser.element('modal').isNotDisplayed(10000); // 10 second timeout
   */
  async isNotDisplayed(t = null) {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'waitInvisibility' });
    const timeout = t ?? (selenium.timeout * 1000);
    const endTime = Date.now() + timeout;

    try {
      while (Date.now() < endTime) {
        try {
          // We check with a very short 500ms timeout per loop
          await browser._finder(500);
        } catch {
          // If _finder throws, the element is gone. Success!
          log.info('Element is no longer visible');
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      throw new Error(`Element still visible after ${timeout}ms`);
    } catch (err) {
      browser.handleError(err, 'waiting for invisibility');
    } finally {
      browser.stack = [];
    }
  }

  /**
   * Checks if an element is disabled (has the 'disabled' attribute or property).
   * 
   * @returns {Promise<boolean>} True if element is disabled
   * @example
   * const disabled = await browser.button('submit').isDisabled();
   * if (!disabled) {
   *   await browser.button('submit').click();
   * }
   */
  async isDisabled() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'isDisabled' });
    try {
      const locator = await browser._finder();
      // Check both the property and the attribute for maximum compatibility
      const isEnabled = await locator.isEnabled();
      const hasDisabledAttr = await locator.getAttribute('disabled');

      const result = !isEnabled || hasDisabledAttr !== null;
      log.info(`Element is ${result ? 'disabled' : 'enabled'}`);
      return result;
    } catch (err) {
      browser.handleError(err, 'checking if disabled');
    } finally {
      browser.stack = [];
    }
  }

  /**
   * Hides all elements matching the current stack by setting opacity to 0.
   * 
   * Useful for testing visibility changes or hiding elements during testing.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('ad').hide();
   * await browser.element('popup').hide();
   */
  async hide() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'hide' });
    try {
      const elements = await browser.findAll();
      log.debug(`Hiding ${elements.length} matching elements.`);

      for (const e of elements) {
        // Automatically handle context switching for each element
        await this.#switchToElementContext(e.frame, async () => {
          await browser.driver.executeScript('arguments[0].style.opacity="0";', e);
        });
      }
    } catch (err) {
      browser.handleError(err, 'hiding elements');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Restores visibility to all elements matching the stack.
   * 
   * Reverts the opacity changes made by the hide() method.
   * 
   * @returns {Promise<boolean>} True if successful
   * @example
   * await browser.element('ad').unhide();
   * await browser.element('popup').unhide();
   */
  async unhide() {
    const browser = this.browser;
    browser.message = messenger({ stack: browser.stack, action: 'unhide' });
    try {
      const elements = await browser.findAll();
      for (const e of elements) {
        await this.#switchToElementContext(e.frame, async () => {
          await browser.driver.executeScript('arguments[0].style.opacity="1";', e);
        });
      }
    } catch (err) {
      browser.handleError(err, 'unhiding elements');
    } finally {
      browser.stack = [];
    }
    return true;
  }

  /**
   * Internal helper to switch to element context (frame).
   * 
   * @private
   * @param {number} frame - Frame index to switch to
   * @param {Function} callback - Callback function to execute in the frame context
   * @returns {Promise<void>}
   */
  async #switchToElementContext(frame, callback) {
    const browser = this.browser;
    await browser.driver.switchTo().defaultContent();
    if (frame >= 0) {
      try {
        await browser.driver.switchTo().frame(frame);
        await callback();
      } catch (err) {
        if (err.name !== 'NoSuchFrameError') throw err;
        log.error(`Frame ${frame} no longer exists.`);
      }
    } else {
      await callback();
    }
  }
}