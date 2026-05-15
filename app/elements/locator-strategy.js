import { By } from 'selenium-webdriver';
import config from '@nodebug/config';
import { log } from '@nodebug/logger';
import { ElementTypes } from './element-types.js';
import { relativeSearch } from './spatial-selection.js';

const selenium = config('selenium');

/**
 * Core element-finding strategy that extends {@link ElementTypes} with
 * Selenium WebDriver integration. Handles cross-iframe scanning, spatial
 * filtering (above, below, left, right, within), and stack-based element
 * resolution.
 * 
 * ## Supported Finding Strategies
 * 1. **Direct Matching**: Match by element type + text/attribute content
 * 2. **Exact vs Substring**: Full-text or partial matching
 * 3. **Index Selection**: 1-based indexing into result sets
 * 4. **Spatial Filtering**: above, below, toLeftOf, toRightOf, within, near
 * 5. **Fallback Matching**: Nearest element when direct match fails
 * 6. **Frame Scanning**: Cross-iframe element resolution
 * 7. **Visibility Filtering**: Include/exclude hidden elements
 * 8. **OR Conditions**: Multiple search paths with logical OR
 * 9. **Chained Filters**: Combine spatial filters in sequence
 * 10. **Alignment Precision**: Optional exact alignment (for above/below/left/right)
 */
