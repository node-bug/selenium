/**
 * Element type definitions and XPath builder for semantic element matching.
 *
 * Defines constraints for 20+ element types (button, textbox, link, etc.) using
 * semantic HTML, ARIA roles, and common attributes. Provides utilities for building
 * XPath expressions that match by:
 * - Element tag (self::button, self::a, etc.)
 * - ARIA role (@role='button', @role='link', etc.)
 * - Type attribute (@type='button', @type='submit', etc.)
 * - Other meaningful attributes (@href, @placeholder, etc.)
 *
 * The {@link buildMatcher} method combines these constraints with text content
 * matching (exact or substring) and includes a recursion guard to ensure only
 * the innermost matching element is returned (avoiding parent wrapper elements).
 *
 * ## Supported Element Types (20+)
 * - Navigation: link, navigation, heading
 * - Interactive: button, checkbox, switch, radio, slider, dropdown, textbox, file
 * - Structure: list, listitem, menu, menuitem, toolbar, dialog
 * - Tables: table, row, column
 * - Media: image
 * - Fallback: element (matches anything)
 */
export class ElementTypes {
  /**
   * Initializes the list of searchable attributes and the element-type-to-constraint map.
   * 
   * **Searchable Attributes** (in order of priority):
   * - placeholder, value: form input defaults
   * - data-test-id, data-testid: common testing attributes
   * - id, resource-id: unique identifiers
   * - name: form field names
   * - aria-label: accessibility labels
   * - class: CSS class matching
   * - hint, title, tooltip, alt: alternative text sources
   * - src: image/script sources
   * - aria-labelledby: references to external labels
   *
   * Note: 'role' is excluded to avoid duplicate matching with XPath constraints.
   */
  constructor() {
    /**
     * HTML attributes checked when building XPath matchers.
     * Note: 'role' is excluded to avoid duplicate matching with XPath constraints.
     * @type {string[]}
     */
    this.attributes = [
      'placeholder', 'value', 'data-test-id', 'data-testid', 'id',
      'resource-id', 'name', 'aria-label', 'class', 'hint',
      'title', 'tooltip', 'alt', 'src', 'aria-labelledby'
    ];

    /**
     * Element type to XPath constraint mappings.
     * Each value is an XPath predicate that matches elements of that type.
     * Used in conjunction with text/attribute matchers to create full XPath queries.
     */
    this.definitions = {
      // ===== Navigation & Structure =====
      link: `self::a or @role='link' or @href`,
      navigation: `@role='navigation' or self::nav`,
      heading: `@role='heading' or self::h1 or self::h2 or self::h3 or self::h4 or self::h5 or self::h6`,

      // ===== Interactive Controls =====
      button: `self::button or @role='button' or @type='button' or @type='submit'`,
      checkbox: `(self::input and @type='checkbox') or @role='checkbox'`,
      switch: `self::button[@role='switch'] or (self::input and @type='checkbox') or @role='switch'`,
      slider: `self::input[@type='range'] or @role='slider'`,
      radio: `(self::input and @type='radio') or @role='radio'`,
      
      // Dropdown: Handles native <select> and custom combobox widgets
      dropdown: `(self::select[descendant::option] or @role='combobox' or @role='listbox' or contains(@class, 'dropdown') or contains(@class, 'trigger') or ancestor::*[contains(@class, 'dropdown') or @role='combobox'])`,

      // ===== Forms & Inputs =====
      textbox: `self::textarea or (self::input and (@type='text' or @type='password' or @type='search' or @type='email')) or @role='textbox'`,
      file: `self::input and @type='file'`,

      // ===== Lists & Menus =====
      list: `self::ul or self::ol or @role='list'`,
      listitem: `self::li or @role='listitem'`,
      menu: `self::menu or @role='menu'`,
      menuitem: `@role='menuitem'`,

      // ===== Containers & Layout =====
      toolbar: `@role='toolbar'`,
      dialog: `@role='dialog'`,

      // ===== Tables / Grids =====
      table: `self::table or @role='table'`,
      row: `self::tr or @role='row'`,
      column: `self::td or self::th or @role='cell' or @role='gridcell' or @role='columnheader'`,

      // ===== Media =====
      image: `self::img or @role='img' or @alt`,

      // ===== Global Fallback =====
      element: `true()` // Matches any element (when used with text/attr matcher)
    };
  }

  /**
   * Properly escapes strings for XPath 1.0 expressions.
   *
   * XPath 1.0 doesn't support string escaping, so values containing single quotes
   * must be wrapped in a `concat()` expression. Example:
   * - Input: "O'Reilly" → Output: concat('O', "'", 'Reilly')
   * - Input: "Normal" → Output: 'Normal'
   *
   * @param {*} value - The string value to escape (null/undefined returns empty string literal).
   * @returns {string} A valid XPath string literal or `concat()` expression.
   */
  transform(value) {
    // Handle null/undefined
    if (value === null || value === undefined) return "''";
    
    const str = String(value);
    
    // If no single quotes, use simple string literal
    if (!str.includes("'")) {
      return `'${str}'`;
    }
    
    // Split on single quotes and create concat() expression
    const parts = str.split("'");
    const escaped = parts.map(part => `'${part}'`).join(',"\'",');
    return `concat(${escaped})`;
  }

