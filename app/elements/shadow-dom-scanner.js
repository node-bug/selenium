/**
 * Shadow DOM scanning and traversal utilities.
 * 
 * Handles deep DOM traversal across shadow boundaries using TreeWalker.
 * Supports label resolution for form elements and caching of results.
 */

import { xpathConstraintToJS } from './xpath-builder.js';

/**
 * Configuration for shadow DOM scanning behavior.
 */
const DEFAULT_CONFIG = {
  maxShadowDepth: 10,
  enableClosedRootLogging: false
};

/**
 * Shadow DOM scanner that walks the entire DOM tree (piercing shadow boundaries).
 * Collects elements matching given criteria and resolves labels to form controls.
 */
export class ShadowDOMScanner {
  #driver;
  #config;
  #cache = new Map();

  /**
   * @param {WebDriver} driver - Selenium WebDriver instance
   * @param {Object} [config] - Configuration options
   */
  constructor(driver, config = {}) {
    this.#driver = driver;
    this.#config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Clears the shadow DOM query cache.
   */
  clearCache() {
    this.#cache.clear();
  }

  /**
   * Generates a cache key for shadow DOM queries.
   * 
   * @private
   * @param {string} scope - Scope identifier (all or element id)
   * @param {string} searchId - Text/ID being searched
   * @param {boolean} exact - Exact match flag
   * @param {string} type - Element type
   * @param {number} frameIndex - Frame index
   * @returns {string} Cache key
   */
  #generateCacheKey(scope, searchId, exact, type, frameIndex) {
    return `${frameIndex}:${scope}:${searchId}:${exact}:${type}`;
  }

  /**
   * Queries shadow DOM for elements matching criteria.
   * Uses a shared TreeWalker-based scanner with result caching.
   * 
   * @param {WebElement|null} scopeRoot - Optional element to limit search to its shadow root
   * @param {string} searchId - Text or ID to search for
   * @param {boolean} exact - Exact or substring matching
   * @param {string} type - Element type to match
   * @param {boolean} scoped - Whether search is scoped to an element
   * @param {number} frameIndex - Frame index for cache keying
   * @returns {Promise<WebElement[]>} Matching elements from shadow DOM
   */
  async query(scopeRoot, searchId, exact, type, scoped = false, frameIndex = -1) {
    const cacheKey = this.#generateCacheKey(
      scoped ? scopeRoot?.id : 'all',
      searchId,
      exact,
      type,
      frameIndex
    );

    if (this.#cache.has(cacheKey)) {
      return this.#cache.get(cacheKey);
    }

