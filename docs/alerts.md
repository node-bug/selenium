# Alert Handling

JavaScript alert, prompt, and confirmation dialog handling. See [API Reference](API-REFERENCE.md#alert-handling) for complete method signatures.

## Quick Examples

```javascript
// Check if alert exists
if (await browser.alert().isVisible()) {
  await browser.alert().accept()
}

// Handle specific alert text
await browser.alert('Confirm Action').accept()

// Send text to prompt
await browser.alert().write('User input')

// Dismiss alert
await browser.alert().dismiss()

// Get alert text
const text = await browser.alert().get.text()
```

## Patterns

### Conditional Alert Handling

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

### Alert with Text Matching

```javascript
// Accept only if alert contains expected text
const confirmed = await browser.alert('Are you sure?').isVisible()
if (confirmed) {
  await browser.alert('Are you sure?').accept()
}
```

### Prompt Input

```javascript
// Send user input to prompt
await browser.alert().write('john@example.com')
await browser.alert().accept()
```

## Browser Compatibility

Works identically across all browsers (Chrome, Firefox, Safari).

**Note**: Chrome has a known issue where text entered into alerts may not be visible on screen, but the text is sent correctly.

## Full API Reference

See [Alert Handling API](API-REFERENCE.md#alert-handling)

