/**
 * Element type definitions and XPath selector generation.
 * 
 * Defines 20+ semantic element types with their XPath constraints.
 * Provides utilities for building XPath expressions that match by:
 * - Element tag (button, link, etc.)
 * - ARIA role (@role='button', etc.)
 * - Type attribute (@type='button', etc.)
 * - Meaningful attributes (@href, @placeholder, etc.)
 */

import { escapeXPathString } from './xpath-builder.js';

/**
 * Element type definitions mapping names to XPath constraints.
 * Each constraint is an XPath predicate that matches elements of that type.
 */
const ELEMENT_DEFINITIONS = {
  // Navigation & Structure
  link: `self::a or @role='link' or @href`,
  navigation: `@role='navigation' or self::nav`,
  heading: `@role='heading' or self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::h6`,

  // Interactive Controls
  button: `self::button or @role='button' or @type='button' or @type='submit'`,
  checkbox: `(self::input and @type='checkbox') or @role='checkbox'`,
  switch: `self::button[@role='switch'] or (self::input and @type='checkbox') or @role='switch'`,
  slider: `self::input[@type='range'] or @role='slider'`,
  radio: `(self::input and @type='radio') or @role='radio'`,
  
  // Dropdown: native <select> and custom combobox widgets
  dropdown: `(self::select[descendant::option] or @role='combobox' or @role='listbox' or contains(@class, 'dropdown') or contains(@class, 'trigger') or ancestor::*[contains(@class, 'dropdown') or @role='combobox'])`,

  // Forms & Inputs
  textbox: `self::textarea or (self::input and (@type='text' or @type='password' or @type='search' or @type='email')) or @role='textbox'`,
  file: `self::input and @type='file'`,

  // Lists & Menus
  list: `self::ul or self::ol or @role='list'`,
  listitem: `self::li or @role='listitem'`,
  menu: `self::menu or @role='menu'`,
  menuitem: `@role='menuitem'`,

  // Containers & Layout
  toolbar: `@role='toolbar'`,
  dialog: `@role='dialog'`,

  // Tables / Grids
  table: `self::table or @role='table'`,
  row: `self::tr or @role='row'`,
  column: `self::td or self::th or @role='cell' or @role='gridcell' or @role='columnheader'`,

  // Media
  image: `self::img or @role='img' or @alt`,

  // Global Fallback
  element: `true()`
};

/**
 * Searchable attributes prioritized for element matching.
 * Order matters: attributes are checked in this order.
 */
const SEARCHABLE_ATTRIBUTES = [
  'placeholder', 'value', 'data-test-id', 'data-testid', 'id',
  'resource-id', 'name', 'aria-label', 'class', 'hint',
  'title', 'tooltip', 'alt', 'src', 'aria-labelledby'
];

/**
 * Gets all supported element type names.
 * 
 * @returns {string[]} Array of element type names
 */
export function getElementTypeNames() {
  return Object.keys(ELEMENT_DEFINITIONS);
}

/**
 * Gets the XPath constraint for a specific element type.
 * 
 * @param {string} type - Element type name
 * @returns {string} XPath constraint expression
 */
export function getElementTypeConstraint(type) {
  return ELEMENT_DEFINITIONS[type] || ELEMENT_DEFINITIONS.element;
}

/**
 * Gets all searchable attributes.
 * 
 * @returns {string[]} Array of attribute names
 */
export function getSearchableAttributes() {
  return [...SEARCHABLE_ATTRIBUTES];
}

/**
 * Builds an XPath matcher expression for text and attribute matching.
 * 
 * Combines conditions for each searchable attribute and text content with OR logic.
 * Applies a recursion guard to prevent matching parent wrappers.
 * Excludes script/style tags.
 * 
 * **Example Generated XPath:**
 * For searching "Click Me" (substring):
 * ```
 * (contains(normalize-space(@placeholder),"Click Me") or 
 *  contains(normalize-space(@value),"Click Me") or
 *  ... or
 *  contains(normalize-space(.),"Click Me")) and
 * not(.//*[contains(normalize-space(.),"Click Me")]) and
 * not(self::script) and not(self::style)
 * ```
 * 
 * @param {string|null} value - Text/attribute value to match (null for type-only selector)
 * @param {boolean} [exact] - Use exact (=) or substring (contains) matching
 * @returns {string} XPath expression fragment
 */
