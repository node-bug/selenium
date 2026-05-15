/**
 * XPath builder utilities for constructing and converting XPath expressions.
 * 
 * Separates XPath generation logic from element finding strategy.
 * Handles:
 * - String transformation and escaping for XPath 1.0
 * - XPath constraint to JavaScript conversion
 * - Attribute and text content matching
 */

/**
 * Escapes strings for XPath 1.0 expressions.
 * XPath 1.0 doesn't support backslash escaping, so values with single quotes
 * must use concat() expressions.
 * 
 * @param {*} value - String value (null/undefined returns empty string)
 * @returns {string} Valid XPath string literal or concat() expression
 */
export function escapeXPathString(value) {
  if (value === null || value === undefined) return "''";
  
  const str = String(value);
  if (!str.includes("'")) {
    return `'${str}'`;
  }
  
  // Split on single quotes and create concat() expression
  const parts = str.split("'");
  const escaped = parts.map(part => `'${part}'`).join(',"\'",');
  return `concat(${escaped})`;
}

/**
 * Splits a string by delimiter, respecting bracket nesting.
 * Used to correctly parse ' or ' / ' and ' in XPath constraints.
 * 
 * @param {string} str - String to split
 * @param {string} delimiter - Delimiter pattern
 * @returns {string[]} Split parts
 */
export function splitOutsideBrackets(str, delimiter) {
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
 * @param {string} str - String to check
 * @returns {boolean} True if balanced
 */
export function isBalanced(str) {
  let depth = 0;
  for (const ch of str) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
}

/**
 * Converts XPath constraint expressions to JavaScript boolean expressions.
 * Handles: self::tag, @attr='value', contains(), or/and operators.
 * 
 * @param {string} constraint - XPath constraint
 * @returns {string} JavaScript boolean expression
 */
export function xpathConstraintToJS(constraint) {
  if (constraint === 'true()') return 'true';

  // Split by ' or ' (lowest precedence), respecting brackets
  const orParts = splitOutsideBrackets(constraint, ' or ');
  if (orParts.length > 1) {
    return orParts.map(p => xpathConstraintToJS(p.trim())).join(' || ');
  }

  // Split by ' and '
  const andParts = splitOutsideBrackets(constraint, ' and ');
  if (andParts.length > 1) {
    return andParts.map(p => xpathConstraintToJS(p.trim())).join(' && ');
  }

  const c = constraint.trim();

  // self::tagname[predicate]
  const selfPredMatch = c.match(/^self::(\w+)\[(.+)\]$/);
  if (selfPredMatch) {
    const tag = selfPredMatch[1];
    const pred = selfPredMatch[2];
    return `(elTag === '${tag}' && ${xpathConstraintToJS(pred)})`;
  }

  // self::tagname
  const selfMatch = c.match(/^self::(\w+)$/);
  if (selfMatch) return `elTag === '${selfMatch[1]}'`;

  // @role='value' or @type='value' or @href (existence check)
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
  if (parenMatch && isBalanced(parenMatch[1])) {
    return `(${xpathConstraintToJS(parenMatch[1])})`;
  }

  // self::select[descendant::option[...]]
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

  // self::select[descendant::option]
  if (c === 'self::select[descendant::option]') {
    return 'el.options.length > 0';
  }

  // ancestor::*[contains(...)]
  const ancMatch = c.match(/^ancestor::\*\[(.+)\]$/);
  if (ancMatch) {
    const innerExpr = xpathConstraintToJS(ancMatch[1]);
    return `!!el.closest('*') && (() => { const p = el.closest('*'); return ${innerExpr.replace(/\bel\b/g, 'p')}; })()`;
  }

  return 'true';
}
