import { log } from '@nodebug/logger';
import messenger from '../messenger.js';
import config from '@nodebug/config';

const selenium = config('selenium');

/**
 * Visibility delegate for handling element visibility operations
 * 
 * This class encapsulates visibility-related functionality, including scroll,
 * visibility checks, disabled state checks, and hide/unhide operations.
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
   * 
   * @private
   * @param {number} [t] - Custom timeout in milliseconds
   * @returns {Promise<boolean>} True if element is visible
   */
  async _isVisible(t = null) {
    const browser = this.browser;
    let found = false;
    try {
      const locator = await browser._finder(t);
      found = !!locator;
      log.info(`Element is visible.`);
    } catch (err) {
      log.warn(`Element not visible: ${err.message}`);
    } finally {
      browser.stack = [];
    }
    return found;
  }

  /**
   * Checks if an element is not currently in the DOM or not visible.
   * 
   * @private
   * @param {number} [t] - Custom timeout in milliseconds
   * @returns {Promise<boolean>} True if element is not visible
   */
  async _isNotVisible(t = null) {
    const browser = this.browser;
    let found = true;

    const timeout = t ?? (selenium.timeout * 1000);
    const endTime = Date.now() + timeout;
    try {
      while (Date.now() < endTime) {
        await browser._finder(1000);
      }
    } catch {
      log.info(`Element is not visible.`);
      found = false
    } finally {
      browser.stack = [];
    }
    if (found) log.warn(`Element visible: Element found after ${timeout}ms timeout`);
    return !found
  }

  /**
   * Checks if an element is disabled (has the 'disabled' attribute or property).
   * 
   * @private
   * @returns {Promise<boolean>} True if element is disabled
   */
  async #disability(t) {
    const browser = this.browser;
    const locator = await browser._finder(t);
    const isEnabled = await locator.isEnabled();
    const hasDisabledAttr = await locator.getAttribute('disabled');
    const result = !isEnabled || hasDisabledAttr !== null;
    return result;
  }

  /**
   * Checks if an element is enabled. 
   * 
   * takes timeout in milliseconds
   * 
   * @private
   * @returns {Promise<boolean>} True if element is enabled
   */
  async _isEnabled(t) {
    const browser = this.browser;
    let disabled = true;
    const timeout = t ?? (selenium.timeout * 1000);
    const endTime = Date.now() + timeout;
    try {
      while (Date.now() < endTime) {
        disabled = await this.#disability(1000)
        if (!disabled) {
          log.info(`Element is enabled`)
          browser.stack = [];
          return !disabled;
        }
      }
      log.warn(`Element disabled: Element not enabled after ${timeout}ms timeout`);
      return !disabled;
    } catch (err) {
      browser.handleError(err, 'validating element is enabled');
    } finally {
      browser.stack = [];
    }
  }

  /**
   * Checks if an element is disabled. 
   * 
   * takes timeout in milliseconds
   * 
   * @private
   * @returns {Promise<boolean>} True if element is disabled
   */
  async _isDisabled(t) {
    const browser = this.browser;
    let disabled = false;
    const timeout = t ?? (selenium.timeout * 1000);
    const endTime = Date.now() + timeout;
    try {
      while (Date.now() < endTime) {
        disabled = await this.#disability(1000)
        if (disabled) {
          log.info(`Element is disabled`)
          browser.stack = [];
          return disabled;
        }
      }
      log.warn(`Element enabled: Element not disabled after ${timeout}ms timeout`);
      return disabled;
    } catch (err) {
      browser.handleError(err, 'validating element is disabled');
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