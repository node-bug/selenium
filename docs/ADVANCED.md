# Advanced: Multi-Window, Multi-Tab, and Alert Handling

Advanced patterns for handling multiple windows, tabs, and JavaScript alerts.

## Quick Reference

```javascript
// Windows (separate browser instances)
await browser.window().new()
await browser.window('Title').switch()
await browser.window(0).maximize()

// Tabs (documents in same window)
await browser.tab().new()
await browser.tab(0).switch()
await browser.tab('Title').get.url()

// Alerts
if (await browser.alert().isVisible()) {
  const text = await browser.alert().get.text()
  await browser.alert().accept()
}
```

## Tab Management

Tabs are multiple documents within the same window, sharing context and cookies.

### Open New Tab

```javascript
await browser.tab().new()
```

**Returns**: `Promise<boolean>`

**Behavior**:

- Creates tab in current window
- Automatically switches to new tab
- Inherits window context

### Switch Between Tabs

By index (0-based):

```javascript
await browser.tab(0).switch() // First tab
await browser.tab(1).switch() // Second tab
```

By title:

```javascript
await browser.tab('Google').switch()
```

**Returns**: `Promise<boolean>`

### Tab Information

Get URL:

```javascript
const url = await browser.tab().get.url()
const url = await browser.tab(0).get.url()
```

Get title:

```javascript
const title = await browser.tab().get.title()
const title = await browser.tab(1).get.title()
```

### Check Tab Display

```javascript
const displayed = await browser.tab(0).isDisplayed()
```

**Returns**: `Promise<boolean>`

### Close Tab

```javascript
await browser.tab(0).close()
```

**Returns**: `Promise<boolean>`

### Tab Patterns

**Multi-Tab Workflow**:

```javascript
// Current tab - navigate
await browser.goto('https://example.com')
await browser.button('Open New Tab').click()

// New tab automatically opened, now on second tab
await browser.goto('https://other.com')

// Switch back to first tab
await browser.tab(0).switch()

// Get info from first tab
const url = await browser.tab(0).get.url()
const title = await browser.tab(0).get.title()
```

**Verify Content in Each Tab**:

```javascript
// Tab 0 content
await browser.tab(0).switch()
await browser.element('Content1').isDisplayed()

// Tab 1 content
await browser.tab(1).switch()
await browser.element('Content2').isDisplayed()
```

**Close Specific Tab**:

```javascript
// Close second tab
await browser.tab(1).close()

// Automatically switches to first tab
await browser.tab(0).switch()
```

**Tab Count Pattern**:

```javascript
// Track tabs dynamically
let tabIndex = 0
await browser.tab().new()
tabIndex++ // Now on tab 1

await browser.tab().new()
tabIndex++ // Now on tab 2

// Switch between them
await browser.tab(0).switch()
await browser.tab(tabIndex).switch()
```

## Window Management

Windows are separate browser instances with independent contexts.

### Open New Window

```javascript
await browser.window().new()
```

**Returns**: `Promise<boolean>`

**Behavior**:

- Creates separate window
- Independent context (separate cookies, storage)
- Automatically switches to new window

### Switch Between Windows

By index (0-based):

```javascript
await browser.window(0).switch() // First window
await browser.window(1).switch() // Second window
```

By title:

```javascript
await browser.window('Example').switch()
```

**Returns**: `Promise<boolean>`

### Window Control

Maximize:

```javascript
await browser.window().maximize()
```

Minimize:

```javascript
await browser.window().minimize()
```

Fullscreen:

```javascript
await browser.window().fullscreen()
```

### Window Information

Get URL:

```javascript
const url = await browser.window().get.url()
const url = await browser.window('Title').get.url()
```

Get title:

```javascript
const title = await browser.window().get.title()
```

Get console errors:

```javascript
const errors = await browser.window().get.consoleErrors()
```

### Check Window Display

```javascript
const displayed = await browser.window('Title').isDisplayed()
```

**Returns**: `Promise<boolean>`

### Close Window

```javascript
await browser.window().close()
```

**Returns**: `Promise<boolean>`

### Window Patterns

**Multi-Window Workflow**:

```javascript
// Original window - navigate
await browser.goto('https://example.com')
await browser.button('Open New Window').click()

// New window opens, automatically switch to it
await browser.goto('https://other.com')

// Switch between windows
await browser.window('Example').switch()
await browser.window('Other').switch()

// Get info from window
const url = await browser.window('Example').get.url()
```