export class LocatorStrategy extends ElementTypes {
  // Configuration for fallback and spatial search behavior
  #config = {
    alignmentBuffer: 5,        // 5px tolerance for "exactly" alignment
    proximityDistance: 100,    // 100px for "near" relationship
    directionalPenalty: 5,     // Penalty multiplier for reverse direction (up/left)
    maxFrameDepth: 10,         // Maximum nested iframe depth to scan
    retryDelayMs: 100,         // Retry delay in fallback search
    enableCrossFrameSearch: true,
    maxShadowDepth: 10         // Maximum nested shadow DOM depth to scan
  };

  // Cache for shadow DOM query results, keyed by frame index.
  // Cleared at the start of each top-level find/findAll resolution.
  #shadowCache = new Map();

  /**
   * @type {import('selenium-webdriver').WebDriver}
   */
  set driver(value) { this._driver = value; }
  get driver() { return this._driver; }

  /**
   * @type {boolean}
   */
  get debug() { return selenium.debug ?? false; }

  /**
   * Configure spatial search behavior (for advanced use cases).
   * @param {Object} options - Configuration overrides
   */
  configure(options = {}) {
    Object.assign(this.#config, options);
  }

  /**
   * Helper to switch context safely.
   * 
   * Switches to the default content, then optionally into a specific frame
   * before executing the callback. Handles frame errors gracefully by returning null
   * if the frame is no longer accessible (common in dynamic SPAs).
   *
   * @param {number} frame - The frame index to switch into, or -1 for default content.
   * @param {Function} callback - The async function to execute within the frame context.
   * @returns {Promise<*>} The result of the callback, or null if the frame was not found.
   * @throws {Error} Any error from the callback (not frame-switching errors)
   */
  async _withContext(frame, callback) {
    try {
      await this.driver.switchTo().defaultContent();
    } catch (err) {
      // If we can't switch to default content, the driver may be detached
      if (this.debug) console.warn('Failed to switch to default content:', err.message);
      return null;
    }

    if (frame >= 0) {
      try {
        await this.driver.switchTo().frame(frame);
      } catch (err) {
        // Frame doesn't exist, moved, or is inaccessible - this is normal in dynamic pages
        // Only catch NoSuchFrameError, rethrow other errors
        if (err.name === 'NoSuchFrameError') {
          if (this.debug) console.warn(`Frame ${frame} not found`);
          return null;
        }
        throw err;
      }
    }

    return await callback();
  }

  /**
   * Finds child elements within a parent element's frame context.
   *
   * This method is used for the 'within' spatial filter. It switches to the parent's
   * frame, queries for matching children using both shadow DOM scanning and XPath,
   * merges and deduplicates the results, qualifies them with bounding-box metadata,
   * and filters out zero-dimension (invisible) elements.
   *
   * @param {WebElement} parent - The parent WebElement whose frame context to use.
   * @param {Object} childData - The selector descriptor containing `id`, `exact`, and `type`.
   * @returns {Promise<WebElement[]>} Array of qualified child elements with visible dimensions.
   * @throws {Error} If context switching or XPath query fails
   */
  async findChildElements(parent, childData) {
    if (!parent) {
      return [];
    }

    return this._withContext(parent.frame, async () => {
      try {
        const allElements = [];

        // Scan shadow roots within the parent using the shared scanner
        const shadowElements = await this._queryShadowDOM(
          parent.shadowRoot ? parent : null,
          childData.id,
          childData.exact,
          childData.type,
          true,  // scoped to parent's shadow root
          parent.frame
        );
        allElements.push(...shadowElements);

        // Also query regular (non-shadow) children via XPath within the parent
        const xpath = this.getSelectors(childData.id, childData.exact)[childData.type];
        const xpathElements = await parent.findElements(By.xpath(xpath));

        // Deduplicate: XPath results that are already found via shadow scan
        // Use a Set of element IDs for O(1) lookup
        const shadowIds = new Set(shadowElements.map(el => el.id));
        for (const el of xpathElements) {
          if (!shadowIds.has(el.id)) {
            allElements.push(el);
          }
        }

        if (allElements.length === 0) {
          return [];
        }

        // Tag each element with the parent's frame context
        allElements.forEach(el => el.frame = parent.frame);

        // Add bounding box metadata to each element
        const qualified = await this.addQualifiers(allElements);

        // Filter: keep only elements with visible dimensions
        const filtered = qualified.filter(e =>
          e.rect && e.rect.height > 0 && e.rect.width > 0
        );

        return filtered;
      } catch (err) {
        if (this.debug) {
          console.error(`Error finding child elements of type '${childData.type}':`, err.message);
        }
        return [];
      }
    });
  }

  /**
   * Filters a set of candidate elements based on their spatial relationship
   * to a reference element (or array of reference elements for 'within').
   *
   * Supported spatial relationships:
   * - `above`: Candidate is vertically above reference (r.top >= e.rect.bottom)
   * - `below`: Candidate is vertically below reference (r.bottom <= e.rect.top)
   * - `toLeftOf`: Candidate is horizontally left of reference (r.left >= e.rect.right)
   * - `toRightOf`: Candidate is horizontally right of reference (r.right <= e.rect.left)
   * - `within`: Candidate's midpoint is inside reference's bounding box
   * - `near`: Candidate vertically overlaps reference (on same row, within 100px)
   * 
   * When `rel.exactly` is true, alignment is also checked (within 5px buffer):
   * - For above/below: horizontal alignment required
   * - For left/right: vertical alignment required
   *
   * For 'within', supports array of reference elements (all must be checked).
   * If no spatial constraint, returns all candidates unchanged.
   *
   * @param {Object} item - The stack item containing `type` and `matches` array.
   * @param {Object} [rel] - Spatial constraint object with `located` and optional `exactly`.
   * @param {WebElement|WebElement[]} [relativeElement] - Reference element(s) to filter by.
   * @returns {Promise<WebElement[]>} Filtered array of elements matching the spatial constraint.
   * @throws {Error} If spatial location is unsupported
   */
  async relativeSearch(item, rel, relativeElement) {
    return relativeSearch(item, rel, relativeElement, this);
  }

  /**
   * Injects bounding-box metadata into WebElement(s) by executing a script
   * in the browser to retrieve `getBoundingClientRect()` data.
   *
   * For each element, adds:
   * - `tagName` (lowercased for consistent matching)
   * - `rect` object with position and size data plus `midx`/`midy` midpoints
   * 
   * Returns elements in the same order as input. Handles arrays, single elements, and null.
   *
   * @param {WebElement|WebElement[]|null} elements - Single element, array of elements, or null.
   * @returns {Promise<WebElement[]>} Array of qualified elements with rect metadata.
   * @throws {Error} If script execution fails
   */
  async addQualifiers(elements) {
    // Handle null/undefined/empty inputs
    if (!elements) return [];
    
    const targets = Array.isArray(elements) ? elements : [elements];
    if (targets.length === 0) return [];

    try {
      // Execute once in browser to get all coordinates at once (more efficient than multiple calls)
      const stats = await this.driver.executeScript(`
        return Array.from(arguments).map(el => {
          try {
            const r = el.getBoundingClientRect();
            return {
              x: r.x, y: r.y, width: r.width, height: r.height,
              top: r.top, bottom: r.bottom, left: r.left, right: r.right,
              tagName: el.tagName || 'unknown'
            };
          } catch (e) {
            // Element may have become stale or detached
            return null;
          }
        });
      `, ...targets);

      // Map stats back to elements, filtering out failures
      return targets
        .map((el, i) => {
          const s = stats[i];
          if (!s) return null; // Element became stale
          
          el.tagName = s.tagName.toLowerCase();
          el.rect = {
            ...s,
            midx: s.x + s.width / 2,
            midy: s.y + s.height / 2
          };
          return el;
        })
        .filter(el => el !== null);
    } catch (err) {
      if (this.debug) {
        console.error('Error adding qualifiers to elements:', err.message);
      }
      return [];
    }
  }

  /**
   * Finds the closest element of a specific type relative to a starting element.
   * 
   * Used as a fallback when direct type matching fails. Searches for the target type
   * among all elements and returns the one closest by Euclidean distance. Applies
   * directional penalties to discourage leftward/upward moves.
   * 
   * Distance calculation:
   * 1. Find midpoints of both origin and target
   * 2. Calculate raw dx, dy distances
   * 3. Apply penalty factors: if moving left/up, multiply by 5x (configurable)
   * 4. Return element with minimum weighted distance
   *
   * @param {WebElement} originElement - The reference element to measure distance from.
   * @param {string} [targetType='element'] - The element type to search for (e.g., 'button', 'textbox').
   * @returns {Promise<WebElement>} The nearest qualified element, or originElement if no candidates found.
   */
  async nearestElement(originElement, targetType = 'element') {
    // 1. Query for all potential candidates of the target type in the current frame
    const xpath = this.getSelectors(null, false)[targetType];
    
    let candidates;
    try {
      candidates = await this.driver.findElements(By.xpath(xpath));
    } catch (err) {
      if (this.debug) {
        console.warn(`Failed to find candidates of type '${targetType}':`, err.message);
      }
      return originElement;
    }

    if (candidates.length === 0) {
      return originElement; // No better option exists
    }

    try {
      // 2. Calculate distances in a single browser execution (more efficient)
      const distances = await this.driver.executeScript(`
        const origin = arguments[0].getBoundingClientRect();
        const originMid = { 
          x: origin.left + origin.width / 2, 
          y: origin.top + origin.height / 2 
        };

        return Array.from(arguments).slice(1).map(el => {
          const r = el.getBoundingClientRect();
          const targetMid = { 
            x: r.left + r.width / 2, 
            y: r.top + r.height / 2 
          };
          
          let dx = targetMid.x - originMid.x;
          let dy = targetMid.y - originMid.y;

          /**
           * DIRECTIONAL PENALTY:
           * Discourage moving LEFT (dx < 0) or UP (dy < 0) by applying penalty.
           * This makes the result-finding heuristic prefer forward/downward matches.
           * Penalty factor: 5x (configurable via #config.directionalPenalty)
           */
          const penaltyFactor = ${this.#config.directionalPenalty};
          const weightedDx = dx < 0 ? dx * penaltyFactor : dx;
          const weightedDy = dy < 0 ? dy * penaltyFactor : dy;

          // Euclidean distance with weighted components
          return Math.sqrt(
            Math.pow(weightedDx, 2) + 
            Math.pow(weightedDy, 2)
          );
        });
      `, originElement, ...candidates);

      // 3. Map distances back to elements and find minimum
      const sortedCandidates = candidates
        .map((el, index) => {
          el.distance = distances[index];
          el.frame = originElement.frame;
          return el;
        })
        .sort((a, b) => a.distance - b.distance);

      // 4. Qualify the winner and return
      const [winner] = await this.addQualifiers(sortedCandidates[0]);
      delete winner.distance;

      return winner;
    } catch (err) {
      if (this.debug) {
        console.error('Error calculating nearest element:', err.message);
      }
      return originElement;
    }
  }

  /**
   * Builds the type-matching JavaScript expression from ElementTypes definitions.
   * Returns a JS function body that checks if an element matches the given type.
   *
   * @private
   * @param {string} type - The element type (e.g., 'button', 'textbox').
   * @returns {string} JavaScript function body for type matching.
   */
  #buildTypeMatcherJS(type) {
    const constraint = this.definitions[type] || this.definitions['element'];
    // Parse the XPath constraint into a JS boolean expression
    // Handle: self::tag, @role='value', @type='value', contains(@class, 'value'), or, and
    return this.#xpathConstraintToJS(constraint);
  }

  /**
   * Converts an XPath constraint expression to a JavaScript boolean expression.
   * Handles common patterns: self::tag, @attr='value', @type='value', contains(), or/and.
   *
   * @private
   * @param {string} constraint - XPath constraint string.
   * @returns {string} JavaScript boolean expression.
   */
  #xpathConstraintToJS(constraint) {
    if (constraint === 'true()') return 'true';

    // Split by ' or ' first (lowest precedence), but not inside brackets
    const orParts = this.#splitOutsideBrackets(constraint, ' or ');
    if (orParts.length > 1) {
      return orParts.map(p => this.#xpathConstraintToJS(p.trim())).join(' || ');
    }

    // Split by ' and '
    const andParts = this.#splitOutsideBrackets(constraint, ' and ');
    if (andParts.length > 1) {
      return andParts.map(p => this.#xpathConstraintToJS(p.trim())).join(' && ');
    }

    const c = constraint.trim();

    // self::tagname[predicate] — e.g., self::button[@role='switch']
    const selfPredMatch = c.match(/^self::(\w+)\[(.+)\]$/);
    if (selfPredMatch) {
      const tag = selfPredMatch[1];
      const pred = selfPredMatch[2];
      return `(elTag === '${tag}' && ${this.#xpathConstraintToJS(pred)})`;
    }

    // self::tagname
    const selfMatch = c.match(/^self::(\w+)$/);
    if (selfMatch) return `elTag === '${selfMatch[1]}'`;

    // @role='value' or @type='value' or @href
    const attrMatch = c.match(/^@(\w+)(?:='([^']*)')?$/);
    if (attrMatch) {
      const attr = attrMatch[1], val = attrMatch[2];
      if (val === undefined) return `el.hasAttribute('${attr}')`;
      return `el.getAttribute('${attr}') === '${val}'`;
    }

    // contains(@class, 'value') or contains(@attr, 'value')
    const containsMatch = c.match(/^contains\(@(\w+),\s*'([^']*)'\)$/);
    if (containsMatch) {
      return `(el.getAttribute('${containsMatch[1]}') || '').includes('${containsMatch[2]}')`;
    }

    // (expr) — parenthesized group
    const parenMatch = c.match(/^\((.+)\)$/);
    if (parenMatch && this.#isBalanced(parenMatch[1])) {
      return `(${this.#xpathConstraintToJS(parenMatch[1])})`;
    }

    // descendant::option[...] — for dropdown option matching
    const descMatch = c.match(/^self::select\[descendant::option\[(.+)\]\]$/);
    if (descMatch) {
      const inner = descMatch[1];
      const textMatch = inner.match(/^normalize-space\(\.\)='([^']*)'$/);
      if (textMatch) {
        return `Array.from(el.options).some(o => o.textContent.trim() === '${textMatch[1]}')`;
      }
      const containsTextMatch = inner.match(/^contains\(normalize-space\(\.\),\s*'([^']*)'\)$/);
      if (containsTextMatch) {
        return `Array.from(el.options).some(o => o.textContent.trim().includes('${containsTextMatch[1]}'))`;
      }
    }

    // self::select[descendant::option] — select with any option children
    const selectOptMatch = c.match(/^self::select\[descendant::option\]$/);
    if (selectOptMatch) return 'el.options.length > 0';

    // ancestor::*[predicate]
    const ancMatch = c.match(/^ancestor::\*\((.+)\)$/);
    if (ancMatch) {
      const innerExpr = this.#xpathConstraintToJS(ancMatch[1]);
      return `!!el.closest('*') && (() => { const p = el.closest('*'); return ${innerExpr.replace(/\bel\b/g, 'p')}; })()`;
    }

    return 'true';
  }

  /**
   * Splits a string by a delimiter, but only when not inside square brackets.
   * Used to correctly split ' or ' / ' and ' in XPath constraints.
   *
   * @private
   * @param {string} str - The string to split.
   * @param {string} delimiter - The delimiter to split by.
   * @returns {string[]} The split parts.
   */
  #splitOutsideBrackets(str, delimiter) {
    const parts = [];
    let depth = 0, current = '';
    for (let i = 0; i < str.length; i++) {
      if (str[i] === '[') depth++;
      if (str[i] === ']') depth--;
      if (depth === 0 && str.substr(i, delimiter.length) === delimiter) {
        parts.push(current);
        current = '';
        i += delimiter.length - 1;
      } else {
        current += str[i];
      }
    }
    parts.push(current);
    return parts;
  }

  /**
   * Checks if parentheses in a string are balanced.
   *
   * @private
   * @param {string} str - The string to check.
   * @returns {boolean} True if parentheses are balanced.
   */
  #isBalanced(str) {
    let depth = 0;
    for (const ch of str) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (depth < 0) return false;
    }
    return depth === 0;
  }

  /**
   * Shared single-pass shadow DOM query using TreeWalker.
   *
   * Walks the entire DOM tree (piercing shadow boundaries) in one pass,
   * collecting elements that match the given criteria. For form elements
   * (textbox, checkbox, dropdown, radio, switch), also resolves label
   * text to the associated form control via 'for' attribute or sibling
   * relationship.
   *
   * Results are cached per query to avoid redundant traversals.
   *
   * @private
   * @param {WebElement|null} scopeRoot - If provided, only search within this element's shadow root.
   *   If null, search all shadow roots in the current document.
   * @param {string} searchId - The text or ID to search for.
   * @param {boolean} exact - Whether to use exact or substring matching.
   * @param {string} type - The element type to match.
   * @param {boolean} scoped - If true, scopeRoot is provided and we search only its shadow.
   * @returns {Promise<WebElement[]>} Matching elements from shadow DOM.
   */
  async _queryShadowDOM(scopeRoot, searchId, exact, type, scoped = false, frameIndex = -1) {
    const cacheKey = `${frameIndex}:${scoped ? scopeRoot?.id : 'all'}:${searchId}:${exact}:${type}`;
    if (this.#shadowCache.has(cacheKey)) {
      return this.#shadowCache.get(cacheKey);
    }

    const maxDepth = this.#config.maxShadowDepth;
    const typeMatcher = this.#buildTypeMatcherJS(type);
    // Form types that support label-based resolution
    const isFormType = ['textbox', 'checkbox', 'dropdown', 'radio', 'switch'].includes(type);

    try {
      const results = await this.driver.executeScript(`
        const scopeRoot = arguments[0];
        const searchId = arguments[1];
        const exact = arguments[2];
        const maxDepth = arguments[3];
        const typeMatcher = arguments[4];
        const scoped = arguments[5];
        const isFormType = arguments[6];
        const results = [];
        const closedRoots = [];
        const seen = new Set();

        // Build the type check function from the generated matcher
        function matchesType(el) {
          const elTag = el.tagName.toLowerCase();
          return ${typeMatcher};
        }

        // Resolve a label element to its associated form control.
        // Returns the form element if found, or null.
        function resolveLabel(labelEl) {
          // Strategy 1: label[for] -> element with matching id within the same root
          const forId = labelEl.getAttribute('for');
          if (forId) {
            const root = labelEl.getRootNode();
            // Use querySelector for compatibility with ShadowRoot (DocumentFragment)
            // querySelector works on both Document and ShadowRoot
            if (root.querySelector) {
              const formEl = root.querySelector('#' + forId);
              if (formEl) return formEl;
            } else if (root.getElementById) {
              const formEl = root.getElementById(forId);
              if (formEl) return formEl;
            }
          }
          // Strategy 2: label contains nested input/select/textarea
          const nested = labelEl.querySelector('input, select, textarea');
          if (nested) return nested;
          // Strategy 3: label followed by input/select/textarea sibling
          let sibling = labelEl.nextElementSibling;
          while (sibling) {
            if (sibling.matches('input, select, textarea')) return sibling;
            sibling = sibling.nextElementSibling;
          }
          return null;
        }

        // Check if element is a leaf text node (no element children with matching text).
        // This mirrors the XPath recursion guard: only match innermost elements.
        function isTextLeaf(el) {
          for (const child of el.children) {
            if (child.textContent.trim().includes(searchId)) return false;
          }
          return true;
        }

        // Try to match an element directly by text, ID, or placeholder.
        function matchesElement(el) {
          const text = el.textContent.trim();
          const textMatch = exact ? text === searchId : text.includes(searchId);
          const elId = el.getAttribute('id') || '';
          const idMatch = exact ? elId === searchId : elId.includes(searchId);
          const placeholder = el.getAttribute('placeholder') || '';
          const placeholderMatch = exact ? placeholder === searchId : placeholder.includes(searchId);
          return textMatch || idMatch || placeholderMatch;
        }

        // Single-pass tree walker that pierces shadow boundaries
        function walkTree(root, depth) {
          if (depth > maxDepth) return;

          let walker;
          try {
            walker = document.createTreeWalker(
              root,
              NodeFilter.SHOW_ELEMENT,
              null,
              false
            );
          } catch (e) {
            return;
          }

          let node;
          while (node = walker.nextNode()) {
            // Track closed shadow roots for debug logging
            if (!node.shadowRoot && node.getAttribute && node.getAttribute('shadowroot') !== null) {
              closedRoots.push(node.tagName.toLowerCase() + (node.id ? '#' + node.id : ''));
            }

            // --- Direct match: element itself matches text/ID/placeholder AND type ---
            if (matchesElement(node) && matchesType(node) && isTextLeaf(node)) {
              if (!seen.has(node)) {
                seen.add(node);
                results.push(node);
              }
            }

            // --- Label-based match for form elements ---
            // If the element is a label matching the text, resolve to its form control
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

            // Also check placeholder-only match for form elements
            // (an input whose placeholder matches but text/ID don't)
            if (isFormType && !seen.has(node)) {
              const placeholder = node.getAttribute('placeholder') || '';
              const placeholderMatch = exact ? placeholder === searchId : placeholder.includes(searchId);
              if (placeholderMatch && matchesType(node)) {
                seen.add(node);
                results.push(node);
              }
            }

            // Recurse into shadow root if present
            if (node.shadowRoot) {
              walkTree(node.shadowRoot, depth + 1);
            }
          }
        }

        if (scoped && scopeRoot) {
          if (scopeRoot.shadowRoot) {
            walkTree(scopeRoot.shadowRoot, 1);
          }
        } else {
          walkTree(document, 0);
        }

        if (closedRoots.length > 0) {
          console.debug('ShadowDOM: skipped closed roots:', closedRoots.join(', '));
        }

        return results;
      `, scopeRoot, searchId, exact, maxDepth, typeMatcher, scoped, isFormType);

      this.#shadowCache.set(cacheKey, results);
      return results;
    } catch (err) {
      if (this.debug) {
        console.warn('Error querying shadow DOM:', err.message);
      }
      this.#shadowCache.set(cacheKey, []);
      return [];
    }
  }

  /**
   * Scans shadow roots within the current frame for elements matching a selector.
   * Uses the shared TreeWalker-based scanner with caching.
   *
   * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`.
   * @param {number} frameIndex - The frame index for context tagging.
   * @param {string} [xpathType] - Optional: use specific XPath type instead of elementData.type
   * @returns {Promise<WebElement[]>} Qualified elements from shadow roots.
   */
  async _scanShadowRootsForElements(elementData, frameIndex) {
    const found = [];

    try {
      // Use the shared scanner — handles both form and non-form elements uniformly
      const shadowElements = await this._queryShadowDOM(
        null,  // search all shadow roots in the frame
        elementData.id,
        elementData.exact,
        elementData.type,
        false,  // not scoped
        frameIndex
      );

      if (shadowElements.length > 0) {
        shadowElements.forEach(el => el.frame = frameIndex);
        const qualified = await this.addQualifiers(shadowElements);
        const visibilityFilter = elementData.hidden
          ? (e) => e.rect.height < 1 || e.rect.width < 1
          : (e) => e.rect.height > 0 && e.rect.width > 0;
        found.push(...qualified.filter(visibilityFilter));
      }
    } catch (err) {
      if (this.debug) {
        console.warn('Error scanning shadow roots:', err.message);
      }
    }

    return found;
  }

  /**
   * Scans all frames (including default content) for elements matching a selector.
   * 
   * Returns all matching elements across frames, tagged with their frame index
   * and qualified with bounding box metadata. Filters by visibility settings.
   * Also scans shadow roots within each frame for matching elements.
   *
   * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`.
   * @param {string} [xpathType] - Optional: use specific XPath type instead of elementData.type
   * @returns {Promise<WebElement[]>} Qualified elements from all frames and shadow roots.
   */
  async _scanFramesForElements(elementData, xpathType) {
    const found = [];

    // Get all frame indices: -1 means default content, 0+ are frame indices
    let frames;
    try {
      frames = await this.driver.findElements(By.xpath('//iframe'));
    } catch {
      frames = []; // No frames found
    }

    const frameIndices = [-1, ...frames.keys()]; // -1 = default content

    // Scan each frame
    for (const frameIndex of frameIndices) {
      const result = await this._withContext(frameIndex, async () => {
        try {
          const xpaths = this.getSelectors(elementData.id, elementData.exact);
          const targetXpath = xpathType 
            ? xpaths[xpathType] 
            : (xpaths[elementData.type] || xpaths['element']);

          let elements;
          try {
            elements = await this.driver.findElements(By.xpath(targetXpath));
          } catch (err) {
            if (this.debug) {
              console.warn(`XPath query failed in frame ${frameIndex}:`, err.message);
            }
            return [];
          }

          if (elements.length === 0) return [];

          // Tag each element with its frame for later context switching
          elements.forEach(el => el.frame = frameIndex);

          // Add bounding box metadata
          const qualified = await this.addQualifiers(elements);

          // Filter by visibility settings
          const visibilityFilter = elementData.hidden
            ? (e) => e.rect.height < 1 || e.rect.width < 1  // Only hidden elements
            : (e) => e.rect.height > 0 && e.rect.width > 0;  // Only visible elements

          const filtered = qualified.filter(visibilityFilter);
          return filtered;
        } catch (err) {
          if (this.debug) {
            console.error(`Error scanning frame ${frameIndex}:`, err.message);
          }
          return [];
        }
      });

      // _withContext returns null if frame unavailable, filter those out
      if (result && Array.isArray(result)) {
        found.push(...result);
      }

      // Also scan shadow roots within this frame
      const shadowResults = await this._withContext(frameIndex, async () => {
        return await this._scanShadowRootsForElements(elementData, frameIndex);
      });

      if (shadowResults && Array.isArray(shadowResults)) {
        found.push(...shadowResults);
      }
    }

    return found;
  }

  /**
   * Finds all matching elements across all frames using a two-pass strategy.
   *
   * **Pass 1: Direct Matching**
   * Query using the requested element type's XPath selector (e.g., 'button', 'textbox').
   * Returns immediately if matches found.
   *
   * **Pass 2: Fallback - Nearest Matching**
   * If Pass 1 finds nothing, searches for generic "element" matches and calculates
   * the nearest one of the target type using Euclidean distance. This handles:
   * - Custom UI components that don't match semantic constraints
   * - Unusual markup patterns that aren't captured by type selectors
   * - Layout quirks where the intended element exists but under different tag
   *
   * Results are qualified with bounding-box metadata and filtered by visibility
   * (or hidden status, if `elementData.hidden` is true).
   *
   * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`.
   * @returns {Promise<WebElement[]>} Array of qualified matching elements across frames.
   */
  async findElements(elementData) {
    // PASS 1: Try direct type matching
    let found = await this._scanFramesForElements(elementData);

    if (found.length > 0) {
      return found; // Success - return immediately
    }

    // PASS 2: Fallback strategy - find nearest element of target type
    if (this.debug) {
      console.warn(`No direct matches for '${elementData.id}' of type '${elementData.type}'. Using fallback: nearest element strategy.`);
    }

    let frames;
    try {
      frames = await this.driver.findElements(By.xpath('//iframe'));
    } catch {
      frames = [];
    }

    const frameIndices = [-1, ...frames.keys()];

    for (const frameIndex of frameIndices) {
      const result = await this._withContext(frameIndex, async () => {
        try {
          // Find generic elements matching the search text
          const xpaths = this.getSelectors(elementData.id, elementData.exact);
          const genericElements = await this.driver.findElements(By.xpath(xpaths['element']));
          
          if (genericElements.length === 0) {
            return [];
          }

          // For each generic match, find nearest element of the target type
          const nearestElements = [];
          for (const element of genericElements) {
            try {
              const nearest = await this.nearestElement(element, elementData.type);
              
              // Only include if it's a different element (avoid including the match itself)
              if (nearest !== element) {
                nearestElements.push(nearest);
              }
            } catch (err) {
              if (this.debug) {
                console.warn(`Failed to find nearest '${elementData.type}' near generic match:`, err.message);
              }
              // Continue with next generic match
            }
          }

          if (nearestElements.length === 0) {
            return [];
          }

          // Tag with frame and qualify
          nearestElements.forEach(el => el.frame = frameIndex);

          const qualified = await this.addQualifiers(nearestElements);
          
          // Apply visibility filter
          const visibilityFilter = elementData.hidden
            ? (e) => e.rect.height < 1 || e.rect.width < 1
            : (e) => e.rect.height > 0 && e.rect.width > 0;

          return qualified.filter(visibilityFilter);
        } catch (err) {
          if (this.debug) {
            console.error(`Fallback search failed in frame ${frameIndex}:`, err.message);
          }
          return [];
        }
      });

      if (result && Array.isArray(result)) {
        found.push(...result);
      }
    }

    return found;
  }

  /**
   * Processes a selector stack and resolves each item into actual WebElement(s).
   *
   * Iterates through the stack and calls findElements() for any item that:
   * - Has a valid element type (button, textbox, element, etc.)
   * - Has not yet been resolved (no matches yet)
   *
   * Processes sequentially because frame switching is stateful on the driver.
   * Other stack items (like 'location' or 'condition') are passed through unchanged.
   *
   * @param {Object[]} stack - Array of selector descriptor items from the stack builder.
   * @returns {Promise<Object[]>} Resolved stack with `matches` arrays populated.
   */
  async resolveElements(stack) {
    // Valid element types that can be resolved
    const ELEMENT_TYPES = new Set([
      'link', 'navigation', 'heading',
      'button', 'checkbox', 'switch', 'radio', 'slider', 'dropdown',
      'textbox', 'file',
      'list', 'listitem', 'menu', 'menuitem',
      'toolbar', 'dialog',
      'table', 'row', 'column',
      'image',
      'element'
    ]);

    const resolvedStack = [];

    for (const item of stack) {
      const newItem = { ...item };

      // Only resolve items that are element types and don't have matches yet
      if (ELEMENT_TYPES.has(newItem.type) && (!newItem.matches || newItem.matches.length === 0)) {
        try {
          newItem.matches = await this.findElements(newItem);
        } catch (err) {
          if (this.debug) {
            console.error(`Failed to resolve element '${newItem.id}' of type '${newItem.type}':`, err.message);
          }
          newItem.matches = []; // Empty matches on error
        }
      }

      resolvedStack.push(newItem);
    }

    return resolvedStack;
  }

  /**
   * Resolves a selector stack into a single WebElement.
   *
   * **Algorithm:**
   * 1. Resolve all stack items into WebElement arrays
   * 2. Process stack from BOTTOM TO TOP (reverse order):
   *    - Spatial filters are paired with their target element
   *    - Apply spatial constraint to filter matches
   *    - Select by index (1-based), defaulting to first match
   * 3. Ensure driver is in correct frame before returning
   * 4. Apply debug highlighting if enabled
   *
   * **Error Handling:**
   * - Throws ReferenceError if any step yields zero matches
   * - Includes stack context in error message for debugging
   *
   * @param {Object[]} stack - Array of selector descriptor items from the stack builder.
   * @returns {Promise<WebElement>} The final resolved WebElement.
   * @throws {ReferenceError} If a matching element is not found at any stack level.
   */
  async find(stack) {
    // Clear shadow cache at the start of each top-level resolution
    this.#shadowCache.clear();
    const data = await this.resolveElements(stack);
    let currentElement = null;
    let currentMatches = [];

    // Process from bottom of stack up
    for (let i = data.length - 1; i >= 0; i--) {
      const item = data[i];

      try {
        if (item.type === 'location') {
          // Spatial filter: current item is location, target is next item
          const target = data[--i];
          
          // For 'within', pass all matches so filter can check against multiple references
          const refElement = item.located === 'within' ? currentMatches : currentElement;
          
          const results = await this.relativeSearch(target, item, refElement);
          currentElement = results[target.index ? target.index - 1 : 0];
          currentMatches = results;
        } else {
          // Regular element: apply spatial filter (even if no spatial constraint)
          const results = await this.relativeSearch(item);
          currentElement = results[item.index ? item.index - 1 : 0];
          currentMatches = results;
        }

        if (!currentElement) {
          const location = item.type === 'location' ? ` ${item.located}` : '';
          throw new ReferenceError(`Matching element for '${item.id}'${location} not found.`);
        }
      } catch (err) {
        if (err instanceof ReferenceError) {
          throw err; // Re-throw ReferenceErrors as-is
        }
        // Wrap other errors with context
        throw new Error(`Stack resolution failed at index ${i}: ${err.message}`, { cause: err });
      }
    }

    // Ensure driver is in the correct frame for the final element
    try {
      await this.driver.switchTo().defaultContent();
      if (currentElement.frame >= 0) {
        await this.driver.switchTo().frame(currentElement.frame);
      }
    } catch (err) {
      if (this.debug) {
        log.warn('Failed to switch to final element frame:', err.message);
      }
      // Don't throw - element may still be valid even if frame switch fails
    }

    // Highlight the element with a thick red box when debug is enabled
    if (this.debug) {
      try {
        await this.driver.executeScript(`
          const el = arguments[0];
          el.style.outline = '4px solid red';
          el.style.outlineOffset = '2px';
        `, currentElement);
      } catch (err) {
        log.warn('Failed to highlight element:', err.message);
      }
    }

    return currentElement;
  }

  /**
   * Resolves the entire stack and returns all matching elements.
   *
   * **Algorithm:**
   * 1. Resolve all stack items into WebElement arrays
   * 2. Process stack from BOTTOM TO TOP:
   *    - Apply spatial filters if present
   *    - Keep ALL matches (not just first)
   *    - Use first match as context for next level's spatial filter
   * 3. Return complete array of final matches
   *
   * Used for fetching multiple elements matching criteria, supporting OR conditions
   * and spatial/relative searches on the entire result set.
   *
   * @param {Object[]} stack - Array of selector descriptor items from the stack builder.
   * @returns {Promise<WebElement[]>} Array of all matching WebElements.
   * @throws {ReferenceError} If any step in the chain yields zero matches.
   */
  async findAll(stack) {
    // Clear shadow cache at the start of each top-level resolution
    this.#shadowCache.clear();
    // 1. Resolve all stack items into physical WebElements
    const data = await this.resolveElements(stack);

    let elements = [];
    let currentContextElement = null;
    let currentMatches = [];

    // 2. Traverse the stack from bottom to top (Reverse)
    for (let i = data.length - 1; i >= 0; i--) {
      const item = data[i];
      const isLocation = item.type === 'location';

      try {
        if (isLocation) {
          // Spatial location: current is the filter, next is the target element
          const target = data[--i];

          // For 'within', pass all matches for multi-reference filtering
          const refElement = item.located === 'within' ? currentMatches : currentContextElement;
          elements = await this.relativeSearch(target, item, refElement);
        } else {
          // Regular element: apply any spatial filter (or pass through if none)
          elements = await this.relativeSearch(item);
        }

        // Set context for next level: use first match as reference point
        currentContextElement = elements[0];
        currentMatches = elements;

        if (elements.length === 0) {
          const location = isLocation ? ` ${item.located}` : '';
          throw new ReferenceError(
            `'${item.id}'${location} resulted in 0 matching elements.`
          );
        }
      } catch (err) {
        if (err instanceof ReferenceError) {
          throw err;
        }
        throw new Error(`Stack resolution failed at index ${i}: ${err.message}`, { cause: err });
      }
    }

    // Highlight all elements with debug outline
    if (this.debug && elements.length > 0) {
      try {
        await this.driver.executeScript(`
          Array.from(arguments).forEach(el => {
            el.style.outline = '4px solid red';
            el.style.outlineOffset = '2px';
          });
        `, ...elements);
      } catch (err) {
        console.warn('Failed to highlight elements:', err.message);
      }
    }

    // 3. Return the final collection of elements
    return elements;
  }
}