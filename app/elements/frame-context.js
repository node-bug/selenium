/**
 * Frame context management utilities.
 * 
 * Handles safe switching between frames and contexts in the browser.
 * Manages driver state and handles common errors gracefully.
 */

/**
 * Frame context manager for switching and executing code in different frame scopes.
 */
export class FrameContextManager {
  #driver;
  #debug;

  /**
   * @param {WebDriver} driver - Selenium WebDriver instance
   * @param {boolean} [debug] - Enable debug logging
   */
  constructor(driver, debug = false) {
    this.#driver = driver;
    this.#debug = debug;
  }

  /**
   * Gets all iframe elements in the current context.
   * 
   * @param {import('selenium-webdriver').By} By - Selenium By class
   * @returns {Promise<WebElement[]>} Array of iframe elements
   */
  async getFrames(By) {
    try {
      return await this.#driver.findElements(By.xpath('//iframe'));
    } catch (err) {
      if (this.#debug) {
        console.warn('Failed to get frames:', err.message);
      }
      return [];
    }
  }

  /**
   * Gets all frame indices including default content.
   * 
   * @param {import('selenium-webdriver').By} By - Selenium By class
   * @returns {Promise<number[]>} Array of frame indices (-1 = default content)
   */
  async getFrameIndices(By) {
    const frames = await this.getFrames(By);
    return [-1, ...frames.keys()];
  }

  /**
   * Switches to the default document content (top level).
   * 
   * @returns {Promise<void>}
   */
  async switchToDefaultContent() {
    try {
      await this.#driver.switchTo().defaultContent();
    } catch (err) {
      if (this.#debug) {
        console.warn('Failed to switch to default content:', err.message);
      }
      throw err;
    }
  }

  /**
   * Switches to a specific frame by index.
   * 
   * @param {number} frameIndex - Frame index to switch to (-1 for default)
   * @returns {Promise<boolean>} True if successful, false if frame not found
   */
  async switchToFrame(frameIndex) {
    if (frameIndex < 0) {
      await this.switchToDefaultContent();
      return true;
    }

    try {
      await this.#driver.switchTo().frame(frameIndex);
      return true;
    } catch (err) {
      if (err.name === 'NoSuchFrameError') {
        if (this.#debug) {
          console.warn(`Frame ${frameIndex} not found`);
        }
        return false;
      }
      throw err;
    }
  }

  /**
   * Executes a callback within a specific frame context.
   * Ensures proper frame switching before and after execution.
   * 
   * Safely handles:
   * - Frame switching errors
   * - Missing frames (returns null)
   * - Callback errors (wrapped)
   * 
   * @param {number} frameIndex - Frame to execute in (-1 for default)
   * @param {Function} callback - Async function to execute
   * @returns {Promise<any>} Result of callback, or null if frame unavailable
   * @throws {Error} If callback throws or driver becomes detached
   */
  async withFrameContext(frameIndex, callback) {
    try {
      await this.switchToDefaultContent();
    } catch (err) {
      if (this.#debug) {
        console.warn('Failed to switch to default content:', err.message);
      }
      return null; // Driver may be detached
    }

    // Switch to target frame
    const switched = await this.switchToFrame(frameIndex);
    if (!switched && frameIndex >= 0) {
      return null; // Frame doesn't exist
    }

    try {
      return await callback();
    } catch (err) {
      if (this.#debug) {
        console.error(`Error in frame ${frameIndex}:`, err.message);
      }
      throw err;
    }
  }

  /**
   * Executes code in the browser within a frame context.
   * 
   * @param {number} frameIndex - Frame index
   * @param {string} script - Script code
   * @param {...any} args - Script arguments
   * @returns {Promise<any>} Script result
   */
  async executeScriptInFrame(frameIndex, script, ...args) {
    return this.withFrameContext(frameIndex, async () => {
      return await this.#driver.executeScript(script, ...args);
    });
  }

  /**
   * Finds elements in a specific frame using XPath.
   * 
   * @param {number} frameIndex - Frame index
   * @param {import('selenium-webdriver').By} By - Selenium By class
   * @param {string} xpath - XPath selector
   * @returns {Promise<WebElement[]>} Found elements or empty array
   */
  async findElementsInFrame(frameIndex, By, xpath) {
    return this.withFrameContext(frameIndex, async () => {
      try {
        return await this.#driver.findElements(By.xpath(xpath));
      } catch (err) {
        if (this.#debug) {
          console.warn(`XPath query failed in frame ${frameIndex}:`, err.message);
        }
        return [];
      }
    });
  }
}

/**
 * Ensures driver is in correct frame before element interaction.
 * 
 * @param {WebDriver} driver - Selenium WebDriver
 * @param {WebElement} element - Element to focus on
 * @returns {Promise<void>}
 */
export async function ensureFrameContext(driver, element) {
  try {
    await driver.switchTo().defaultContent();
    if (element.frame >= 0) {
      await driver.switchTo().frame(element.frame);
    }
  } catch (err) {
    console.warn('Failed to switch to element frame:', err.message);
    // Don't throw - element may still be usable
  }
}

/**
 * Gets the currently active frame/window handle.
 * 
 * @param {WebDriver} driver - Selenium WebDriver
 * @returns {Promise<string|null>} Frame/window handle or null
 */
export async function getCurrentFrameHandle(driver) {
  try {
    return await driver.executeScript('return window.name || "main"');
  } catch {
    return null;
  }
}