**Window Management Example**:

```javascript
// Original window
await browser.goto('https://example.com')

// Create second window
await browser.window().new()
await browser.goto('https://other.com')

// Create third window
await browser.window().new()
await browser.goto('https://third.com')

// Switch between them
await browser.window(0).switch()
await browser.window(1).switch()
await browser.window(2).switch()

// Control windows
await browser.window(1).maximize()
await browser.window(2).minimize()

// Verify content
await browser.window(0).switch()
await browser.element('Content1').isDisplayed()

await browser.window(1).switch()
await browser.element('Content2').isDisplayed()
```

**Responsive Testing Across Windows**:

```javascript
// Window 1 - Desktop
await browser.window().new()
await browser.setSize({ width: 1920, height: 1080 })
await browser.goto('https://example.com')

// Window 2 - Tablet
await browser.window().new()
await browser.setSize({ width: 768, height: 1024 })
await browser.goto('https://example.com')

// Window 3 - Mobile
await browser.window().new()
await browser.setSize({ width: 375, height: 667 })
await browser.goto('https://example.com')
```

## Alert Handling

Handle JavaScript `alert()`, `confirm()`, and `prompt()` dialogs.

### Detect Alert

Check if alert is present:

```javascript
if (await browser.alert().isVisible()) {
  // Alert is present
}
```

**Returns**: `Promise<boolean>`

### Get Alert Text

```javascript
const text = await browser.alert().get.text()
console.log('Alert message:', text)
```

**Returns**: `Promise<string>`

### Accept Alert

Click OK/Accept button:

```javascript
await browser.alert().accept()
```

**Returns**: `Promise<boolean>`

**Use for**: Dismissing alerts, confirming dialogs

### Dismiss Alert

Click Cancel/Dismiss button:

```javascript
await browser.alert().dismiss()
```

**Returns**: `Promise<boolean>`

**Use for**: Canceling prompts, rejecting confirmations

### Write to Prompt

Send text to prompt dialog:

```javascript
await browser.alert().write('user@example.com')
```

**Parameters**:

- `text` (string): Text to enter

**Returns**: `Promise<boolean>`

**Note**: Text is sent to prompt before accepting

### Alert by Text

Target specific alert by text content:

```javascript
// Accept only if alert contains expected text
await browser.alert('Confirm Action').accept()

// Dismiss specific alert
await browser.alert('Delete permanently?').dismiss()
```

**Parameters**:

- `text` (string, optional): Alert text to match

### Alert Patterns

**Conditional Alert Handling**:

```javascript
const alertPresent = await browser.alert().isVisible()
if (alertPresent) {
  const text = await browser.alert().get.text()
  if (text.includes('Delete')) {
    await browser.alert().accept()
  } else {
    await browser.alert().dismiss()
  }
}
```

**Prompt with Input**:

```javascript
// Send input to prompt
await browser.alert().write('john@example.com')
await browser.alert().accept()
```

**Expected Alert**:

```javascript
// Verify alert appeared with expected text
await browser.alert('Confirm deletion?').get.text()
await browser.alert('Confirm deletion?').accept()
```

**Deletion Workflow**:

```javascript
// Click delete button
await browser.button('Delete').click()

// Handle confirmation alert
if (await browser.alert().isVisible()) {
  const text = await browser.alert().get.text()
  console.log('Confirmation:', text)
  await browser.alert().accept()
}

// Verify deletion
await browser.element('Deleted Item').isNotDisplayed()
```

**Multiple Alerts**:

```javascript
// First alert
await browser.alert('Alert 1').accept()

// Second alert (if appears)
if (await browser.alert().isVisible()) {
  await browser.alert().accept()
}
```

## Browser Compatibility

All window, tab, and alert operations work identically across:

- Chrome
- Firefox
- Safari

**Note**: Chrome has a known issue where text entered into alerts may not be visible on screen, but the text is sent correctly to the browser.

## See Also

- [Browser Guide](BROWSER.md) - Basic browser navigation
- [API Reference - Window Management](API-REFERENCE.md#window-management) - Complete method signatures
- [API Reference - Tab Management](API-REFERENCE.md#tab-management) - Complete method signatures
- [API Reference - Alert Handling](API-REFERENCE.md#alert-handling) - Complete method signatures