    const result = await this.#executeShadowQuery(
      scopeRoot,
      searchId,
      exact,
      type,
      scoped
    );

    this.#cache.set(cacheKey, result);
    return result;
  }

  /**
   * Executes the actual shadow DOM traversal via script execution.
   * 
   * @private
   * @returns {Promise<WebElement[]>} Query results
   */
  async #executeShadowQuery(scopeRoot, searchId, exact, type, scoped) {
    const isFormType = ['textbox', 'checkbox', 'dropdown', 'radio', 'switch'].includes(type);
    const typeMatcher = xpathConstraintToJS(this.#getTypeConstraint(type));

    try {
      const results = await this.#driver.executeScript(`
        const scopeRoot = arguments[0];
        const searchId = arguments[1];
        const exact = arguments[2];
        const maxDepth = arguments[3];
        const scoped = arguments[4];
        const isFormType = arguments[5];
        const closedRoots = [];
        const results = [];
        const seen = new Set();

        function matchesType(el) {
          const elTag = el.tagName.toLowerCase();
          return ${typeMatcher};
        }

        function resolveLabel(labelEl) {
          // Strategy 1: label[for] attribute
          const forId = labelEl.getAttribute('for');
          if (forId) {
            const root = labelEl.getRootNode();
            const formEl = root.querySelector ? root.querySelector('#' + forId) 
                         : (root.getElementById ? root.getElementById(forId) : null);
            if (formEl) return formEl;
          }

          // Strategy 2: nested form element
          const nested = labelEl.querySelector('input, select, textarea');
          if (nested) return nested;

          // Strategy 3: sibling form element
          let sibling = labelEl.nextElementSibling;
          while (sibling) {
            if (sibling.matches('input, select, textarea')) return sibling;
            sibling = sibling.nextElementSibling;
          }
          return null;
        }

        function isTextLeaf(el) {
          for (const child of el.children) {
            if (child.textContent.trim().includes(searchId)) return false;
          }
          return true;
        }

        function matchesElement(el) {
          const text = el.textContent.trim();
          const textMatch = exact ? text === searchId : text.includes(searchId);
          const elId = el.getAttribute('id') || '';
          const idMatch = exact ? elId === searchId : elId.includes(searchId);
          const placeholder = el.getAttribute('placeholder') || '';
          const placeholderMatch = exact ? placeholder === searchId : placeholder.includes(searchId);
          return textMatch || idMatch || placeholderMatch;
        }

        function walkTree(root, depth) {
          if (depth > maxDepth) return;

          let walker;
          try {
            walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
          } catch (e) {
            return;
          }

          let node;
          while (node = walker.nextNode()) {
            // Log closed shadow roots
            if (!node.shadowRoot && node.getAttribute?.('shadowroot') !== null) {
              closedRoots.push(node.tagName.toLowerCase() + (node.id ? '#' + node.id : ''));
            }

            // Direct match
            if (matchesElement(node) && matchesType(node) && isTextLeaf(node)) {
              if (!seen.has(node)) {
                seen.add(node);
                results.push(node);
              }
            }

            // Label-based match for form types
            if (isFormType && node.tagName === 'LABEL' && isTextLeaf(node)) {
              const labelText = node.textContent.trim();
              const labelMatch = exact ? labelText === searchId : labelText.includes(searchId);
              if (labelMatch) {
                const formEl = resolveLabel(node);
                if (formEl && matchesType(formEl) && !seen.has(formEl)) {
                  seen.add(formEl);
                  results.push(formEl);
                }
              }
            }

            // Placeholder-only match for form types
            if (isFormType && !seen.has(node)) {
              const placeholder = node.getAttribute('placeholder') || '';
              const placeholderMatch = exact ? placeholder === searchId : placeholder.includes(searchId);
              if (placeholderMatch && matchesType(node)) {
                seen.add(node);
                results.push(node);
              }
            }

            // Recurse into shadow root
            if (node.shadowRoot) {
              walkTree(node.shadowRoot, depth + 1);
            }
          }
        }

        if (scoped && scopeRoot && scopeRoot.shadowRoot) {
          walkTree(scopeRoot.shadowRoot, 1);
        } else if (!scoped) {
          walkTree(document, 0);
        }

        return results;
      `, scopeRoot, searchId, exact, this.#config.maxShadowDepth, scoped, isFormType);

      return results;
    } catch (err) {
      console.warn('Shadow DOM query error:', err.message);
      return [];
    }
  }

  /**
   * Gets the XPath constraint for an element type.
   * 
   * @private
   * @param {string} type - Element type
   * @returns {string} XPath constraint
   */
  #getTypeConstraint(type) {
    const constraints = {
      link: `self::a or @role='link' or @href`,
      navigation: `@role='navigation' or self::nav`,
      heading: `@role='heading' or self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::h6`,
      button: `self::button or @role='button' or @type='button' or @type='submit'`,
      checkbox: `(self::input and @type='checkbox') or @role='checkbox'`,
      switch: `self::button[@role='switch'] or (self::input and @type='checkbox') or @role='switch'`,
      slider: `self::input[@type='range'] or @role='slider'`,
      radio: `(self::input and @type='radio') or @role='radio'`,
      dropdown: `(self::select[descendant::option] or @role='combobox' or @role='listbox' or contains(@class, 'dropdown') or contains(@class, 'trigger') or ancestor::*[contains(@class, 'dropdown') or @role='combobox'])`,
      textbox: `self::textarea or (self::input and (@type='text' or @type='password' or @type='search' or @type='email')) or @role='textbox'`,
      file: `self::input and @type='file'`,
      list: `self::ul or self::ol or @role='list'`,
      listitem: `self::li or @role='listitem'`,
      menu: `self::menu or @role='menu'`,
      menuitem: `@role='menuitem'`,
      toolbar: `@role='toolbar'`,
      dialog: `@role='dialog'`,
      table: `self::table or @role='table'`,
      row: `self::tr or @role='row'`,
      column: `self::td or self::th or @role='cell' or @role='gridcell' or @role='columnheader'`,
      image: `self::img or @role='img' or @alt`,
      element: `true()`
    };
    return constraints[type] || constraints.element;
  }
}
