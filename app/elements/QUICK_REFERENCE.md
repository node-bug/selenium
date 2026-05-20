# Elements Module - Quick Reference Guide

## Installation & Setup

```javascript
import { LocatorStrategy } from './locator-strategy-refactored.js'

// Create instance
const strategy = new LocatorStrategy(driver, {
  debug: true, // Enable debug logging
  maxShadowDepth: 10, // Configure shadow DOM depth
})
```

## Finding Elements

### Basic Element Finding

```javascript
// Find any button
const elements = await strategy.findElements({
  type: 'button',
  id: 'Submit',
  exact: false,
  hidden: false,
})

// Find exact match
const elements = await strategy.findElements({
  type: 'button',
  id: 'Submit',
  exact: true, // Full string match
  hidden: false,
})

// Find hidden elements too
const elements = await strategy.findElements({
  type: 'button',
  id: 'Hidden Button',
  exact: false,
  hidden: true, // Include hidden elements
})
```

### Element Types

```javascript
// All supported types
const types = [
  'button', // <button> or @role='button'
  'checkbox', // <input type='checkbox'>
  'radio', // <input type='radio'>
  'switch', // <input type='checkbox'> with @role='switch'
  'textbox', // <input type='text'> or <textarea>
  'dropdown', // <select> or @role='combobox'
  'link', // <a> or @role='link'
  'image', // <img> or @role='img'
  'table', // <table> or @role='table'
  'row', // <tr> or @role='row'
  'column', // <td>, <th>, or @role='cell'
  'heading', // <h1>-<h6> or @role='heading'
  'navigation', // <nav> or @role='navigation'
  'list', // <ul>, <ol>, or @role='list'
  'listitem', // <li> or @role='listitem'
  'menu', // <menu> or @role='menu'
  'menuitem', // @role='menuitem'
  'toolbar', // @role='toolbar'
  'dialog', // @role='dialog'
  'file', // <input type='file'>
  'slider', // <input type='range'> or @role='slider'
  'element', // Any element (fallback)
]
```

## Spatial Filtering

### Filter by Position

```javascript
// Find elements below a reference
const below = await strategy.spatialFilter(
  candidates,
  { located: 'below', exactly: false }, // exactly: require horizontal alignment
  referenceElement,
)

// Find elements above
const above = await strategy.spatialFilter(
  candidates,
  { located: 'above', exactly: true }, // requires horizontal alignment
  referenceElement,
)

// Find elements to the right
const right = await strategy.spatialFilter(
  candidates,
  { located: 'toRightOf', exactly: false },
  referenceElement,
)

// Find elements to the left
const left = await strategy.spatialFilter(
  candidates,
  { located: 'toLeftOf', exactly: true },
  referenceElement,
)

// Find elements within (contained by)
const within = await strategy.spatialFilter(
  candidates,
  { located: 'within' },
  parentElement, // or array of parent elements
)

// Find elements near (same row)
const near = await strategy.spatialFilter(
  candidates,
  { located: 'near' },
  referenceElement,
)
```

### Alignment Precision

```javascript
// Without exact alignment
{ located: 'below', exactly: false }
// Finds ANY element below the reference

// With exact alignment
{ located: 'below', exactly: true }
// Finds elements DIRECTLY below (horizontally aligned within 5px)
```

## Stack Resolution

### Single Element Resolution

```javascript
// Resolve stack to single element
const element = await strategy.find([
  { type: 'button', id: 'Submit', exact: false, hidden: false, matches: [] },
  { type: 'location', located: 'below', matches: [], reference: referenceEl },
])
```

### Multiple Element Resolution

```javascript
// Resolve stack to all matching elements
const elements = await strategy.findAll([
  { type: 'button', id: 'Click', exact: false, hidden: false, matches: [] },
])
```

## Using Utilities

### XPath Builder

```javascript
import {
  generateXPathSelectors,
  buildTextAttributeMatcher,
} from './element-types-refactored.js'
import { escapeXPathString } from './xpath-builder.js'

// Generate all XPath selectors for a type
const xpaths = generateXPathSelectors('Click Me', false)
// Returns: { button: "//*[matcher] and [constraint]", ... }

// Generate XPath for custom use
const xpath = generateXPathSelectors('Click Me', true).button

// Escape strings for XPath
const escaped = escapeXPathString("O'Reilly")
// Returns: "concat('O', \"'\", 'Reilly')"
```

### Element Qualification

```javascript
import {
  addBoundingBoxMetadata,
  filterByVisibility,
  highlightElements,
} from './element-qualifier.js'

// Add bounding box metadata
const qualified = await addBoundingBoxMetadata(driver, elements)
// Adds: element.rect = { x, y, width, height, midx, midy, ... }

// Filter visible/hidden elements
const visible = filterByVisibility(qualified, false) // only visible
const hidden = filterByVisibility(qualified, true) // only hidden

// Highlight for debugging
await highlightElements(driver, element, 'red', 4) // red outline, 4px width
```

