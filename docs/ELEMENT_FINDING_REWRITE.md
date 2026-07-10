# Element Finding Logic - Complete Rewrite

**For AI Agents**: This document explains the complete element finding system. When adding new element types or selectors, refer to this document and [ENGINEERING.md](ENGINEERING.md#module-decision-trees) for integration guidance.

## Overview

The element finding system has been completely rewritten to support **all possible cases** of element selection, spatial filtering, and fallback matching. The rewrite maintains full backward compatibility while adding comprehensive error handling, better documentation, and configurable behavior.

## Architecture

### Three Core Components

#### 1. **ElementTypes** (`app/elements/element-types.js`)

Defines 20+ semantic element types and builds XPath expressions for matching.

**Features:**

- Type definitions organized by category (Navigation, Interactive, Forms, Containers, Tables, Media)
- 15 searchable attributes (placeholder, value, data-test-id, id, name, aria-label, class, etc.)
- XPath 1.0 escape handling for values with single quotes
- Recursion guards to prevent matching parent wrappers
- Meta-tag exclusion (script/style) to avoid search pollution

**Element Types Supported:**

```
Navigation & Structure:  link, navigation, heading
Interactive Controls:    button, checkbox, switch, radio, slider, dropdown, textbox, file
Lists & Menus:          list, listitem, menu, menuitem
Containers:             toolbar, dialog
Tables/Grids:           table, row, column
Media:                  image
Fallback:               element (matches any)
```

#### 2. **LocatorStrategy** (`app/elements/locator-strategy.js`)

Orchestrates element finding across frames with two-pass strategy and fallback logic.

**Two-Pass Strategy:**

1. **Direct Pass**: Query by element type (e.g., "button" type + "Click" text)
2. **Fallback Pass**: If no matches, find generic "element" matches and locate nearest of target type

**Key Methods:**

- `findElements()`: Returns all matching elements (cross-frame)
- `find()`: Returns single element (processes stack bottom-to-top)
- `findAll()`: Returns all matches (supports OR conditions)
- `resolveElements()`: Batch resolves stack items
- `_scanFramesForElements()`: Cross-frame XPath querying
- `nearestElement()`: Euclidean distance + directional penalties
- `addQualifiers()`: Injects bounding box metadata
- `_withContext()`: Safe frame switching with error recovery

**Configuration Options:**

```javascript
{
  alignmentBuffer: 5,         // Tolerance for "exactly" alignment
  proximityDistance: 100,     // "near" threshold
  directionalPenalty: 5,      // Penalty for backwards movement
  maxFrameDepth: 10,          // Nested iframe limit
  enableCrossFrameSearch: true
}
```

#### 3. **Spatial Selection** (`app/elements/spatial-selection.js`)

Filters elements based on spatial relationships to reference elements.

**Supported Spatial Relationships:**

| Relationship | Condition                         | With "exactly"        |
| ------------ | --------------------------------- | --------------------- |
| `above`      | Candidate bottom < ref top        | Horizontally aligned  |
| `below`      | Candidate top > ref bottom        | Horizontally aligned  |
| `toLeftOf`   | Candidate right < ref left        | Vertically aligned    |
| `toRightOf`  | Candidate left > ref right        | Vertically aligned    |
| `within`     | Candidate midpoint inside ref box | N/A (supports arrays) |
| `near`       | Same row (±100px vertically)      | N/A                   |

## All Supported Cases

### ✅ Basic Element Selection

```javascript
await browser.button('Click Me').click() // By type + text
await browser.element('label text').visible() // Generic element + text
await browser.button().click() // Type only (any button)
await browser.element(1).click() // By index (1st element)
```

### ✅ Matching Options

```javascript
await browser.exact.button('Click Me').click() // Exact text match
await browser.hidden.element('hidden text').text() // Include hidden elements
```

### ✅ Spatial Relationships

```javascript
await browser.textbox('Username').below.heading('Login').write('john')
await browser.button('Submit').below.textbox('Password').click()
await browser.link('FAQ').toRightOf.element('Help').click()
await browser.option('Selected').within.dropdown('Options').select()
await browser.label('Email').near.textbox('email@').write('test@example.com')
```

### ✅ Alignment Precision

```javascript
await browser.exact.element('label').toLeftOf.textbox('input').click()
```

When exact mode enabled, spatial filters also require edge alignment (±5px).

### ✅ OR Conditions

```javascript
await browser.button('OK').or.button('Continue').click()
```

### ✅ Chained Spatial Filters

```javascript
await browser
  .textbox('City')
  .below.heading('Address')
  .toRightOf.element('State')
  .write('New York')
```

### ✅ Index Selection

```javascript
await browser.element('item').at.index(3).click() // 3rd matching element
await browser.checkbox(2).check() // 2nd matching checkbox
```

### ✅ Visibility Control

```javascript
await browser.element('text').is.visible() // Must be visible
await browser.hidden.element('hidden').is.visible() // Check hidden elements
```

### ✅ Cross-Frame Searching

```javascript
// Automatically scans iframes and nested iframes
await browser.button('Frame Button').click()
```

### ✅ Multiple Reference Elements (within)

```javascript
const cells = await browser.element('value').within.column('col1').findAll()
// Finds elements within ANY cell in the column
```

### ✅ Fallback to Nearest Element

```javascript
// Custom component without semantic HTML
// Automatically finds nearest button when direct match fails
await browser.button('Custom Label').click()
```

### ✅ Error Recovery

```javascript
// Gracefully handles:
// - Frame loss in dynamic SPAs
// - Stale elements that become detached
// - Elements that disappear/reappear during search
// - Driver disconnection during frame switch
```

## Implementation Details

### Finding Algorithm

**Single Element (`find()`):**

1. Resolve all stack items into WebElement arrays
2. Process stack from **bottom to top**:
   - Apply spatial filter if present
   - Select by index (1-based, default to 1st) — **index is applied to the filtered result set**, not the original matches
   - Ensure one match (throw if 0)
3. Switch to element's frame
4. Return element (with debug highlight if enabled)

**Multiple Elements (`findAll()`):**

1. Same resolution and bottom-to-top processing
2. Keep ALL matches (don't limit to first)
3. Use first match as context for next level
4. Return complete array

### Spatial Filtering Algorithm

For each candidate element and reference element:

1. Validate spatial relationship (e.g., is candidate below reference?)
2. If `exactly` flag: also check alignment (e.g., horizontal for above/below)
3. Return candidates matching the constraint

Special handling:

- `within` + array of references: check against all references
- `within` + element type: resolve child elements recursively
- `near`: vertical overlap check with 100px buffer

### Fallback Strategy

When direct type matching yields zero results:

1. Find generic "element" matches (by text/attribute only)
2. For each generic match, calculate distance to nearest element of target type
3. Apply directional penalties:
   - Moving left (dx < 0): multiply by 5x (discourage backwards)
   - Moving up (dy < 0): multiply by 5x (discourage upwards)
4. Return the closest element

This handles custom UI components where semantic constraints don't apply.

### Error Handling

**Graceful Degradation:**

- Frame unavailable → return null, continue to next frame
- Stale element → filter out in qualification step
- Script execution fails → return empty array
- XPath query fails → log debug, return empty array

**Informative Errors:**

- ReferenceError includes element ID and spatial context
- Stack resolution errors include index and error details
- Debug mode adds detailed console logging

## Performance Optimizations

1. **Batch Script Execution**: Get all bounding boxes in single browser execution
2. **Early Exit**: Return immediately on first pass match
3. **Frame Caching**: Reuse frame indices across search
4. **Null Checking**: Skip elements with invalid rects
5. **Sequential Processing**: Frame switching is stateful, must be sequential

## Backward Compatibility

✅ All existing code continues to work unchanged:

```javascript
// All of these still work exactly as before:
await browser.button('Click Me').click()
await browser.textbox('username').below.heading('Login').write('john')
await browser.element('item').at.index(2).click()
await browser.button().or.link().click()
```

## Debug Mode

Enable debug mode to see detailed logs and element highlighting:

```javascript
import config from '@nodebug/config'
config.set('selenium.debug', true)
```

**Debug output includes:**

- Fallback strategy logs
- Frame switching errors
- Element matching details
- Stack resolution context
- Failed qualifications

**Visual feedback:**

- Matched elements outlined in red (4px solid, 2px offset)
- Works in both `find()` and `findAll()`

## Configuration

Customize spatial search behavior:

```javascript
const locator = new LocatorStrategy()
locator.configure({
  alignmentBuffer: 3, // Stricter alignment (default: 5px)
  proximityDistance: 50, // Tighter "near" threshold (default: 100px)
  directionalPenalty: 3, // Less discouragement for backwards (default: 5x)
  maxFrameDepth: 5, // Limit nested iframes (default: 10)
})
```

## Testing

Run unit tests:

```bash
npm run test -- --testPathPattern="unit/index.test.js"
```

Run integration tests (requires browser):

```bash
npm run test -- tests/integration/
```

## Future Improvements

Potential enhancements:

- Depth-first iframe traversal for deeply nested frames
- Machine learning for better fallback matching
- Custom matcher functions for domain-specific elements
- Performance metrics collection
- Retry strategies for network latency
