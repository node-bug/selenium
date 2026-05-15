# Elements Module - Refactored Architecture

## Overview

The elements module has been refactored from a monolithic structure into modular, reusable components. This improves:

- **Maintainability**: Each module has a single responsibility
- **Testability**: Smaller functions are easier to unit test
- **Performance**: Better caching and optimized queries
- **Code Reusability**: Components can be used independently

## Module Organization

### Core Modules

#### `xpath-builder.js`

XPath expression utilities for generating and converting selectors.

**Key Functions:**

- `escapeXPathString(value)` - Properly escapes strings for XPath 1.0
- `xpathConstraintToJS(constraint)` - Converts XPath constraints to JavaScript boolean expressions
- `splitOutsideBrackets(str, delimiter)` - Splits strings respecting bracket nesting

**Usage:**

```javascript
import { escapeXPathString, xpathConstraintToJS } from './xpath-builder.js'

const escaped = escapeXPathString("O'Reilly")
const jsExpr = xpathConstraintToJS("@role='button' or @type='button'")
```

#### `element-types-refactored.js`

Element type definitions and XPath selector generation.

**Key Functions:**

- `getElementTypeNames()` - Returns all supported element types
- `getElementTypeConstraint(type)` - Gets XPath constraint for a type
- `buildTextAttributeMatcher(value, exact)` - Builds attribute/text matchers
- `generateXPathSelectors(value, exact)` - Generates complete XPath queries
- `isValidElementType(type)` - Validates element type names

**Supported Element Types:**

- Navigation: link, navigation, heading
- Interactive: button, checkbox, switch, radio, slider, dropdown, textbox, file
- Structure: list, listitem, menu, menuitem, toolbar, dialog
- Tables: table, row, column
- Media: image
- Fallback: element

**Usage:**

```javascript
import {
  generateXPathSelectors,
  isValidElementType,
} from './element-types-refactored.js'

const xpaths = generateXPathSelectors('Click Me', false) // substring matching
const isValid = isValidElementType('button')
```

#### `shadow-dom-scanner.js`

Traverses shadow DOM trees and collects matching elements.

**Key Class:** `ShadowDOMScanner`

**Methods:**

- `constructor(driver, config)` - Initialize with WebDriver
- `query(scopeRoot, searchId, exact, type, scoped, frameIndex)` - Query shadow DOM
- `clearCache()` - Clear query result cache

**Features:**

- TreeWalker-based traversal piercing shadow boundaries
- Label resolution for form elements
- Result caching to avoid redundant queries
- Support for nested shadow roots up to configurable depth

**Usage:**

```javascript
import { ShadowDOMScanner } from './shadow-dom-scanner.js'

const scanner = new ShadowDOMScanner(driver, { maxShadowDepth: 10 })
const elements = await scanner.query(
  null,
  'Search Text',
  false,
  'button',
  false,
  -1,
)
```

#### `element-qualifier.js`

Adds bounding box metadata to WebElements for spatial operations.

**Key Functions:**

- `addBoundingBoxMetadata(driver, elements)` - Injects rect and tagName
- `filterByVisibility(elements, includeHidden)` - Filters by visibility
- `highlightElements(driver, elements)` - Visual debugging outline
- `requalifyElement(driver, element)` - Refreshes metadata
- `isElementValid(driver, element)` - Checks if element is stale

**Metadata Added:**

```javascript
element.rect = {
  x,
  y,
  width,
  height,
  top,
  bottom,
  left,
  right,
  midx,
  midy, // midpoint coordinates
}
element.tagName = 'div' // lowercased
```

**Usage:**

```javascript
import {
  addBoundingBoxMetadata,
  filterByVisibility,
} from './element-qualifier.js'

const qualified = await addBoundingBoxMetadata(driver, elements)
const visible = filterByVisibility(qualified, false) // exclude hidden
```

#### `spatial-filters.js`

Filters elements based on geometric positioning.

**Key Functions:**