### Spatial Filters

```javascript
import {
  createSpatialFilter,
  filterBySpatialRelation,
} from './spatial-filters.js'

// Create a filter function
const filter = createSpatialFilter(refElement.rect, {
  located: 'below',
  exactly: true,
})
const belowElements = candidates.filter(filter)

// Filter via helper
const filtered = filterBySpatialRelation(
  candidates,
  { located: 'below' },
  refElement,
)
```

### Frame Context Manager

```javascript
import { FrameContextManager } from './frame-context.js'

const frameManager = new FrameContextManager(driver)

// Get all frame indices
const indices = await frameManager.getFrameIndices(By)
// Returns: [-1, 0, 1, 2, ...] where -1 = default content

// Execute in frame context
const result = await frameManager.withFrameContext(0, async () => {
  const elements = await driver.findElements(By.xpath('//button'))
  return elements
})

// Find elements in specific frame
const elements = await frameManager.findElementsInFrame(0, By, xpath)
```

## Configuration

### Available Options

```javascript
const strategy = new LocatorStrategy(driver, {
  // Spatial filtering
  alignmentBuffer: 5, // 5px tolerance for alignment checks
  proximityDistance: 100, // 100px threshold for "near" relationship
  directionalPenalty: 5, // Penalty for leftward/upward moves

  // Traversal
  maxFrameDepth: 10, // Maximum iframe nesting depth
  maxShadowDepth: 10, // Maximum shadow DOM nesting depth
  enableCrossFrameSearch: true, // Search across all frames

  // Debugging
  debug: false, // Enable debug logging
})

// Update configuration at runtime
strategy.configure({ debug: true, maxShadowDepth: 15 })
```

## Debug Utilities

```javascript
// Enable debug logging
const strategy = new LocatorStrategy(driver, { debug: true })

// Highlight elements
await strategy.highlightElements(elements)

// Clear caches
strategy.clearCaches()

// Get current configuration
const config = strategy.config
```

## Common Patterns

### Find Button Below Another Element

```javascript
const firstButton = await strategy.findElements({
  type: 'button',
  id: 'First',
  exact: true,
  hidden: false,
})

const secondButton = await strategy.spatialFilter(
  await strategy.findElements({
    type: 'button',
    id: 'Second',
    exact: true,
    hidden: false,
  }),
  { located: 'below', exactly: true },
  firstButton[0],
)
```

### Find Hidden Element

```javascript
const hidden = await strategy.findElements({
  type: 'button',
  id: 'Hidden',
  exact: false,
  hidden: true,
})
```

### Find Element by Any Attribute

```javascript
// Element types search multiple attributes automatically:
// - placeholder, value
// - data-test-id, data-testid
// - id, resource-id
// - name, aria-label
// - class, hint, title, tooltip
// - alt, src, aria-labelledby

const element = await strategy.findElements({
  type: 'button',
  id: 'my-data-testid', // Searches in data-testid, data-test-id, id, etc.
  exact: false,
  hidden: false,
})
```

### Find Element in Shadow DOM

```javascript
// Shadow DOM is automatically searched
// No special configuration needed
const element = await strategy.findElements({
  type: 'button',
  id: 'Within Shadow Root',
  exact: false,
  hidden: false,
})
// Will find elements in shadow DOMs automatically
```

### Find Across Frames

```javascript
// Cross-frame search is enabled by default
const element = await strategy.findElements({
  type: 'button',
  id: 'Submit',
  exact: false,
  hidden: false,
})
// Result will have element.frame property indicating which frame it's in
```

## Troubleshooting

### Element Not Found

1. Verify element type is correct
2. Check exact vs substring matching
3. Try `debug: true` to see search attempts
4. Check if element is in shadow DOM or iframe

### Stale Element

1. Re-qualify element: `await strategy.findElements(selector)`
2. Use `requalifyElement()` after DOM changes
3. Check element.frame for correct context

### Slow Queries

1. Use `exact: true` for faster searches
2. Verify element type (more specific = faster)
3. Clear caches regularly: `strategy.clearCaches()`
4. Reduce `maxShadowDepth` if not needed

### Frame Switching Errors

1. Check frame exists: `getFrameIndices(By)`
2. Verify frame element.frame property
3. Use debug logging to trace frame switches

## Performance Tips

1. **Use exact matching** when possible (faster XPath)
2. **Clear caches** after major page changes
3. **Reuse locator strategy instance** (maintains caches)
4. **Batch qualify elements** (done automatically)
5. **Minimize hidden element searches** (costs extra)

## API Reference

See `REFACTORING_GUIDE.md` for complete API documentation.
