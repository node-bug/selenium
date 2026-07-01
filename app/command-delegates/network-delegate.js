import { log } from '@nodebug/logger';
import messenger from '../messenger.js';
import config from '@nodebug/config';
import { BaseDelegate } from './base-delegate.js';
import { readFile } from 'fs/promises';
import { createRequire } from 'module';

const selenium = config('selenium');

// Resolve the path to the NetworkHelper IIFE script
const require = createRequire(import.meta.url);
const networkHelperPath = require.resolve('./network-helper.js');

/**
 * Network delegate for handling network-related operations
 *
 * This class encapsulates network monitoring functionality, including waiting
 * for AJAX requests and fetch calls to complete.
 *
 * @class NetworkDelegate
 */
export class NetworkDelegate extends BaseDelegate {
  constructor(browser) {
    super(browser);
  }

  /**
   * @type {boolean}
   */
  get debug() { return selenium.debug ?? false; }

  /**
   * Injects network monitoring scripts into the page.
   *
   * Call this method after navigating to a page but before triggering any
   * network requests. This ensures XHR and fetch calls are tracked from the start.
   *
   * @returns {Promise<void>}
   * @example
   * await browser.goto('https://example.com');
   * await browser.network.inject();
   * await browser.button('Load Data').click();
   * await browser.network.wait.for.all();
   */
  async inject() {
    const browser = this.browser;
    try {
      await this._injectNetworkHelper();
      log.info('Network monitoring scripts injected');
    } catch (err) {
      browser.handleError(err, 'injecting network monitoring scripts');
    }
  }

  /**
   * Injects the NetworkHelper IIFE script into the page.
   * This mirrors the pattern used for ElementFinder injection.
   * @private
   */
  async _injectNetworkHelper() {
    const browser = this.browser;
    try {
      // Check if NetworkHelper already exists in the page
      const exists = await browser.driver.executeScript(`return typeof window.NetworkHelper !== 'undefined';`);
      if (!exists) {
        const scriptContent = await readFile(networkHelperPath, 'utf8');
        // Execute the IIFE script and assign to window.NetworkHelper (the script does this itself)
        await browser.driver.executeScript(`
          ${scriptContent}
        `);
        const injected = await browser.driver.executeScript(`return typeof window.NetworkHelper !== 'undefined';`);
        if (!injected) {
          throw new Error('NetworkHelper script injection failed - window.NetworkHelper not defined');
        }
      }
    } catch (err) {
      if (this.debug) {
        log.warn('Failed to inject NetworkHelper:', err.message);
      }
      throw err;
    }
  }

