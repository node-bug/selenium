# Visibility Control

Element visibility checks and manipulation. See [API Reference](API-REFERENCE.md#element-state) for complete method signatures.

## Quick Examples

```javascript
// Check if visible
const visible = await browser.element('Submit').isVisible()

// Wait for element to appear
await browser.element('Loading').isDisplayed()

// Wait for element to disappear
await browser.element('Modal').isNotDisplayed()

// Check if disabled
const disabled = await browser.button('Submit').isDisabled()

// Scroll into view
await browser.element('Submit').scroll()

// Hide/Unhide elements
await browser.element('Ad').hide()
await browser.element('Ad').unhide()
```

## State Checking

### isVisible()
Check if element is currently visible in the DOM.

```javascript
const visible = await browser.element('Item').isVisible()
if (visible) {
  await browser.element('Item').click()
}
```

**Returns**: `Promise<boolean>`

### isDisplayed([timeout])
Wait for element to become visible (wait up to timeout).

```javascript
await browser.element('Loading').isDisplayed()           // Default timeout
await browser.button('Submit').isDisplayed(10000)       // 10 second timeout
```

**Throws**: Error if not visible within timeout

**Returns**: `Promise<boolean>`

### isNotDisplayed([timeout])
Wait for element to disappear (become hidden).

```javascript
await browser.element('Modal').isNotDisplayed()
await browser.element('Spinner').isNotDisplayed(5000)  // 5 second timeout
```

**Returns**: `Promise<boolean>`

### isDisabled([timeout])
Check if element is disabled.

```javascript
const disabled = await browser.button('Submit').isDisabled()
if (!disabled) {
  await browser.button('Submit').click()
}
```

**Returns**: `Promise<boolean>`

### isChecked()
Check if checkbox is checked.

```javascript
const checked = await browser.checkbox('Subscribe').isChecked()
```

**Returns**: `Promise<boolean>`

### isUnchecked()
Check if checkbox is unchecked.

```javascript
const unchecked = await browser.checkbox('Subscribe').isUnchecked()
```

**Returns**: `Promise<boolean>`

## Scrolling & Visibility Manipulation

### scroll([alignToTop])
Scroll element into view.

```javascript
await browser.element('Submit').scroll()          // Top of viewport
await browser.element('Footer').scroll(false)     // Bottom of viewport
```

**Parameters**:
- `alignToTop` (boolean, optional): Default true

**Returns**: `Promise<boolean>`

### hide()
Hide an element by setting opacity to 0.

```javascript
await browser.element('Ad').hide()
```

**Returns**: `Promise<boolean>`

### unhide()
Show a hidden element (restore opacity).

```javascript
await browser.element('Ad').unhide()
```

**Returns**: `Promise<boolean>`

## Usage Patterns

### Wait for Async Loading
```javascript
// Show loading spinner
await browser.element('Spinner').isDisplayed()

// Do work...

// Wait for spinner to disappear
await browser.element('Spinner').isNotDisplayed()

// Assert content appeared
const success = await browser.element('Success').isDisplayed()
```

### Conditional Interaction
```javascript
// Only click if button is enabled
if (!await browser.button('Submit').isDisabled()) {
  await browser.button('Submit').click()
}
```

### Checkbox State
```javascript
// Check current state
if (await browser.checkbox('Subscribe').isUnchecked()) {
  await browser.checkbox('Subscribe').check()
}
```

### Scroll and Click
```javascript
// Scroll button into view
await browser.button('Bottom').scroll()

// Then click
await browser.button('Bottom').click()
```

## Full API Reference

See [Visibility Control API](API-REFERENCE.md#element-state)

