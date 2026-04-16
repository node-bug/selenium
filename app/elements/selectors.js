export class Selectors {
  constructor() {
    this.attributes = [
      'placeholder', 'value', 'data-test-id', 'data-testid', 'id',
      'resource-id', 'name', 'aria-label', 'class', 'hint', 
      'title', 'tooltip', 'alt', 'src', 'role'
    ];
  }

  /**
   * Properly escapes strings for XPath 1.0.
   * Logic: If it contains a single quote, wrap in concat() and escape.
   */
  transform(value) {
    if (!value.includes("'")) return `'${value}'`;
    
    const parts = value.split("'");
    const escaped = parts.map(part => `'${part}'`).join(',"\'",');
    return `concat(${escaped})`;
  }

  /**
   * Generates a combined matcher for all attributes and text content
   */
  buildMatcher(value, exact = false) {
    const val = this.transform(value);
    
    // Choose the XPath comparison method
    const conditionFn = (target) => exact 
      ? `normalize-space(${target})=${val}` 
      : `contains(normalize-space(${target}),${val})`;

    // Build array of attribute conditions + the dot (text content) condition
    const conditions = [...this.attributes.map(attr => `@${attr}`), '.']
      .map(target => conditionFn(target));

    const baseCondition = conditions.join(' or ');
    
    // Recursive check to ensure we select the innermost element containing the text
    const recursionPreventer = exact 
      ? `not(.//*[normalize-space(.)=${val}])` 
      : `not(.//*[contains(normalize-space(.),${val})])`;

    return `${baseCondition} and ${recursionPreventer}`;
  }

  /**
   * Returns an object of XPaths mapped to element types
   */
  getSelectors(value, exact = false) {
    const matcherStr = this.buildMatcher(value, exact);
    
    const definitions = {
      link: `@href`,
      tab: `@role='tab'`,
      button: `@role='button' or @type='button' or @type='submit' or self::button`,
      toolbar: `@role='toolbar'`,
      radio: `@role='radio'`,
      textbox: `@role='textbox' or @type='search' or @type='email' or self::textarea or (self::input and (@type='text' or @type='password'))`,
      checkbox: `@role='checkbox' or @type='checkbox'`,
      image: `self::img`,
      dialog: `@role='dialog'`,
      file: `@role='file' or @type='file'`,
      element: `true()` // Matches any element fulfilling the text/attr criteria
    };

    // Convert definitions into full XPaths
    return Object.fromEntries(
      Object.entries(definitions).map(([name, constraint]) => [
        name, `//*[(${matcherStr}) and (${constraint})]`
      ])
    );
  }
}