  /**
   * Generates a comprehensive XPath matcher expression for text and attribute matching.
   *
   * **Matching Strategy:**
   * 1. Build conditions for EACH searchable attribute (15+ attributes)
   * 2. Add condition for element's text content (.)
   * 3. Combine all conditions with OR (match if ANY condition is true)
   * 4. Apply recursion guard: ensure no child element contains the same text
   *    - This prevents matching parent wrappers that contain the target element
   * 5. Exclude script/style tags (metadata that shouldn't be searched)
   *
   * **Exact vs Substring Matching:**
   * - `exact=true`: Use `normalize-space()=value` (full match after whitespace normalization)
   * - `exact=false`: Use `contains(normalize-space(), value)` (substring match)
   *
   * **Example Generated XPath:**
   * For searching "Click Me" as substring:
   * ```
   * (contains(normalize-space(@placeholder),"Click Me") or 
   *  contains(normalize-space(@value),"Click Me") or
   *  contains(normalize-space(.),"Click Me") or
   *  ...) and
   * not(.//*[contains(normalize-space(.),"Click Me")]) and
   * not(self::script) and not(self::style)
   * ```
   *
   * @param {string} value - The text or attribute value to match against.
   * @param {boolean} [exact=false] - If true, uses exact equality; if false, uses substring matching.
   * @returns {string} An XPath expression fragment for embedding in a larger query.
   */
  buildMatcher(value, exact = false) {
    const val = this.transform(value);
    const normalizedVal = `normalize-space(${val})`;

    // Build conditions for all attributes + text content
    const conditions = this.attributes.map(attr => 
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

    // Base condition: any attribute or text content matches
    const baseCondition = `(${conditions.join(' or ')})`;

    // Recursion guard: ensure no child element contains the same text
    // This prevents matching parent <div> that wraps the target <button>
    const recursionPreventer = exact
      ? `not(.//*[normalize-space(.)=${normalizedVal}])`
      : `not(.//*[contains(normalize-space(.),${normalizedVal})])`;

    // Metadata guards: don't match content inside script/style tags
    const metaGuards = `not(self::script) and not(self::style)`;

    return `${baseCondition} and ${recursionPreventer} and ${metaGuards}`;
  }

  /**
   * Generates a complete set of XPath selectors for all element types.
   *
   * **When value is null/undefined:**
   * Returns selectors that match ANY element of each type (no text/attribute constraints).
   * Used for selecting elements by type alone: `browser.button()` finds any button.
   *
   * **When value is provided:**
   * Returns selectors combining the type constraint with text/attribute matching.
   * Example: `browser.button('Click Me')` finds buttons with "Click Me" in text/attrs.
   *
   * **Return Format:**
   * Object mapping element type names to full XPath strings:
   * ```javascript
   * {
   *   button: "//*[(matcher_expression) and (type_constraint)]",
   *   textbox: "//*[(matcher_expression) and (type_constraint)]",
   *   ...
   * }
   * ```
   *
   * @param {string} value - The text or attribute value to match (null/undefined for type-only).
   * @param {boolean} [exact=false] - Whether to use exact or substring matching.
   * @returns {Object.<string, string>} Map of element type names to full XPath selectors.
   */
  getSelectors(value, exact = false) {
    // Type-only selectors: match any element of the type (no text constraint)
    if (value === null || value === undefined) {
      return Object.fromEntries(
        Object.entries(this.definitions).map(([name, constraint]) => [
          name, `//*[${constraint}]`
        ])
      );
    }

    // Combined selectors: match by type AND text/attribute content
    const matcherStr = this.buildMatcher(value, exact);
    const val = this.transform(value);

    return Object.fromEntries(
      Object.entries(this.definitions).map(([name, constraint]) => {
        // Special case for dropdown: also match select elements that contain matching option text
        // This requires a different matcher without the recursion guard
        if (name === 'dropdown') {
          // Build a matcher that allows matching select elements by their option text
          const optionMatch = exact 
            ? `self::select[descendant::option[normalize-space(.)=${val}]]`
            : `self::select[descendant::option[contains(normalize-space(.),${val})]]`;
          // Use the standard matcher OR the option match (which doesn't have recursion guard)
          return [name, `//*[(${matcherStr}) and (${constraint}) or (${optionMatch})]`];
        }
        return [name, `//*[(${matcherStr}) and (${constraint})]`];
      })
    );
  }
}