  /**
   * Reads a network counter from the DOM bridge attribute.
   * @param {string} attr - The data attribute name
   * @returns {Promise<number>}
   */
  async #readCounter(attr) {
    const browser = this.browser;
    return await browser.driver.executeScript(
      `return parseInt(document.body.getAttribute('${attr}'), 10) || 0;`
    );
  }

  /**
   * Reads completed requests from the DOM bridge attribute.
   * @returns {Promise<Array>}
   */
  async #readCompletedRequests() {
    const browser = this.browser;
    return await browser.driver.executeScript(
      `try { return JSON.parse(document.body.getAttribute('data-network-completed-requests') || '[]'); } catch(e) { return []; }`
    );
  }

  /**
   * Waits for all AJAX requests (XMLHttpRequest) to complete.
   *
   * Monitors the page for active XHR requests and waits until they all finish
   * or timeout is reached.
   *
   * @param {number} [timeout] - Optional timeout in milliseconds (defaults to selenium.timeout)
   * @returns {Promise<boolean>} True if all requests completed, false if timeout reached
   * @example
   * await browser.network.wait.for.ajax();
   * await browser.network.wait.for.ajax(10000); // Custom 10s timeout
   */
  async #waitForAjax(timeout = null) {
    const browser = this.browser;
    const waitTimeout = timeout ?? selenium.timeout;
    const endTime = Date.now() + waitTimeout;

    try {
      while (Date.now() < endTime) {
        const activeCount = await this.#readCounter('data-network-xhr-count');
        if (activeCount === 0) {
          log.info('All AJAX requests completed');
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      log.warn(`AJAX requests still active after ${waitTimeout}ms timeout`);
      return false;
    } catch (err) {
      browser.handleError(err, 'waiting for AJAX requests');
      return false;
    } finally {
      browser.stack = [];
    }
  }

  /**
   * Waits for all fetch requests to complete.
   *
   * Monitors the page for active fetch requests and waits until they all finish
   * or timeout is reached.
   *
   * @param {number} [timeout] - Optional timeout in milliseconds (defaults to selenium.timeout)
   * @returns {Promise<boolean>} True if all requests completed, false if timeout reached
   * @example
   * await browser.network.wait.for.fetch();
   * await browser.network.wait.for.fetch(10000); // Custom 10s timeout
   */
  async #waitForFetch(timeout = null) {
    const browser = this.browser;
    const waitTimeout = timeout ?? selenium.timeout;
    const endTime = Date.now() + waitTimeout;

    try {
      while (Date.now() < endTime) {
        const activeCount = await this.#readCounter('data-network-fetch-count');
        if (activeCount === 0) {
          log.info('All fetch requests completed');
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      log.warn(`Fetch requests still active after ${waitTimeout}ms timeout`);
      return false;
    } catch (err) {
      browser.handleError(err, 'waiting for fetch requests');
      return false;
    } finally {
      browser.stack = [];
    }
  }

  /**
   * Waits for all network requests (XHR + fetch) to complete.
   *
   * Monitors the page for active network requests and waits until they all finish
   * or timeout is reached.
   *
   * @param {number} [timeout] - Optional timeout in milliseconds (defaults to selenium.timeout)
   * @returns {Promise<boolean>} True if all requests completed, false if timeout reached
   * @example
   * await browser.network.wait.for.all();
   * await browser.network.wait.for.all(10000); // Custom 10s timeout
   */
  async #waitForAll(timeout = null) {
    const browser = this.browser;
    const waitTimeout = timeout ?? selenium.timeout;
    const endTime = Date.now() + waitTimeout;

    try {
      while (Date.now() < endTime) {
        const xhrCount = await this.#readCounter('data-network-xhr-count');
        const fetchCount = await this.#readCounter('data-network-fetch-count');
        if (xhrCount === 0 && fetchCount === 0) {
          log.info('All network requests completed');
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      log.warn(`Network requests still active after ${waitTimeout}ms timeout`);
      return false;
    } catch (err) {
      browser.handleError(err, 'waiting for network requests');
      return false;
    } finally {
      browser.stack = [];
    }
  }

  /**
   * Waits for a specific network request to complete.
   *
   * Monitors the page for a request matching the URL pattern and waits until
   * it completes or timeout is reached.
   *
   * @param {string|RegExp} urlPattern - URL pattern to match (string or regex)
   * @param {number} [timeout] - Optional timeout in milliseconds (defaults to selenium.timeout)
   * @returns {Promise<boolean>} True if request completed, false if timeout reached
   * @example
   * await browser.network.wait.for.request('api/users');
   * await browser.network.wait.for.request(/api\/users/);
   */
  async #waitForRequest(urlPattern, timeout = null) {
    const browser = this.browser;
    const waitTimeout = timeout ?? selenium.timeout;
    const endTime = Date.now() + waitTimeout;

    try {
      while (Date.now() < endTime) {
        const completed = await this.#readCompletedRequests();
        const patternStr = urlPattern.toString();
        const isRegex = patternStr.startsWith('/') && patternStr.endsWith('/');
        const regex = isRegex ? new RegExp(patternStr.slice(1, -1)) : null;

        const found = completed.some(req => {
          if (isRegex) return regex.test(req.url);
          return req.url.includes(patternStr);
        });

        if (found) {
          log.info(`Request matching '${urlPattern}' completed`);
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      log.warn(`Request matching '${urlPattern}' did not complete within ${waitTimeout}ms timeout`);
      return false;
    } catch (err) {
      browser.handleError(err, `waiting for request '${urlPattern}'`);
      return false;
    } finally {
      browser.stack = [];
    }
  }

  /**
   * Accessor for network wait operations.
   *
   * @returns {Object} Object containing wait methods
   */
  get wait() {
    const browser = this.browser;

    return {
      /**
       * Waits for AJAX (XMLHttpRequest) requests to complete.
       *
       * @param {number} [timeout] - Optional timeout in milliseconds
       * @returns {Promise<boolean>} True if all requests completed
       */
      ajax: async (timeout) => {
        browser.message = messenger({ stack: browser.stack, action: 'waitForAjax' });
        return await this.#waitForAjax(timeout);
      },

      /**
       * Waits for fetch requests to complete.
       *
       * @param {number} [timeout] - Optional timeout in milliseconds
       * @returns {Promise<boolean>} True if all requests completed
       */
      fetch: async (timeout) => {
        browser.message = messenger({ stack: browser.stack, action: 'waitForFetch' });
        return await this.#waitForFetch(timeout);
      },

      /**
       * Waits for all network requests (XHR + fetch) to complete.
       *
       * @param {number} [timeout] - Optional timeout in milliseconds
       * @returns {Promise<boolean>} True if all requests completed
       */
      all: async (timeout) => {
        browser.message = messenger({ stack: browser.stack, action: 'waitForAll' });
        return await this.#waitForAll(timeout);
      },

      /**
       * Waits for a specific network request to complete.
       *
       * @param {string|RegExp} urlPattern - URL pattern to match
       * @param {number} [timeout] - Optional timeout in milliseconds
       * @returns {Promise<boolean>} True if request completed
       */
      request: async (urlPattern, timeout) => {
        browser.message = messenger({ stack: browser.stack, action: 'waitForRequest', data: urlPattern });
        return await this.#waitForRequest(urlPattern, timeout);
      },
    };
  }
}