export function buildTextAttributeMatcher(value, exact = false) {
  if (value === null || value === undefined) {
    return 'true()'; // No text constraint
  }

  const val = escapeXPathString(value);
  const normalizedVal = `normalize-space(${val})`;

  // Build conditions for all attributes + text content
  const conditions = SEARCHABLE_ATTRIBUTES.map(attr => 
    exact 
      ? `normalize-space(@${attr})=${normalizedVal}`
      : `contains(normalize-space(@${attr}),${normalizedVal})`
  );
  
  // Add text content condition
  conditions.push(
    exact 
      ? `normalize-space(.)=${normalizedVal}`
      : `contains(normalize-space(.),${normalizedVal})`
  );

  // Base condition: any attribute or text matches
  const baseCondition = `(${conditions.join(' or ')})`;

  // Recursion guard: no child element should match the same text
  const recursionPreventer = exact
    ? `not(.//*[normalize-space(.)=${normalizedVal}])`
    : `not(.//*[contains(normalize-space(.),${normalizedVal})])`;

  // Metadata guards: ignore script/style tags
  const metaGuards = `not(self::script) and not(self::style)`;

  return `${baseCondition} and ${recursionPreventer} and ${metaGuards}`;
}

/**
 * Generates complete XPath selectors for all element types.
 * 
 * **When value is null/undefined:**
 * Returns selectors matching ANY element of each type (type constraint only).
 * Used for: `browser.button()` finds any button.
 * 
 * **When value is provided:**
 * Returns selectors combining type + text/attribute matching.
 * Used for: `browser.button('Click Me')` finds matching buttons.
 * 
 * **Return Format:**
 * ```javascript
 * {
 *   button: "//*[(matcher) and (type_constraint)]",
 *   textbox: "//*[(matcher) and (type_constraint)]",
 *   ...
 * }
 * ```
 * 
 * @param {string|null} value - Text/attribute value to match (null for type-only)
 * @param {boolean} [exact] - Exact or substring matching
 * @returns {Object.<string, string>} Map of element types to full XPath selectors
 */
export function generateXPathSelectors(value, exact = false) {
  // Type-only selectors
  if (value === null || value === undefined) {
    return Object.fromEntries(
      Object.entries(ELEMENT_DEFINITIONS).map(([name, constraint]) => [
        name, `//*[${constraint}]`
      ])
    );
  }

  // Combined selectors: type + text/attribute matching
  const matcherStr = buildTextAttributeMatcher(value, exact);
  const val = escapeXPathString(value);

  return Object.fromEntries(
    Object.entries(ELEMENT_DEFINITIONS).map(([name, constraint]) => {
      // Special case for dropdown: also match by option text
      if (name === 'dropdown') {
        const optionMatch = exact 
          ? `self::select[descendant::option[normalize-space(.)=${val}]]`
          : `self::select[descendant::option[contains(normalize-space(.),${val})]]`;
        return [name, `//*[(${matcherStr}) and (${constraint}) or (${optionMatch})]`];
      }
      return [name, `//*[(${matcherStr}) and (${constraint})]`];
    })
  );
}

/**
 * Checks if a type name is valid.
 * 
 * @param {string} type - Type name to check
 * @returns {boolean} True if type is defined
 */
export function isValidElementType(type) {
  return type in ELEMENT_DEFINITIONS;
}

/**
 * Gets all valid element type names for error messages.
 * 
 * @returns {string} Comma-separated list of valid types
 */
export function getValidElementTypesText() {
  return Object.keys(ELEMENT_DEFINITIONS).join(', ');
}
