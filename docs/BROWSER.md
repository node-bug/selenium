# Browser: Navigation, Management, and Configuration

Complete guide to browser lifecycle, navigation, window management, and configuration.

## Quick Reference

```javascript
// Session lifecycle
const browser = new WebBrowser()
await browser.start()
await browser.goto('https://example.com')
// ... perform actions ...
await browser.close()

// Navigation
await browser.goto('https://example.com')
await browser.refresh()
await browser.goBack()
await browser.goForward()
await browser.reset()

// Browser info
const name = await browser.get.name() // 'chrome', 'firefox', etc.
const os = await browser.get.os() // OS name
const size = await browser.get.size() // { width, height }

// Configuration
const timeout = browser.timeout
const driver = browser.driver
```

## Session Lifecycle

### Creating a Browser Instance

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
```

### Starting a Session

Initialize a new browser session based on configuration:

```javascript
await browser.start()
```

**Returns**: `Promise<void>`

**What it does**:

- Initializes WebDriver (Chrome, Firefox, Safari)
- Applies configuration settings
- Prepares browser for automation

### Closing a Session

```javascript
await browser.close()
```

**Returns**: `Promise<boolean>`

**Cleanup**:

- Closes all windows and tabs
- Terminates WebDriver process
- Releases resources

**Auto-cleanup**: The library automatically handles cleanup when:

- `close()` is explicitly called
- Process exits (SIGINT, SIGTERM)
- Uncaught exceptions occur

### Complete Lifecycle

```javascript
async function main() {
  const browser = new WebBrowser()

  try {
    // 1. Start
    await browser.start()

    // 2. Use
    await browser.goto('https://example.com')
    await browser.button('Submit').click()

    // 3. Close
    await browser.close()
  } catch (error) {
    console.error('Error:', error.message)
    await browser.close() // Always cleanup on error
  }
}

main()
```

## Navigation

### goto(url)

Navigate to a URL:

```javascript
await browser.goto('https://example.com')
await browser.goto('https://example.com/page')
```

**Parameters**:

- `url` (string): Full URL to navigate to

**Returns**: `Promise<boolean>`

### refresh()

Reload the current page:

```javascript
await browser.refresh()
```

**Returns**: `Promise<void>`

### goBack()

Navigate back in browser history:

```javascript
await browser.goBack()
```

**Returns**: `Promise<boolean>`

### goForward()

Navigate forward in browser history:

```javascript
await browser.goForward()
```

**Returns**: `Promise<boolean>`

### Navigation Patterns

**Forward and back navigation**:

```javascript
await browser.goto('https://example.com/page1')
await browser.goto('https://example.com/page2')
await browser.goBack() // Back to page1
await browser.goForward() // Forward to page2
```

**Refresh after action**:

```javascript
await browser.button('Update').click()
await browser.refresh()
await browser.element('Updated').should.be.visible()
```

## Browser State

### reset()

Reset browser state (clear cookies, storage, close windows):

```javascript
await browser.reset()
```

**Clears**:

- All cookies
- Local storage
- Session storage
- Closes all windows except primary
- Clears cache

**Returns**: `Promise<void>`

**Use when**:

- Starting fresh test without restarting browser
- Clearing authentication state
- Resetting application state

### sleep(ms)

Sleep for specified milliseconds:

```javascript
await browser.sleep(1000) // 1 second
await browser.sleep(5000) // 5 seconds
```

**Parameters**:

- `ms` (number): Milliseconds to sleep

**Returns**: `Promise<void>`

**Use sparingly**: Generally prefer waiting for element state instead

## Browser Information

### get.name()

Get browser name:

```javascript
const name = await browser.get.name()
// Returns: 'chrome', 'firefox', 'safari'
```

**Returns**: `Promise<string>`

### get.os()

Get operating system:

```javascript
const os = await browser.get.os()
// Returns: 'windows', 'macos', 'linux'
```

**Returns**: `Promise<string>`

### get.size()

Get current window size:

```javascript
const size = await browser.get.size()
// Returns: { width: 1280, height: 800 }
```

**Returns**: `Promise<{width: number, height: number}>`

### Accessing Browser Capabilities

```javascript
// Get capabilities object
const caps = browser.capabilities

// Get timeout (in milliseconds)
const timeout = browser.timeout

// Get raw WebDriver instance
const driver = browser.driver
```

## Window Management

### setSize(size)

Set browser window dimensions:

```javascript
await browser.setSize({ width: 1280, height: 800 })
```

**Parameters**:

- `size` (Object): `{ width: number, height: number }`

**Returns**: `Promise<boolean>`

### Responsive Testing

```javascript
// Desktop size
await browser.setSize({ width: 1920, height: 1080 })

// Tablet size
await browser.setSize({ width: 768, height: 1024 })