- `createSpatialFilter(refRect, relation, config)` - Creates filter function
- `filterBySpatialRelation(candidates, relation, reference, config)` - Applies filtering
- `calculateDistance(elemA, elemB, applyPenalty)` - Computes element distances
- `sortByDistance(elements, reference, applyPenalty)` - Sorts by distance

**Supported Spatial Relationships:**

- `above` - Candidate's bottom < reference's top
- `below` - Candidate's top > reference's bottom
- `toLeftOf` - Candidate's right < reference's left
- `toRightOf` - Candidate's left > reference's right
- `within` - Candidate's midpoint inside reference's bbox
- `near` - Candidate and reference on same row (vertical overlap)

**Alignment Precision:**

- `exactly: true` - Requires edge alignment (within 5px buffer)
- `exactly: false` - Just checks directional relationship

**Usage:**

```javascript
import { filterBySpatialRelation } from './spatial-filters.js'

const below = filterBySpatialRelation(
  candidates,
  { located: 'below', exactly: true },
  reference,
)
```

#### `frame-context.js`

Manages safe frame switching and context preservation.

**Key Class:** `FrameContextManager`

**Methods:**

- `getFrames(By)` - Gets all iframe elements
- `getFrameIndices(By)` - Gets frame indices (-1 = default content)
- `switchToFrame(frameIndex)` - Switches to frame
- `withFrameContext(frameIndex, callback)` - Executes within frame context
- `findElementsInFrame(frameIndex, By, xpath)` - Finds elements in frame

**Usage:**

```javascript
import { FrameContextManager } from './frame-context.js'

const frameManager = new FrameContextManager(driver)
const elements = await frameManager.findElementsInFrame(0, By, xpath)
```

#### `locator-strategy-refactored.js`

Core element-finding strategy using all modular components.

**Key Class:** `LocatorStrategy`

**Public Methods:**

- `findElements(selector)` - Finds elements matching selector
- `spatialFilter(candidates, relation, reference)` - Applies spatial filters
- `findChildElements(parent, childSelector)` - Finds child elements
- `find(stack)` - Resolves stack to single element
- `findAll(stack)` - Resolves stack to all matching elements
- `highlightElements(elements)` - Debug highlighting
- `configure(options)` - Configure behavior
- `clearCaches()` - Clear internal caches

**Two-Pass Finding Strategy:**

1. **Direct Matching** - Query by element type + text
2. **Fallback** - Find nearest element of target type (for custom components)

**Usage:**

```javascript
import { LocatorStrategy } from './locator-strategy-refactored.js'

const strategy = new LocatorStrategy(driver, { debug: true })
const elements = await strategy.findElements({
  id: 'Submit',
  exact: false,
  type: 'button',
  hidden: false,
})
```

#### `selector-stack-builder-refactored.js`

Chainable builder for constructing complex element queries.

**Key Class:** `SelectorStackBuilder`

**Type Selectors:**

- `element(data)`, `button(data)`, `checkbox(data)`, `link(data)`
- `textbox(data)`, `dropdown(data)`, `radio(data)`, `switch(data)`
- `image(data)`, `table(data)`

**Modifier Methods:**

- `exact()` - Full-string matching
- `hidden()` - Include hidden elements
- `at(index)` - 1-based index selection

**Spatial Methods:**

- `above(ref, exactly)`, `below(ref, exactly)`
- `toLeftOf(ref, exactly)`, `toRightOf(ref, exactly)`
- `within(parent)`, `near(ref)`

**Usage:**

```javascript
import { SelectorStackBuilder } from './selector-stack-builder-refactored.js'

const builder = new SelectorStackBuilder(parent)
const stack = builder.button('Submit').exact().below(reference).getStack()
```

## Configuration

### Default Configuration

