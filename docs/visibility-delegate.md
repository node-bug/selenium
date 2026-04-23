# Visibility Delegate

The Visibility Delegate is a helper class that encapsulates all element visibility-related functionality. It handles operations such as scrolling elements into view, checking visibility states, and managing element opacity for hiding/unhiding elements.

## Usage

The Visibility Delegate is automatically used by the WebBrowser class and is not intended to be used directly by end users. All visibility methods are accessible through the WebBrowser instance:

```javascript
const browser = new WebBrowser()
await browser.start()
await browser.goto('https://example.com')

// Scroll an element into view
await browser.element('submit').scroll()
await browser.element('footer').scroll(false) // Align to bottom

// Check if an element is visible
const isVisible = await browser.element('submit').isVisible()
if (isVisible) {
  await browser.element('submit').click()
}

// Wait for an element to be displayed
await browser.element('loading-indicator').isDisplayed()
await browser.button('submit').isDisplayed(10000) // 10 second timeout

// Wait for an element to become hidden
await browser.element('loading-spinner').isNotDisplayed()
await browser.element('modal').isNotDisplayed(10000) // 10 second timeout

// Check if an element is disabled
const isDisabled = await browser.button('submit').isDisabled()
if (!isDisabled) {
  await browser.button('submit').click()
}

// Hide elements
await browser.element('ad').hide()
await browser.element('popup').hide()

// Unhide elements
await browser.element('ad').unhide()
await browser.element('popup').unhide()
```

## Methods

### scroll(alignToTop = true)

Scrolls an element into the viewport.

**Parameters:**

- `alignToTop` (boolean, optional): If true, top of element aligns to top of viewport. Defaults to `true`.

**Returns:**

- `Promise<boolean>`: True if successful.

**Examples:**

```javascript
await browser.element('submit').scroll()
await browser.element('footer').scroll(false) // Align to bottom
```

### isVisible(t = null)

Checks if an element is currently in the DOM and visible.

**Parameters:**

- `t` (number, optional): Custom timeout in milliseconds.

**Returns:**

- `Promise<boolean>`: True if element is visible.

**Examples:**

```javascript
const visible = await browser.element('submit').isVisible()
if (visible) {
  await browser.element('submit').click()
}
```

### isDisplayed(t = null)

Waits for an element to be visible.

**Parameters:**

- `t` (number, optional): Custom timeout in milliseconds.

**Returns:**

- `Promise<boolean>`: True if element becomes visible.

**Throws:**

- `Error`: If element doesn't become visible within timeout.

**Examples:**

```javascript
await browser.element('loading-indicator').isDisplayed()
await browser.button('submit').isDisplayed(10000) // 10 second timeout
```

### isNotDisplayed(t = null)

Waits for an element to disappear or become hidden.

**Parameters:**

- `t` (number, optional): Custom timeout in milliseconds.

**Returns:**

- `Promise<boolean>`: True if element becomes invisible.

**Examples:**

```javascript
await browser.element('loading-spinner').isNotDisplayed()
await browser.element('modal').isNotDisplayed(10000) // 10 second timeout
```

### isDisabled(t = null)

Checks if an element is currently disabled.

**Parameters:**

- `t` (number, optional): Custom timeout in milliseconds.

**Returns:**

- `Promise<boolean>`: True if element is disabled.

**Examples:**

```javascript
const isDisabled = await browser.button('submit').isDisabled()
if (!isDisabled) {
  await browser.button('submit').click()
}
```

### hide()

Hides an element by setting its opacity to 0.

**Returns:**

- `Promise<boolean>`: True if successful.

**Examples:**

```javascript
await browser.element('ad').hide()
```

### unhide()

Unhides an element by setting its opacity back to its original value.

**Returns:**

- `Promise<boolean>`: True if successful.

**Examples:**

```javascript
await browser.element('ad').unhide()
```