// Mobile size
await browser.setSize({ width: 375, height: 667 })
```

## Multi-Window Operations

### Open New Window

```javascript
await browser.window().new()
```

### Switch Between Windows

By title:

```javascript
await browser.window('Example').switch()
```

By index:

```javascript
await browser.window(0).switch() // First window
await browser.window(1).switch() // Second window
```

### Window Information

```javascript
const url = await browser.window().get.url()
const title = await browser.window().get.title()
const errors = await browser.window().get.consoleErrors()
```

### Window Display

```javascript
await browser.window().maximize()
await browser.window().minimize()
await browser.window().fullscreen()
const displayed = await browser.window('Title').should.be.visible()
```

### Close Window

```javascript
await browser.window().close()
```

See [Advanced Guide - Windows](ADVANCED.md#window-management) for detailed examples.

## Multi-Tab Operations

### Open New Tab

```javascript
await browser.tab().new()
```

### Switch Between Tabs

By index:

```javascript
await browser.tab(0).switch() // First tab
await browser.tab(1).switch() // Second tab
```

By title:

```javascript
await browser.tab('Google').switch()
```

### Tab Information

```javascript
const url = await browser.tab().get.url()
const title = await browser.tab().get.title()
const displayed = await browser.tab(0).should.be.visible()
```

### Close Tab

```javascript
await browser.tab(0).close()
```

See [Advanced Guide - Tabs](ADVANCED.md#tab-management) for detailed examples.

## Browser Selection

The browser type cannot be set programmatically. Configure it via (in priority order):

1. **Command-line arguments**:

   ```bash
   node script.js --browser=firefox
   ```

2. **Environment variables**:

   ```bash
   export browser=firefox
   node script.js
   ```

3. **Configuration file** (`.config/selenium.json`):
   ```json
   { "browser": "chrome" }
   ```

Options: `"chrome"` (default), `"firefox"`, `"safari"`

## Configuration

### Configuration File

Create `.config/selenium.json`:

```json
{
  "browser": "chrome",
  "headless": true,
  "timeout": 30,
  "downloadsPath": "./downloads",
  "incognito": false,
  "height": null,
  "width": null,
  "hub": null,
  "goog:chromeOptions": {
    "args": ["--no-sandbox"]
  }
}
```

### Browser Options

| Option          | Type    | Default    | Description                                        |
| --------------- | ------- | ---------- | -------------------------------------------------- |
| `browser`       | string  | `"chrome"` | Browser type (`"chrome"`, `"firefox"`, `"safari"`) |
| `headless`      | boolean | `false`    | Run without GUI                                    |
| `incognito`     | boolean | `false`    | Private browsing mode                              |
| `timeout`       | number  | `30`       | Default element timeout (seconds)                  |
| `width`         | number  | `null`     | Window width (pixels)                              |
| `height`        | number  | `null`     | Window height (pixels)                             |
| `downloadsPath` | string  | `null`     | Directory for downloads                            |
| `hub`           | string  | `null`     | Selenium Grid hub URL                              |

### Common Configurations

**CI/CD (Headless)**:

```json
{
  "browser": "chrome",
  "headless": true,
  "timeout": 30
}
```

**Development (GUI)**:

```json
{
  "browser": "chrome",
  "headless": false,
  "width": 1280,
  "height": 800
}
```

**Private Mode**:

```json
{
  "browser": "chrome",
  "incognito": true
}
```

**Custom Downloads**:

```json
{
  "browser": "chrome",
  "downloadsPath": "./test-downloads"
}
```

## WebDriver Access

Access raw WebDriver for advanced operations:

```javascript
const driver = browser.driver

// Get WebDriver actions
const actions = browser.actions()

// Advanced WebDriver API
await driver.executeScript('return document.title')
```

## Common Patterns

### Initialize and Test

```javascript
const browser = new WebBrowser()
await browser.start()

try {
  await browser.goto('https://example.com')
  await browser.button('Submit').click()
  // Verify success
} finally {
  await browser.close()
}
```

### Responsive Testing

```javascript
const browser = new WebBrowser()
await browser.start()
await browser.goto('https://example.com')

// Test desktop
await browser.setSize({ width: 1920, height: 1080 })
await browser.button('Menu').click()

// Test mobile
await browser.setSize({ width: 375, height: 667 })
// Elements should adapt responsively
```

### Multi-Browser Testing

```javascript
async function testOnBrowser(browserType) {
  // Set environment variable
  process.env.browser = browserType

  const browser = new WebBrowser()
  try {
    await browser.start()
    // Run tests
  } finally {
    await browser.close()
  }
}

await testOnBrowser('chrome')
await testOnBrowser('firefox')
```

## See Also

- [Getting Started](GETTING-STARTED.md) - Quick start guide
- [Configuration](CONFIGURATION.md) - Detailed configuration options
- [API Reference - Browser Control](API-REFERENCE.md#browser-control) - Complete method signatures
- [Advanced Guide](ADVANCED.md) - Tabs, windows, alerts
