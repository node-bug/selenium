# Shadow DOM Support Implementation Guide

## Executive Summary

This document outlines the architectural changes needed to enable seamless access to Shadow DOM elements using the existing locator strategy framework. The goal is to maintain the current user-facing API while transparently handling Shadow DOM boundaries during element discovery.

**Current Status**: Shadow DOM elements are **not accessible** because XPath queries cannot pierce shadow boundaries and frame switching logic doesn't apply to shadow roots.

**Solution Approach**: Extend the element discovery pipeline to detect shadow hosts, query within shadow roots using JavaScript execution, and properly calculate viewport coordinates for spatially-filtered elements.

---

## Table of Contents

1. [Current Architecture](#current-architecture)
2. [The Shadow DOM Problem](#the-shadow-dom-problem)
3. [Design Overview](#design-overview)
4. [Detailed Changes](#detailed-changes)
5. [Implementation Strategy](#implementation-strategy)
6. [Technical Considerations](#technical-considerations)
7. [Testing Strategy](#testing-strategy)
8. [API Compatibility](#api-compatibility)

---

## Current Architecture

### Three Core Components

#### 1. ElementTypes (`app/elements/element-types.js`)

Defines 20+ semantic element types and builds **XPath expressions** for matching.

**Key Features:**

- Semantic element definitions (button, textbox, link, checkbox, etc.)
- 15 searchable attributes (placeholder, value, data-test-id, id, name, aria-label, class, etc.)
- XPath 1.0 escape handling for values with single quotes
- Recursion guards to prevent matching parent wrappers
- Meta-tag exclusion (script/style)

**Example XPath Generated:**

```xpath
(contains(normalize-space(@placeholder),"Click Me") or
 contains(normalize-space(@value),"Click Me") or
 contains(normalize-space(.),"Click Me")) and
not(.//*[contains(normalize-space(.),"Click Me")]) and
not(self::script) and not(self::style)
```

#### 2. LocatorStrategy (`app/elements/locator-strategy.js`)

Orchestrates element finding across **frames** with two-pass strategy and fallback logic.

**Key Methods:**

- `_scanFramesForElements()`: Queries all iframes using XPath
- `_withContext(frame, callback)`: Safely switches frame context
- `findElements()`: Two-pass discovery (direct match → fallback to nearest)
- `addQualifiers()`: Injects `getBoundingClientRect()` metadata
- `nearestElement()`: Finds closest element by Euclidean distance
- `relativeSearch()`: Applies spatial filters (above, below, within, etc.)

**Frame Context System:**

```javascript
element.frame = -1 // Default content (main document)
element.frame = 0 // First iframe
element.frame = 1 // Second iframe
// etc.
```

#### 3. SpatialSelection (`app/elements/spatial-selection.js`)

Filters elements by spatial relationships to reference elements.

**Supported Relationships:**

- `above` / `below` (with optional `exactly` for alignment)
- `toLeftOf` / `toRightOf` (with optional `exactly`)
- `within` (supports array of reference elements)
- `near` (same row, within 100px vertically)

---

## The Shadow DOM Problem

### Why Current Approach Fails

Shadow DOM creates a **document boundary** that XPath and standard WebDriver APIs cannot penetrate.

```javascript
// The Problem:
const hostElement = driver.findElement(By.xpath('//div[@id="shadow-host"]'))
const shadowRoot = hostElement.shadowRoot // Accessible in JavaScript

// But XPath cannot query inside shadowRoot:
driver.findElement(By.xpath('//button')) // ❌ Won't find button inside shadow root

// And frame switching doesn't help:
driver.switchTo().frame(hostElement) // ❌ shadowRoot is not a frame
```

### Current Fixture Examples

**switches.html (lines 220-289):**

```html
<div id="shadow-host"></div>

<script>
  const shadowHost = document.getElementById('shadow-host')
  const shadowRoot = shadowHost.attachShadow({ mode: 'open' })
  shadowRoot.innerHTML = `
    <label class="switch-cb">
      <input type="checkbox" id="shadow-switch">
      <span class="slider"></span>
    </label>
  `
</script>
```

**switches-advanced.html (lines 548-600):**

```javascript
class NestedShadowHost extends HTMLElement {
  constructor() {
    super()
    const root = this.attachShadow({ mode: 'open' })
    const wrapper = document.createElement('inner-shadow-host')
    root.appendChild(wrapper)
  }
}

class InnerShadowHost extends HTMLElement {
  constructor() {
    super()
    const root = this.attachShadow({ mode: 'open' })
    const div = document.createElement('div')
    div.className = 'toggle'
    div.id = 'nested-shadow-toggle'
    root.appendChild(div)
  }
}
```

### Discovery Pipeline Flow (Current)

```
findElements(elementData)
  ↓
_scanFramesForElements(elementData)
  ├─ Get all <iframe> elements
  ├─ For each frame (including -1 = default):
  │   ├─ Switch to frame
  │   ├─ Query with XPath ← FAILS for shadow DOM
  │   ├─ Add qualifiers (getBoundingClientRect)
  │   └─ Return qualified elements
  └─ Return all found elements

[NOT SCANNED: Shadow roots are invisible to this process]
```

---

## Design Overview

### Key Insight

Shadow DOM elements require **three-layer context** management:

1. **Main Document** (default) - XPath queries work ✅
2. **iFrame Documents** - Frame switching + XPath queries work ✅
3. **Shadow Roots** - JavaScript execution + tree walking (NEW)

### High-Level Approach

**Extend the discovery pipeline to support all three layers:**

```
findElements(elementData)
  ↓
_scanFramesForElements(elementData)
  ├─ Query main document with XPath
  ├─ NEW: For each element, check for shadow root
  │   └─ If found: query inside shadow root with JavaScript
  ├─ Query all iframes with XPath
  │   ├─ NEW: For each iframe content, check for shadow roots
  │   └─ If found: query inside shadow root with JavaScript
  ├─ NEW: Recursively handle nested shadow DOM
  │   (shadow elements that are themselves shadow hosts)
  └─ Return all found elements (tagged with context)

findAll() → relativeSearch() → apply spatial filters
```

### Element Context Tagging

```javascript
// Current:
element.frame = -1 // or 0, 1, 2, etc.

// Proposed:
element.frame = -1 // When in main document
element.shadowContext = {
  hosts: [shadowHostElement],     // [level1Host] or [level1Host, level2Host, ...]
  depth: 1                          // Nesting depth
}

// Examples:
// Simple shadow DOM:
{ frame: -1, shadowContext: { hosts: [hostEl], depth: 1 } }

// Nested shadow DOM:
{ frame: -1, shadowContext: { hosts: [hostEl1, hostEl2], depth: 2 } }

// Shadow DOM inside iframe:
{ frame: 2, shadowContext: { hosts: [hostEl], depth: 1 } }
```

---

## Detailed Changes

### 1. Add Shadow Root Detection & Querying Methods

**File: `app/elements/locator-strategy.js`**

Add three new helper methods to the `LocatorStrategy` class:

#### 1a. `_queryShadowRoot(shadowHost, elementData)`

Queries elements inside a shadow root using JavaScript tree-walking.

```javascript
/**
 * Queries elements inside a shadow root's DOM tree.
 *
 * Since XPath cannot penetrate shadow boundaries, this method uses JavaScript
 * tree-walking (TreeWalker) to find matching elements inside the shadow root.
 * It applies the same matching logic as ElementTypes.buildMatcher() but in JavaScript.
 *
 * @param {WebElement} shadowHost - The element with the shadow root to query
 * @param {Object} elementData - Selector descriptor { id, exact, type, hidden }
 * @returns {Promise<WebElement[]>} Elements found inside the shadow root
 * @throws {Error} If script execution fails or shadow root is not accessible
 */
async _queryShadowRoot(shadowHost, elementData) {
  try {
    const xpaths = this.getSelectors(elementData.id, elementData.exact);
    const targetXpath = xpaths[elementData.type] || xpaths['element'];

    // Execute JavaScript to query inside shadow root
    const results = await this.driver.executeScript(`
      const host = arguments[0];
      const targetXpath = arguments[1];
      const matches = [];

      // Check if shadow root is accessible
      if (!host.shadowRoot) {
        return [];
      }

      const shadowRoot = host.shadowRoot;

      // Use TreeWalker to traverse shadow DOM
      const walker = document.createTreeWalker(
        shadowRoot,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
      );

      // Helper to test if element matches criteria
      function matchesXPath(el) {
        try {
          // Build criteria similar to ElementTypes matching
          // Check: element type, text content, attributes
          return true; // Placeholder - actual implementation below
        } catch (e) {
          return false;
        }
      }

      let node;
      while (node = walker.nextNode()) {
        if (matchesXPath(node)) {
          matches.push(node);
        }
      }

      return matches;
    `, shadowHost, targetXpath);

    // Tag results with shadow context
    results.forEach(el => {
      el.shadowContext = {
        hosts: [shadowHost],
        depth: 1
      };
    });

    return results;
  } catch (err) {
    if (this.debug) {
      console.error(`Failed to query shadow root of host:`, err.message);
    }
    return [];
  }
}
```

**Implementation Note:** The actual element matching logic should mirror `ElementTypes.buildMatcher()` but executed in browser JavaScript context.

#### 1b. `_findShadowHostsIn(container)`

Finds all elements within a container (or shadow root) that themselves have accessible shadow roots.

```javascript
/**
 * Finds all elements that have accessible shadow roots.
 * Used to support nested shadow DOM structures.
 *
 * @param {WebElement|null} container - The container to search within, or null for document
 * @returns {Promise<WebElement[]>} Elements with shadow roots (shadowRoot property is not null)
 */
async _findShadowHostsIn(container) {
  try {
    const results = await this.driver.executeScript(`
      const container = arguments[0] || document;
      const hosts = [];

      // Get all elements in the container
      const walker = document.createTreeWalker(
        container.shadowRoot || container,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
      );

      let node;
      while (node = walker.nextNode()) {
        if (node.shadowRoot !== null) {
          hosts.push(node);
        }
      }

      return hosts;
    `, container);

    return results;
  } catch (err) {
    if (this.debug) {
      console.error('Failed to find shadow hosts:', err.message);
    }
    return [];
  }
}
```

#### 1c. `_calculateShadowElementCoordinates(element, shadowContext)`

Calculates viewport coordinates for elements inside shadow DOM by translating from shadow root coordinates.

```javascript
/**
 * Calculates viewport-relative bounding coordinates for an element inside shadow DOM.
 *
 * Shadow DOM elements have coordinates relative to their shadow host.
 * This method:
 * 1. Gets element's rect (relative to shadow host)
 * 2. Gets shadow host's rect (viewport-relative)
 * 3. Combines them to get viewport-relative coordinates
 * 4. Handles nested shadow DOM by chaining the calculation
 *
 * @param {WebElement} element - The element to get coordinates for
 * @param {Object} shadowContext - { hosts: [hostEl, ...], depth: n }
 * @returns {Promise<Object>} Bounding rect with viewport coordinates
 */
async _calculateShadowElementCoordinates(element, shadowContext) {
  try {
    return await this.driver.executeScript(`
      const element = arguments[0];
      const shadowHosts = arguments[1]; // Array of host elements, from outermost to innermost

      // Get element's coordinates relative to its immediate parent scope
      const elRect = element.getBoundingClientRect();

      let accumulatedRect = {
        x: elRect.x,
        y: elRect.y,
        width: elRect.width,
        height: elRect.height,
        top: elRect.top,
        bottom: elRect.bottom,
        left: elRect.left,
        right: elRect.right
      };

      // For each shadow host in the chain, translate coordinates
      for (const host of shadowHosts) {
        const hostRect = host.getBoundingClientRect();

        // Translate: add shadow host's position to element's position
        accumulatedRect = {
          x: hostRect.x + accumulatedRect.x,
          y: hostRect.y + accumulatedRect.y,
          width: accumulatedRect.width,
          height: accumulatedRect.height,
          top: hostRect.top + accumulatedRect.top,
          bottom: hostRect.bottom + accumulatedRect.bottom,
          left: hostRect.left + accumulatedRect.left,
          right: hostRect.right + accumulatedRect.right
        };
      }

      return accumulatedRect;
    `, element, shadowContext.hosts);
  } catch (err) {
    if (this.debug) {
      console.error('Failed to calculate shadow element coordinates:', err.message);
    }
    return null;
  }
}
```

### 2. Update `_scanFramesForElements()` to Include Shadow DOM Scanning

**File: `app/elements/locator-strategy.js`**

Replace the existing `_scanFramesForElements()` method to add shadow DOM scanning:

```javascript
/**
 * Scans all frames and shadow roots for matching elements.
 *
 * Enhanced to support:
 * - Main document querying with XPath
 * - Shadow root querying with JavaScript tree-walking
 * - Nested shadow DOM (shadow roots containing other shadow hosts)
 * - Mixed: shadow elements inside iframes
 *
 * @param {Object} elementData - Selector descriptor with `id`, `exact`, `type`, `hidden`
 * @returns {Promise<WebElement[]>} Qualified elements from all frames and shadow roots
 */
async _scanFramesForElements(elementData) {
  const found = [];

  // Get all frame indices: -1 means default content, 0+ are frame indices
  let frames;
  try {
    frames = await this.driver.findElements(By.xpath('//iframe'));
  } catch {
    frames = [];
  }

  const frameIndices = [-1, ...frames.keys()];

  // SCAN EACH FRAME
  for (const frameIndex of frameIndices) {
    const frameResults = await this._withContext(frameIndex, async () => {
      const elementsInFrame = [];

      try {
        // 1. REGULAR DOM: Query with XPath (existing behavior)
        const xpaths = this.getSelectors(elementData.id, elementData.exact);
        const targetXpath = xpaths[elementData.type] || xpaths['element'];

        let elements;
        try {
          elements = await this.driver.findElements(By.xpath(targetXpath));
        } catch (err) {
          if (this.debug) {
            console.warn(`XPath query failed in frame ${frameIndex}:`, err.message);
          }
          elements = [];
        }

        // Tag with frame and qualify
        if (elements.length > 0) {
          elements.forEach(el => el.frame = frameIndex);
          const qualified = await this.addQualifiers(elements);
          const visibilityFilter = elementData.hidden
            ? (e) => e.rect.height < 1 || e.rect.width < 1
            : (e) => e.rect.height > 0 && e.rect.width > 0;
          elementsInFrame.push(...qualified.filter(visibilityFilter));
        }

        // 2. NEW: SHADOW DOM in main content
        const shadowResults = await this._scanShadowDOM(elementData, frameIndex);
        elementsInFrame.push(...shadowResults);

        return elementsInFrame;
      } catch (err) {
        if (this.debug) {
          console.error(`Error scanning frame ${frameIndex}:`, err.message);
        }
        return [];
      }
    });

    if (frameResults && Array.isArray(frameResults)) {
      found.push(...frameResults);
    }
  }

  return found;
}
```

### 3. Add `_scanShadowDOM()` Method

**File: `app/elements/locator-strategy.js`**

New method that recursively scans shadow roots:

```javascript
/**
 * Recursively scans shadow DOM trees for matching elements.
 *
 * Process:
 * 1. Find all shadow hosts in the current document context
 * 2. For each shadow host, query its shadow root
 * 3. Recursively check shadow elements for nested shadow roots
 * 4. Return all matches with proper shadow context tagging
 *
 * @param {Object} elementData - Selector descriptor
 * @param {number} frameIndex - Current frame index (-1 for main document)
 * @returns {Promise<WebElement[]>} Elements found in shadow DOM
 */
async _scanShadowDOM(elementData, frameIndex) {
  const found = [];

  try {
    // Find all elements that have shadow roots
    const shadowHosts = await this.driver.executeScript(`
      const hosts = [];
      const walker = document.createTreeWalker(
        document,
        NodeFilter.SHOW_ELEMENT,
        null,
        false
      );
      let node;
      while (node = walker.nextNode()) {
        if (node.shadowRoot !== null) {
          hosts.push(node);
        }
      }
      return hosts;
    `);

    // Query inside each shadow root
    for (const shadowHost of shadowHosts) {
      const shadowElements = await this._queryShadowRoot(shadowHost, elementData);

      // Tag with frame and shadow context
      shadowElements.forEach(el => {
        el.frame = frameIndex;
        if (!el.shadowContext) {
          el.shadowContext = { hosts: [shadowHost], depth: 1 };
        }
      });

      // Qualify elements (get coordinates accounting for shadow context)
      const qualified = await this._addQualifiersForShadow(shadowElements);

      // Filter by visibility
      const visibilityFilter = elementData.hidden
        ? (e) => e.rect.height < 1 || e.rect.width < 1
        : (e) => e.rect.height > 0 && e.rect.width > 0;

      found.push(...qualified.filter(visibilityFilter));

      // 3. RECURSION: Check if shadow elements are themselves shadow hosts
      for (const shadowElement of shadowElements) {
        const nestedResults = await this._scanShadowDOM(elementData, frameIndex, shadowElement);
        found.push(...nestedResults);
      }
    }
  } catch (err) {
    if (this.debug) {
      console.error('Error scanning shadow DOM:', err.message);
    }
  }

  return found;
}
```

### 4. Extend `addQualifiers()` to Handle Shadow Elements

**File: `app/elements/locator-strategy.js`**

Add a new method `_addQualifiersForShadow()` that handles coordinate calculation for shadow elements:

```javascript
/**
 * Adds bounding box metadata for shadow DOM elements.
 *
 * Similar to addQualifiers() but accounts for shadow context when calculating
 * viewport coordinates. Handles nested shadow DOM by translating coordinates
 * through the shadow host chain.
 *
 * @param {WebElement[]} elements - Shadow DOM elements to qualify
 * @returns {Promise<WebElement[]>} Elements with rect metadata (viewport coordinates)
 */
async _addQualifiersForShadow(elements) {
  if (!elements || elements.length === 0) return [];

  try {
    // For each element, calculate its viewport coordinates
    const qualified = [];

    for (const el of elements) {
      const shadowContext = el.shadowContext;
      const rect = await this._calculateShadowElementCoordinates(el, shadowContext);

      if (rect && rect.height > 0 && rect.width > 0) {
        el.rect = {
          ...rect,
          midx: rect.x + rect.width / 2,
          midy: rect.y + rect.height / 2
        };
        el.tagName = await this.driver.executeScript(
          'return arguments[0].tagName.toLowerCase();',
          el
        );
        qualified.push(el);
      }
    }

    return qualified;
  } catch (err) {
    if (this.debug) {
      console.error('Error adding shadow qualifiers:', err.message);
    }
    return [];
  }
}
```

### 5. Update `_withContext()` to Support Shadow Contexts

**File: `app/elements/locator-strategy.js`**

Extend the existing method to handle shadow contexts:

```javascript
/**
 * Helper to switch context safely.
 *
 * Enhanced to support three context types:
 * 1. Frame index (existing): -1 for default, 0+ for iframes
 * 2. Shadow context (new): { type: 'shadow', hosts: [...] }
 * 3. Mixed (new): frame with shadow context
 *
 * @param {number|Object} context - Frame index or { frame, shadowContext }
 * @param {Function} callback - The async function to execute within context
 * @returns {Promise<*>} The result of the callback, or null if context unavailable
 */
async _withContext(context, callback) {
  try {
    // Switch to appropriate frame context
    await this.driver.switchTo().defaultContent();

    if (typeof context === 'number' && context >= 0) {
      try {
        await this.driver.switchTo().frame(context);
      } catch (err) {
        if (err.name === 'NoSuchFrameError') {
          if (this.debug) console.warn(`Frame ${context} not found`);
          return null;
        }
        throw err;
      }
    }
  } catch (err) {
    if (this.debug) console.warn('Failed to switch to context:', err.message);
    return null;
  }

  // Execute callback (shadow root queries happen via JavaScript, not driver context)
  return await callback();
}
```

### 6. Update `find()` and `findAll()` Methods

**File: `app/elements/locator-strategy.js`**

After resolving elements, ensure driver is in correct context before returning:

```javascript
/**
 * Existing find() method - enhance final context switching
 */
async find(stack) {
  const data = await this.resolveElements(stack);
  let currentElement = null;

  // ... existing stack processing logic ...

  // BEFORE RETURNING: Ensure driver context matches element context
  try {
    await this.driver.switchTo().defaultContent();

    if (currentElement.frame >= 0) {
      await this.driver.switchTo().frame(currentElement.frame);
    }

    // Note: Shadow context doesn't require switching - elements are queried via JavaScript
  } catch (err) {
    if (this.debug) {
      log.warn('Failed to switch to final element context:', err.message);
    }
  }

  // Debug highlight
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
```

### 7. Update `ElementTypes` for JavaScript-Based Matching

**File: `app/elements/element-types.js`**

Add a method that generates JavaScript matching logic (complement to XPath):

```javascript
/**
 * Generates JavaScript matching function code for use in browser context.
 *
 * Used when querying shadow DOM where XPath is unavailable.
 * Returns JavaScript that can be evaluated in browser to match elements.
 *
 * @param {string} value - The text or attribute value to match
 * @param {boolean} [exact=false] - Use exact equality or substring matching
 * @returns {string} JavaScript function body
 */
generateJSMatcher(value, exact = false) {
  const searchTerms = this.attributes.map(attr => `el.getAttribute('${attr}')`);
  const conditions = searchTerms.map(attr => {
    if (exact) {
      return `normalize('${attr}') === normalize('${value}')`;
    } else {
      return `normalize('${attr}').includes(normalize('${value}'))`;
    }
  });

  return `
    function normalize(str) {
      return (str || '').trim().replace(/\\s+/g, ' ').toLowerCase();
    }

    function matches(el) {
      const text = el.textContent || '';
      const normalizedText = normalize(text);
      const normalizedSearch = normalize('${value}');

      const attributeMatches = [
        ${conditions.join(',')}
      ].some(m => m);

      const textMatches = ${exact}
        ? normalizedText === normalizedSearch
        : normalizedText.includes(normalizedSearch);

      return attributeMatches || textMatches;
    }
  `;
}
```

---

## Implementation Strategy

### Phase 1: Foundation (Shadow Root Detection)

**Goal:** Enable basic discovery of shadow DOM elements

1. Add `_queryShadowRoot()` - Query inside shadow roots
2. Add `_findShadowHostsIn()` - Find shadow hosts
3. Update `_scanFramesForElements()` - Include shadow scanning
4. Add `_scanShadowDOM()` - Recursive shadow scanning
5. **Test:** Simple shadow elements are found and returned

### Phase 2: Qualification (Coordinate Calculation)

**Goal:** Ensure shadow elements have correct viewport coordinates

1. Add `_calculateShadowElementCoordinates()` - Translate shadow coordinates
2. Add `_addQualifiersForShadow()` - Qualify shadow elements
3. Update `addQualifiers()` call path - Route shadow elements correctly
4. **Test:** Spatial filtering works with shadow elements

### Phase 3: Integration (Context Management)

**Goal:** Seamlessly integrate shadow elements with existing API

1. Update `_withContext()` - Support shadow contexts
2. Update `find()` / `findAll()` - Handle shadow element context
3. Add `ElementTypes.generateJSMatcher()` - JavaScript-based matching
4. Refine error handling - Shadow-specific error messages
5. **Test:** Full user-facing API works with shadow DOM

### Phase 4: Testing & Documentation

**Goal:** Ensure correctness and maintainability

1. Implement comprehensive test suite (see Testing Strategy)
2. Update existing documentation
3. Add examples to GETTING-STARTED.md
4. Performance profiling and optimization

---

## Technical Considerations

### 1. XPath Limitations

**Problem:** XPath queries cannot penetrate shadow boundaries

```javascript
// This does NOT find elements inside shadow roots:
driver.findElement(By.xpath('//button'))
```

**Solution:** Use JavaScript tree-walking in browser context

```javascript
// JavaScript CAN access shadow roots:
const shadowRoot = element.shadowRoot;
const walker = document.createTreeWalker(shadowRoot, ...);
```

### 2. Coordinate Calculation Complexity

**Problem:** Shadow elements have coordinates relative to shadow host, not viewport

```
Viewport
  └─ Main document
     └─ Shadow Host (x:100, y:200)
        └─ Shadow Root
           └─ Element (relative: x:10, y:20)

Viewport coordinates of element: x:110, y:220
```

**Solution:** Chain coordinate translation through shadow hosts

```javascript
// Get element rect (relative to shadow host)
const elRect = element.getBoundingClientRect() // {x:10, y:20, ...}

// Get shadow host rect (viewport-relative)
const hostRect = host.getBoundingClientRect() // {x:100, y:200, ...}

// Combine:
const viewportRect = {
  x: hostRect.x + elRect.x, // 100 + 10 = 110
  y: hostRect.y + elRect.y, // 200 + 20 = 220
}
```

### 3. Nested Shadow DOM

**Problem:** Support arbitrary nesting of shadow roots

```
Shadow Host 1
  └─ Shadow Root 1
     └─ Shadow Host 2 (custom element)
        └─ Shadow Root 2
           └─ Target Element
```

**Solution:** Recursive scanning and coordinate chaining

- `_scanShadowDOM()` recursively checks shadow elements
- `_calculateShadowElementCoordinates()` chains through all hosts

### 4. Closed vs Open Shadow Roots

**Limitation:** Cannot reliably access closed shadow roots from outside script context

```javascript
// Open: Can be accessed
element.attachShadow({ mode: 'open' })
externalScript.canAccess(element.shadowRoot) // ✅ true

// Closed: Cannot be accessed
element.attachShadow({ mode: 'closed' })
externalScript.canAccess(element.shadowRoot) // ❌ null
```

**Workaround:** This implementation supports open shadow roots. Closed shadow roots created by the test page's own script may not be accessible from Selenium's JavaScript context.

### 5. Performance Implications

**Shadow Scanning Overhead:**

- Additional tree-walking via JavaScript execution
- Nested shadow DOM requires recursive scanning
- Coordinate calculation involves multiple DOM queries

**Mitigation Strategies:**

1. Cache shadow host references
2. Batch JavaScript executions
3. Limit recursion depth (configurable)
4. Optimize tree-walking predicates

### 6. Browser Compatibility

| Browser | Shadow DOM      | Selenium Support | Status   |
| ------- | --------------- | ---------------- | -------- |
| Chrome  | ✅ Full support | ✅ Full          | ✅ Works |
| Firefox | ✅ Full support | ✅ Full          | ✅ Works |
| Safari  | ✅ Full support | ✅ Full          | ✅ Works |
| Edge    | ✅ Full support | ✅ Full          | ✅ Works |

All modern browsers support Shadow DOM API and Selenium WebDriver execution.

### 7. Element Staleness

**Risk:** Elements found in shadow roots may become stale if shadow tree is modified

**Mitigation:**

- Implement element re-fetching on stale errors
- Add timeout-based retry logic
- Document limitation for dynamic shadow DOM

---

## Testing Strategy

### Test Fixtures

**Existing:**

- `tests/fixtures/switches.html` - Shadow host with checkbox
- `automation torture/switches-advanced.html` - Nested shadow DOM, web components

### Test Cases

#### Category 1: Basic Shadow DOM Access

```javascript
describe('Shadow DOM - Basic Access', () => {
  test('should find button in open shadow root', async () => {
    await browser.goto(fixtureUrl)
    const btn = await browser.button('Shadow Button')
    await btn.click()
    // Assert state changed
  })

  test('should find input in open shadow root', async () => {
    await browser.goto(fixtureUrl)
    const input = await browser.textbox('Shadow Input')
    await input.write('test')
    // Assert value changed
  })

  test('should find element by type only in shadow root', async () => {
    await browser.goto(fixtureUrl)
    const checkbox = await browser.checkbox() // First checkbox in shadow
    await checkbox.check()
  })
})
```

#### Category 2: Nested Shadow DOM

```javascript
describe('Shadow DOM - Nested', () => {
  test('should find element in nested shadow roots', async () => {
    await browser.goto(advancedFixtureUrl)
    const nestedToggle = await browser.element('nested-shadow-toggle')
    await nestedToggle.click()
  })

  test('should handle triple-nested shadow DOM', async () => {
    // Test with artificially deep nesting
  })
})
```

#### Category 3: Spatial Filtering with Shadow Elements

```javascript
describe('Shadow DOM - Spatial Filtering', () => {
  test('should find shadow element below text', async () => {
    await browser.goto(fixtureUrl)
    const input = await browser.textbox().below.element('Label')
    await input.write('test')
  })

  test('should find shadow element within container', async () => {
    const btn = await browser.button().within.element('Container')
    await btn.click()
  })

  test('should find element near shadow element', async () => {
    const link = await browser.link().near.element('Shadow Text')
    await link.click()
  })
})
```

#### Category 4: Mixed Contexts (iframe + Shadow)

```javascript
describe('Shadow DOM - Mixed Contexts', () => {
  test('should find shadow element inside iframe', async () => {
    await browser.goto(fixtureUrl)
    // Shadow host inside iframe
    const btn = await browser.button('Frame Shadow Button')
    await btn.click()
  })
})
```

#### Category 5: Error Handling

```javascript
describe('Shadow DOM - Error Handling', () => {
  test('should throw error if shadow element not found', async () => {
    await browser.goto(fixtureUrl)
    expect(() => browser.button('Nonexistent')).toThrow()
  })

  test('should handle shadow root becoming unavailable', async () => {
    // Remove shadow root during interaction
  })
})
```

#### Category 6: Performance

```javascript
describe('Shadow DOM - Performance', () => {
  test('should find shadow element within reasonable time', async () => {
    const start = Date.now()
    await browser.button('Shadow Button').click()
    const elapsed = Date.now() - start
    expect(elapsed).toBeLessThan(2000) // < 2 seconds
  })
})
```

### Test Implementation File

Create `tests/integration/shadow-dom.test.js` with comprehensive coverage.

---

## API Compatibility

### User-Facing API: ✅ NO CHANGES

All existing user code continues to work without modification:

```javascript
// These all work automatically with shadow DOM support:
await browser.button('Click Me').click()
await browser.textbox('Username').below.heading('Login').write('john')
await browser.checkbox(2).check()
await browser.element('text').within.element('container').visible()
await browser.button('OK').or.button('Cancel').click()
```

### Internal API: Enhanced

New methods and properties added to `LocatorStrategy`:

**New Methods:**

- `_queryShadowRoot(shadowHost, elementData)` - Query inside shadow root
- `_findShadowHostsIn(container)` - Find shadow hosts
- `_scanShadowDOM(elementData, frameIndex)` - Recursive shadow scanning
- `_calculateShadowElementCoordinates(element, shadowContext)` - Viewport coordinate translation
- `_addQualifiersForShadow(elements)` - Qualify shadow elements

**Extended Methods:**

- `_scanFramesForElements()` - Now includes shadow scanning
- `_withContext()` - Supports shadow contexts
- `addQualifiers()` - Handles shadow elements (via routing to `_addQualifiersForShadow()`)

**New Properties (on WebElement objects):**

- `shadowContext` - Optional: `{ hosts: [shadowHostEl, ...], depth: n }`
- `frame` - Existing, now works with shadow elements

### Backward Compatibility: ✅ 100%

- No breaking changes to existing methods
- New methods are private (prefixed with `_`)
- Element context tagging is transparent to users
- Existing tests should continue to pass

---

## Summary of Changes by File

| File                                   | Changes                                      | Scope               |
| -------------------------------------- | -------------------------------------------- | ------------------- |
| `app/elements/locator-strategy.js`     | Add 5 new methods, update 3 existing methods | Core implementation |
| `app/elements/element-types.js`        | Add 1 new method for JS-based matching       | Supporting          |
| `tests/integration/shadow-dom.test.js` | Replace placeholder with comprehensive tests | Testing             |
| `docs/SHADOW-DOM-SUPPORT.md`           | This document                                | Documentation       |
| `docs/GETTING-STARTED.md`              | Add shadow DOM usage examples                | Documentation       |

---

## Success Criteria

✅ **Phase 1 Complete:**

- Shadow elements are discoverable
- Test: Can find and click button in shadow root

✅ **Phase 2 Complete:**

- Shadow elements have correct viewport coordinates
- Test: Spatial filtering works (element below label in shadow)

✅ **Phase 3 Complete:**

- Full API works with shadow elements
- Test: Complex queries work (chained filters, OR conditions)

✅ **Phase 4 Complete:**

- Comprehensive test coverage (all categories)
- Documentation updated
- Performance acceptable (< 2 seconds for typical queries)
- No backward compatibility issues

---

## Next Steps

1. **Review & Approve** this design document
2. **Implement Phase 1** - Shadow root detection
3. **Test Phase 1** - Basic shadow element discovery
4. **Implement Phase 2** - Coordinate calculation
5. **Test Phase 2** - Spatial filtering with shadow elements
6. **Implement Phase 3** - Context management and integration
7. **Implement Phase 4** - Comprehensive testing
8. **Merge & Release** - Deploy to main branch

---

## References

- [MDN: Shadow DOM](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM)
- [W3C: Web Components Specification](https://w3c.github.io/webcomponents/)
- [Selenium WebDriver JavaScript Execution](https://www.selenium.dev/documentation/webdriver/bidirectional_apis/)
- [TreeWalker API](https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker)
- [Element.getBoundingClientRect()](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
