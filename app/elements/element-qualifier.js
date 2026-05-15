/**
 * Element qualification utilities.
 * 
 * Adds bounding box metadata and other qualifiers to WebElements
 * for use in spatial filtering and positioning calculations.
 */

/**
 * Qualifies WebElements by injecting bounding box metadata.
 * Executes getBoundingClientRect() for each element in the browser.
 * 
 * Adds to each element:
 * - tagName (lowercased)
 * - rect object with position/size and calculated midpoints
 * 
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {WebElement|WebElement[]|null} elements - Element(s) to qualify
 * @returns {Promise<WebElement[]>} Qualified elements with rect metadata
 * @throws {Error} If script execution fails
 */
export async function addBoundingBoxMetadata(driver, elements) {
  // Handle null/undefined/empty inputs
  if (!elements) return [];
  
  const targets = Array.isArray(elements) ? elements : [elements];
  if (targets.length === 0) return [];

  try {
    // Execute once in browser to get all coordinates atomically
    const stats = await driver.executeScript(`
      return Array.from(arguments).map(el => {
        try {
          const r = el.getBoundingClientRect();
          return {
            x: r.x,
            y: r.y,
            width: r.width,
            height: r.height,
            top: r.top,
            bottom: r.bottom,
            left: r.left,
            right: r.right,
            tagName: el.tagName || 'unknown'
          };
        } catch (e) {
          // Element became stale or detached
          return null;
        }
      });
    `, ...targets);

    // Map stats back to elements, filtering out failures
    return targets
      .map((el, i) => {
        const s = stats[i];
        if (!s) return null; // Stale element
        
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
    console.error('Error adding bounding box metadata:', err.message);
    return [];
  }
}

/**
 * Filters out zero-dimension (invisible) elements from a qualified element list.
 * 
 * @param {WebElement[]} elements - Qualified elements with rect metadata
 * @param {boolean} [includeHidden] - If true, keep hidden elements; if false, filter them out
 * @returns {WebElement[]} Filtered elements
 */
export function filterByVisibility(elements, includeHidden = false) {
  if (!elements || !Array.isArray(elements)) return [];

  return elements.filter(el => {
    if (!el.rect) return false;
    const isVisible = el.rect.height > 0 && el.rect.width > 0;
    return includeHidden ? !isVisible : isVisible;
  });
}

/**
 * Highlights WebElements with a visual outline (for debugging).
 * 
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {WebElement|WebElement[]} elements - Element(s) to highlight
 * @param {string} [color] - Outline color (default: 'red')
 * @param {number} [width] - Outline width in pixels (default: 4)
 * @returns {Promise<void>}
 */
export async function highlightElements(driver, elements, color = 'red', width = 4) {
  if (!elements) return;

  const targets = Array.isArray(elements) ? elements : [elements];
  if (targets.length === 0) return;

  try {
    await driver.executeScript(`
      Array.from(arguments).forEach(el => {
        el.style.outline = '${width}px solid ${color}';
        el.style.outlineOffset = '2px';
      });
    `, ...targets);
  } catch (err) {
    console.warn('Failed to highlight elements:', err.message);
  }
}

/**
 * Removes highlighting from WebElements (inverse of highlightElements).
 * 
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {WebElement|WebElement[]} elements - Element(s) to unhighlight
 * @returns {Promise<void>}
 */
export async function unhighlightElements(driver, elements) {
  if (!elements) return;

  const targets = Array.isArray(elements) ? elements : [elements];
  if (targets.length === 0) return;

  try {
    await driver.executeScript(`
      Array.from(arguments).forEach(el => {
        el.style.outline = '';
        el.style.outlineOffset = '';
      });
    `, ...targets);
  } catch (err) {
    console.warn('Failed to unhighlight elements:', err.message);
  }
}

/**
 * Validates that an element has required metadata.
 * 
 * @param {WebElement} element - Element to validate
 * @param {string[]} [requiredFields] - Fields to check (default: rect, tagName)
 * @returns {boolean} True if element has all required metadata
 */
export function isQualified(element, requiredFields = ['rect', 'tagName']) {
  if (!element) return false;
  return requiredFields.every(field => field in element && element[field] !== undefined);
}

/**
 * Verifies element is still accessible and hasn't become stale.
 * 
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {WebElement} element - Element to verify
 * @returns {Promise<boolean>} True if element is still valid
 */
export async function isElementValid(driver, element) {
  try {
    // Simple check: try to get element's tag name
    await driver.executeScript('return arguments[0].tagName;', element);
    return true;
  } catch {
    return false;
  }
}

/**
 * Re-qualifies an element (refreshes bounding box metadata).
 * Useful after page resize or DOM changes.
 * 
 * @param {WebDriver} driver - Selenium WebDriver instance
 * @param {WebElement} element - Element to re-qualify
 * @returns {Promise<WebElement|null>} Re-qualified element or null if stale
 */
export async function requalifyElement(driver, element) {
  const qualified = await addBoundingBoxMetadata(driver, element);
  return qualified.length > 0 ? qualified[0] : null;
}
