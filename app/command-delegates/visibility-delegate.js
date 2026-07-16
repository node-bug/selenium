import { log } from '@nodebug/logger';
import messenger from '../messenger.js';
import { BaseDelegate } from './base-delegate.js';
import { selenium } from '../config.js';

/**
 * Visibility delegate for handling element visibility operations
 * 
 * This class encapsulates visibility-related functionality, including scroll,
 * visibility checks, disabled state checks, and hide/unhide operations.
 * 
 * @class VisibilityDelegate
 */
export class VisibilityDelegate extends BaseDelegate {
  constructor(browser) {
    super(browser);
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

    const timeout = t ?? selenium.timeout;
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
   * @param {number} [t] - Custom timeout in milliseconds
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
   * @private
   * @param {number} [t] - Custom timeout in milliseconds
   * @returns {Promise<boolean>} True if element is enabled
   */
  async _isEnabled(t) {
    const browser = this.browser;
    let disabled = true;
    const timeout = t ?? selenium.timeout;
    const endTime = Date.now() + timeout;
    try {
      while (Date.now() < endTime) {
        try {
          disabled = await this.#disability(1000);
        } catch {
          // Element not present yet (or not locatable) — keep retrying until the
          // full timeout instead of letting the error escape the loop.
          disabled = true;
          continue;
        }
        if (!disabled) {
          log.info(`Element is enabled`);
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
   * @private
   * @param {number} [t] - Custom timeout in milliseconds
   * @returns {Promise<boolean>} True if element is disabled
   */
  async _isDisabled(t) {
    const browser = this.browser;
    let disabled = false;
    const timeout = t ?? selenium.timeout;
    const endTime = Date.now() + timeout;
    try {
      while (Date.now() < endTime) {
        try {
          disabled = await this.#disability(1000);
        } catch {
          // Element not present yet (or not locatable) — keep retrying until the
          // full timeout instead of letting the error escape the loop.
          disabled = false;
          continue;
        }
        if (disabled) {
          log.info(`Element is disabled`);
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
   * Get the scroll accessor object.
   *
   * Provides methods to scroll elements to specific positions.
   * Only works in element context (when stack has elements).
   *
   * @type {Object}
   * @returns {Object} Object containing scroll accessor methods
   * @example
   * // Element scrolling
   * await browser.element('scrollable-div').scroll.to.top();
   * await browser.element('scrollable-div').scroll.to.bottom();
   * await browser.element('scrollable-div').scroll.to.left();
   * await browser.element('scrollable-div').scroll.to.right();
   * await browser.element('target').scroll.into.view();
   */
  get scroll() {
    const self = this;
    return {
      /**
       * Scroll the element to specific positions.
       */
      to: {
        /**
         * Scroll the element to the top (scrollTop = 0).
         * @returns {Promise<boolean>} True if successful
         * @example
         * await browser.element('scrollable-div').scroll.to.top();
         */
        top: async () => {
          const browser = self.browser;
          browser.message = messenger({ stack: browser.stack, action: 'scroll to top' });
          try {
            const locator = await browser._finder();
            await browser.driver.executeScript('arguments[0].scrollTop = 0;', locator);
            log.info('Scrolled element to top.');
          } catch (err) {
            browser.handleError(err, 'scrolling element to top');
          } finally {
            browser.stack = [];
          }
          return true;
        },
        /**
         * Scroll the element to the bottom (scrollTop = scrollHeight).
         * @returns {Promise<boolean>} True if successful
         * @example
         * await browser.element('scrollable-div').scroll.to.bottom();
         */
        bottom: async () => {
          const browser = self.browser;
          browser.message = messenger({ stack: browser.stack, action: 'scroll to bottom' });
          try {
            const locator = await browser._finder();
            await browser.driver.executeScript('arguments[0].scrollTop = arguments[0].scrollHeight;', locator);
            log.info('Scrolled element to bottom.');
          } catch (err) {
            browser.handleError(err, 'scrolling element to bottom');
          } finally {
            browser.stack = [];
          }
          return true;
        },
        /**
         * Scroll the element to the left (scrollLeft = 0).
         * @returns {Promise<boolean>} True if successful
         * @example
         * await browser.element('scrollable-div').scroll.to.left();
         */
        left: async () => {
          const browser = self.browser;
          browser.message = messenger({ stack: browser.stack, action: 'scroll to left' });
          try {
            const locator = await browser._finder();
            await browser.driver.executeScript('arguments[0].scrollLeft = 0;', locator);
            log.info('Scrolled element to left.');
          } catch (err) {
            browser.handleError(err, 'scrolling element to left');
          } finally {
            browser.stack = [];
          }
          return true;
        },
        /**
         * Scroll the element to the right (scrollLeft = scrollWidth).
         * @returns {Promise<boolean>} True if successful
         * @example
         * await browser.element('scrollable-div').scroll.to.right();
         */
        right: async () => {
          const browser = self.browser;
          browser.message = messenger({ stack: browser.stack, action: 'scroll to right' });
          try {
            const locator = await browser._finder();
            await browser.driver.executeScript('arguments[0].scrollLeft = arguments[0].scrollWidth;', locator);
            log.info('Scrolled element to right.');
          } catch (err) {
            browser.handleError(err, 'scrolling element to right');
          } finally {
            browser.stack = [];
          }
          return true;
        },
      },
      /**
       * Scroll an element into the center of the viewport.
       *
       * @returns {Promise<boolean>} True if successful
       * @example
       * await browser.element('target').scroll.into.view();
       */
      into: {
        /**
         * Scroll an element into the center of the viewport.
         * @returns {Promise<boolean>} True if successful
         * @example
         * await browser.element('target').scroll.into.view();
         */
        view: async () => {
          const browser = self.browser;
          browser.message = messenger({ stack: browser.stack, action: 'scroll' });
          try {
            const locator = await browser._finder();
            await browser.driver.executeScript(
              'arguments[0].scrollIntoView({ behavior: "instant", block: "center", inline: "center" });',
              locator
            );
          } catch (err) {
            browser.handleError(err, 'scrolling into view');
          } finally {
            browser.stack = [];
          }
          return true;
        },
      },
    };
  }

  /**
   * Get the is accessor object.
   *
   * Provides visibility and state check methods.
   * Only works in element context (when stack has elements).
   *
   * @type {Object}
   * @returns {Object} Object containing is accessor methods
   * @example
   * await browser.element('button').is.visible();
   * await browser.element('button').is.enabled();
   * await browser.element('button').is.disabled();
   * await browser.element('button').is.not.visible();
   */
  get is() {
    const browser = this.browser;
    return {
      /**
       * Checks whether the element is visible.
       *
       * @param {number} [t] - Optional timeout in milliseconds
       * @returns {Promise<boolean>}
       */
      visible: async (t = null) => {
        browser.message = messenger({ stack: browser.stack, action: 'isVisible' });
        return await this._isVisible(t);
      },

      /**
       * Checks whether the element is enabled.
       *
       * @param {number} [t] - Optional timeout in milliseconds
       * @returns {Promise<boolean>}
       */
      enabled: async (t = null) => {
        browser.message = messenger({ stack: browser.stack, action: 'isEnabled' });
        return await this._isEnabled(t);
      },

      /**
       * Checks whether the element is disabled.
       *
       * @param {number} [t] - Optional timeout in milliseconds
       * @returns {Promise<boolean>}
       */
      disabled: async (t = null) => {
        browser.message = messenger({ stack: browser.stack, action: 'isDisabled' });
        return await this._isDisabled(t);
      },

      not: {
        /**
         * Checks whether the element is not visible.
         *
         * @param {number} [t] - Optional timeout in milliseconds
         * @returns {Promise<boolean>}
         */
        visible: async (t = null) => {
          browser.message = messenger({ stack: browser.stack, action: 'isNotVisible' });
          return await this._isNotVisible(t);
        },
      },
    };
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
        await this.#switchToElementContext(e.frameIndex, async () => {
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
        await this.#switchToElementContext(e.frameIndex, async () => {
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
   * @param {number} frameIndex - Frame index to switch to
   * @param {Function} callback - Callback function to execute in the frame context
   * @returns {Promise<void>}
   */
  async #switchToElementContext(frameIndex, callback) {
    const browser = this.browser;
    await browser.driver.switchTo().defaultContent();
    if (frameIndex >= 0) {
      try {
        await browser.driver.switchTo().frame(frameIndex);
        await callback();
      } catch (err) {
        if (err.name !== 'NoSuchFrameError') throw err;
        log.error(`Frame ${frameIndex} no longer exists.`);
      }
    } else {
      await callback();
    }
  }
}