```javascript
{
  alignmentBuffer: 5,           // 5px tolerance for alignment checks
  proximityDistance: 100,        // 100px threshold for "near" relationship
  directionalPenalty: 5,         // Penalty multiplier for reverse directions
  maxFrameDepth: 10,            // Maximum iframe nesting
  maxShadowDepth: 10,           // Maximum shadow DOM nesting
  enableCrossFrameSearch: true,  // Search across all frames
  debug: false                   // Enable debug logging
}
```

## Performance Optimizations

### Shadow DOM Caching

Shadow DOM queries are cached using a composite key:

```
frameIndex:scope:searchId:exact:type
```

Cache is cleared at the start of each top-level find/findAll call.

### Batch Bounding Box Queries

All elements' bounding boxes are retrieved in a single browser execution:

```javascript
// Instead of:
for (el of elements) {
  const rect = await driver.executeScript(
    'return el.getBoundingClientRect()',
    el,
  )
}

// Do:
const rects = await driver.executeScript(
  'return arguments.map(el => el.getBoundingClientRect())',
  ...elements,
)
```

### Frame-Scoped Searches

Searches are frame-aware, avoiding cross-frame pollution:

- Each frame is searched independently
- Results are tagged with frame index
- Avoids unnecessary frame switching

## Migration Guide

### From Old to New

**Old (monolithic):**

```javascript
import { LocatorStrategy } from './locator-strategy.js'
```

**New (modular):**

```javascript
import { LocatorStrategy } from './locator-strategy-refactored.js'
// API is identical, but now uses modular components internally
```

### Breaking Changes

- None! The public API remains compatible
- Old modules still work but are less maintainable

### Recommended Patterns

**Element Finding:**

```javascript
const strategy = new LocatorStrategy(driver)
const button = await strategy.findElements({
  id: 'Submit',
  exact: false,
  type: 'button',
  hidden: false,
})
```

**Spatial Filtering:**

```javascript
const below = await strategy.spatialFilter(
  candidates,
  { located: 'below', exactly: false },
  reference,
)
```

**Stack Resolution:**

```javascript
const element = await strategy.find(stack)
const allMatches = await strategy.findAll(stack)
```

## Testing Examples

### Testing XPath Builder

```javascript
import { xpathConstraintToJS } from './xpath-builder.js'

const js = xpathConstraintToJS("@role='button' or @type='button'")
// Returns: "el.getAttribute('role') === 'button' || el.getAttribute('type') === 'button'"
```

### Testing Element Qualifier

```javascript
import {
  addBoundingBoxMetadata,
  filterByVisibility,
} from './element-qualifier.js'

const qualified = await addBoundingBoxMetadata(driver, elements)
expect(qualified[0].rect).toBeDefined()
expect(qualified[0].rect.midx).toBeDefined()

const visible = filterByVisibility(qualified, false)
expect(visible.every((el) => el.rect.height > 0)).toBe(true)
```

### Testing Spatial Filters

```javascript
import { createSpatialFilter } from './spatial-filters.js'

const refRect = {
  top: 100,
  bottom: 110,
  left: 0,
  right: 100,
  midx: 50,
  midy: 105,
}
const filter = createSpatialFilter(refRect, { located: 'below' })

const candidate = {
  rect: { top: 111, bottom: 121, left: 0, right: 100, midx: 50, midy: 116 },
}
expect(filter(candidate)).toBe(true)
```

## Debugging

### Enable Debug Logging

```javascript
const strategy = new LocatorStrategy(driver, { debug: true })
```

### Highlight Elements

```javascript
await strategy.highlightElements(elements)
```

### Requalify Elements After Changes

```javascript
import { requalifyElement } from './element-qualifier.js'
const refreshed = await requalifyElement(driver, element)
```

## Contributing

When adding new features:

1. **Element Types** → Update `element-types-refactored.js`
2. **Spatial Relationships** → Update `spatial-filters.js`
3. **Frame Logic** → Update `frame-context.js`
4. **XPath Patterns** → Update `xpath-builder.js`
5. **Qualification** → Update `element-qualifier.js`

Each module is designed to be independently testable and reusable.
