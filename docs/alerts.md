# Alerts

The Alert class provides methods for handling browser alerts and prompts in Selenium WebDriver automation.

## Overview

Browser alerts (also known as JavaScript alerts, prompts, or confirm dialogs) are modal dialogs that appear during page execution. The Alert class allows you to:

- Check if an alert is present
- Accept or dismiss alerts
- Send text to prompts
- Get text content from alerts

## Usage

### Basic Alert Handling

```javascript
// Check if an alert is present
const isAlertPresent = await browser.alert().isVisible()

// Accept an alert
await browser.alert().accept()

// Dismiss an alert
await browser.alert().dismiss()

// Send text to a prompt
await browser.alert().write('Hello World')
```

### Alert with Expected Text

```javascript
// Check if an alert with specific text is present
const isAlertPresent = await browser.alert('Confirmation Required').isVisible()

// Accept the alert if it's present
if (isAlertPresent) {
  await browser.alert().accept()
}
```

### Getting Alert Text

```javascript
// Get the text content of an alert
const alertText = await browser.alert().get.text()
```

## Methods

### `isVisible()`

Check if an alert is visible and matches expected text.

**Returns:** `Promise<boolean>` - True if alert is visible and text matches

**Example:**

```javascript
await browser.alert().isVisible()
await browser.alert('Expected Text').isVisible()
```

### `accept()`

Accept the current alert.

**Returns:** `Promise<void>` - Resolves when the alert is accepted

**Example:**

```javascript
await browser.alert().accept()
```

### `dismiss()`

Dismiss the current alert.

**Returns:** `Promise<void>` - Resolves when the alert is dismissed

**Example:**

```javascript
await browser.alert().dismiss()
```

### `write(text)`

Send text to the alert.

**Parameters:**

- `text` (string) - Text to send to the alert

**Returns:** `Promise<void>` - Resolves when text is sent

**Example:**

```javascript
await browser.alert().write('Hello World')
```

### `get.text()`

Get the text of the alert.

**Returns:** `Promise<string>` - Text content of the alert

**Example:**

```javascript
const text = await browser.alert().get.text()
```

## Integration with Other Features

The Alert class integrates with the fluent API pattern used throughout the library:

```javascript
// Chain methods together
await browser.alert('Confirm Action').isVisible().accept()

// Combine with other browser operations
await browser.goto('https://example.com')
await browser.alert().accept()
```

## Browser Compatibility

The alert functionality works across all supported browsers (Chrome, Firefox, Safari) with the same API. Note that Chrome has a known issue where text entered into alerts may not be visible on screen, but the text is actually sent correctly.

## Error Handling

The Alert class will throw errors when:

- Attempting to accept/dismiss when no alert is present
- The alert is not found within the timeout period

Always check if an alert is present before attempting to interact with it.
