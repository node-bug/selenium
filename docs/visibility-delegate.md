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

**Returns a boolean for conditional test execution** - Does not throw errors.

Check if element is currently visible in the DOM without stopping execution.

```javascript
const visible = await browser.element('Item').isVisible()
if (visible) {
  await browser.element('Item').click()
}
```

**Returns**: `Promise<boolean>` - `true` if visible, `false` otherwise

**Use when**: You need to conditionally branch test logic based on element visibility.

### isDisplayed([timeout])

**Assertion that throws an error and stops execution** - Use for validation and verification.

Wait for element to become visible within the timeout. Throws an error if element is not visible when timeout expires.

```javascript
await browser.element('Loading').isDisplayed() // Default timeout
await browser.button('Submit').isDisplayed(10000) // 10 second timeout
```

**Parameters**:

- `timeout` (number, optional): Milliseconds to wait for visibility

**Throws**: Error if not visible within timeout - **Test execution stops**

**Returns**: `Promise<boolean>`

**Use when**: You expect an element to appear and want the test to fail if it doesn't.

### isNotDisplayed([timeout])

**Assertion that throws an error and stops execution** - Use for validation and verification.

Wait for element to disappear (become hidden) within the timeout. Throws an error if element is still visible when timeout expires.

```javascript
await browser.element('Modal').isNotDisplayed()
await browser.element('Spinner').isNotDisplayed(5000) // 5 second timeout
```

**Parameters**:

- `timeout` (number, optional): Milliseconds to wait for element to disappear

**Throws**: Error if still visible within timeout - **Test execution stops**

**Returns**: `Promise<boolean>`

**Use when**: You expect an element to disappear and want the test to fail if it doesn't.

### isDisabled()

Check if element is disabled.

```javascript
const disabled = await browser.button('Submit').isDisabled()
if (!disabled) {
  await browser.button('Submit').click()
}
```

**Returns**: `Promise<boolean>`

### isChecked()

**Assertion that throws an error and stops test execution on failure.**

Check if checkbox is checked.

```javascript
const checked = await browser.checkbox('Subscribe').isChecked()
```

**Throws**: Error if checkbox is not checked - **Test execution stops**

### isUnchecked()

**Assertion that throws an error and stops test execution on failure.**

Check if checkbox is unchecked.

```javascript
const unchecked = await browser.checkbox('Subscribe').isUnchecked()
```

**Throws**: Error if checkbox is checked - **Test execution stops**

## Scrolling & Visibility Manipulation

### scroll([alignToTop])

Scroll element into view.

```javascript
await browser.element('Submit').scroll() // Top of viewport
await browser.element('Footer').scroll(false) // Bottom of viewport
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

### When to Use isVisible() vs isDisplayed()/isNotDisplayed()

| Method             | Use Case                              | Returns        | Throws on Failure    |
| ------------------ | ------------------------------------- | -------------- | -------------------- |
| `isVisible()`      | Check status for conditional logic    | `true`/`false` | No                   |
| `isDisplayed()`    | Verify element appears (assertion)    | `boolean`      | **Yes** - stops test |
| `isNotDisplayed()` | Verify element disappears (assertion) | `boolean`      | **Yes** - stops test |

### Wait for Async Loading (Using Assertions)

```javascript
// Assert loading spinner appears
await browser.element('Spinner').isDisplayed()

// Do work...

// Assert spinner disappears
await browser.element('Spinner').isNotDisplayed()

// Assert content loaded
await browser.element('Success').isDisplayed()
```

### Conditional Interaction (Using Return Values)

```javascript
// Check status and conditionally execute
if (!(await browser.button('Submit').isDisabled())) {
  await browser.button('Submit').click()
}

// Check visibility to decide next action
const isVisible = await browser.element('Premium Feature').isVisible()
if (isVisible) {
  await browser.element('Premium Feature').interact()
} else {
  console.log('Feature not available')
}
```

### Common Pattern: Fallback Handling

```javascript
// When you need to handle missing elements gracefully
const hasErrorMessage = await browser.element('Error').isVisible()
if (hasErrorMessage) {
  const errorText = await browser.element('Error').get.value()
  console.error('Form error:', errorText)
} else {
  // Proceed with normal flow
}
```

### Checkbox State

```javascript
// Assert checkbox is unchecked, then check it
await browser.checkbox('Subscribe').isUnchecked()
await browser.checkbox('Subscribe').check()

// Assert checkbox is now checked
await browser.checkbox('Subscribe').isChecked()
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
