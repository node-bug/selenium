# Browser Class Reference

See [API Reference - Browser Control](API-REFERENCE.md#browser-control) for complete method documentation.

## Quick Access

- **Session**: `start()`, `close()`, `reset()`, `sleep(ms)`
- **Navigation**: `goto(url)`, `refresh()`, `goBack()`, `goForward()`
- **Window**: `setSize()`, `actions()`
- **Data**: `get.size()`, `get.name()`, `get.os()`
- **Getters**: `timeout`, `capabilities`, `driver`

See [API Reference](API-REFERENCE.md#browser-control) for all details.

## Common Patterns

### Initialize and Navigate
```javascript
const browser = new WebBrowser()
await browser.start()
await browser.goto('https://example.com')
```

### Get Browser Information
```javascript
const name = await browser.get.name()         // 'chrome', 'firefox', etc.
const os = await browser.get.os()             // OS name
const size = await browser.get.size()         // { width, height }
const timeout = browser.timeout               // Default timeout in ms
```

### Browser Control
```javascript
await browser.refresh()        // Reload page
await browser.goBack()         // Navigate back
await browser.goForward()      // Navigate forward
await browser.reset()          // Clear cookies, storage, close windows
await browser.sleep(1000)      // Wait 1 second
```

### Window Management
```javascript
await browser.setSize({ width: 1280, height: 800 })
const actions = browser.actions()  // WebDriver actions
```

### Cleanup
```javascript
await browser.close()          // Close browser and cleanup
```

## Full API Reference

See [API Reference](API-REFERENCE.md)

