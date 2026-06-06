---
name: 'Browser Control Skill'
description: 'Session management, navigation, and browser control operations'
applies: ['app/browser/index.js', 'app/browser/window.js', 'app/browser/tab.js']
examples:
  - 'Start and stop browser sessions'
  - 'Navigate to URLs'
  - 'Manage multiple tabs and windows'
  - 'Handle back/forward/refresh'
---

# Browser Control Skill

## Overview

This skill covers all browser session management and navigation operations. Use these methods to control the browser instance, manage tabs/windows, and navigate pages.

## Core Methods

### Session Management

#### `start()`

Start a new browser session.

```javascript
const browser = new WebBrowser()
await browser.start()
```

**Returns**: `Promise<void>`  
**Throws**: Error if browser fails to start  
**When to use**: Always first step in automation script

---

#### `close()`

Close the current browser session.

```javascript
await browser.close()
```

**Returns**: `Promise<void>`  
**Behavior**: Closes all tabs and windows, terminates driver  
**When to use**: At end of script, in finally block for cleanup

---

#### `quit()`

Alternative to `close()` for terminating session.

```javascript
await browser.quit()
```

**Returns**: `Promise<void>`  
**Note**: Same as `close()`

---

### Navigation

#### `goto(url, options)`

Navigate to a URL.

```javascript
await browser.goto('https://example.com')

// With options
await browser.goto('https://example.com', {
  waitUntil: 'networkidle',
})
```

**Parameters**:

- `url` (string): Full URL to navigate to
- `options` (object, optional): Navigation options

**Returns**: `Promise<void>`  
**Behavior**: Navigates and waits for page load  
**When to use**: Start of test, changing to new page

---

#### `currentUrl()`

Get the current page URL.

```javascript
const url = await browser.currentUrl()
console.log(url) // 'https://example.com/page'
```

**Returns**: `Promise<string>`  
**When to use**: Verify navigation, validate redirect

---

#### `back()`

Navigate back in browser history.

```javascript
await browser.back()
```

**Returns**: `Promise<void>`  
**Behavior**: Goes back one page in history  
**When to use**: Simulate user back button

---

#### `forward()`

Navigate forward in browser history.

```javascript
await browser.forward()
```

**Returns**: `Promise<void>`  
**When to use**: Resume forward navigation

---

#### `refresh()`

Reload the current page.

```javascript
await browser.refresh()
```

**Returns**: `Promise<void>`  
**When to use**: Clear page state, reload after changes

---

### Browser Properties

#### `getTitle()`

Get the current page title.

```javascript
const title = await browser.getTitle()
console.log(title) // 'Home - Example.com'
```

**Returns**: `Promise<string>`  
**When to use**: Verify page loaded, check page name

---

#### `getPageSource()`

Get the full HTML source of the current page.

```javascript
const html = await browser.getPageSource()
```

**Returns**: `Promise<string>`  
**When to use**: Analyze HTML structure, debugging

---

### Waiting

#### `wait(timeMs)`

Wait/sleep for specified milliseconds.

```javascript
await browser.wait(2000) // Wait 2 seconds
```

**Parameters**:

- `timeMs` (number): Milliseconds to wait

**Returns**: `Promise<void>`  
**When to use**: Wait between actions, allow animations to complete  
**Note**: Prefer waiting for elements over fixed waits

---

#### `waitForPageLoad()`

Wait for page to finish loading.

```javascript
await browser.goto('https://example.com')
await browser.waitForPageLoad()
```

**Returns**: `Promise<void>`  
**When to use**: After navigation with heavy content

---

### Tab Management

#### `getTabs()`

Get list of open tabs.

```javascript
const tabs = await browser.getTabs()
console.log(tabs.length) // Number of tabs
```

**Returns**: `Promise<Array<Tab>>`  
**When to use**: Monitor tab count, find specific tabs

---

#### `switchToTab(index)`

Switch to a specific tab by index.

```javascript
const tabs = await browser.getTabs()
await browser.switchToTab(1) // Switch to second tab
```

**Parameters**:

- `index` (number): Tab index (0-based)

**Returns**: `Promise<void>`  
**When to use**: Work with multiple tabs

---

#### `closeTab(index)`

Close a specific tab by index.

```javascript
await browser.closeTab(1)
```

**Parameters**:

- `index` (number): Tab index (0-based)

**Returns**: `Promise<void>`  
**When to use**: Clean up extra tabs

---

### Window Management

#### `getWindows()`

Get list of open windows.

```javascript
const windows = await browser.getWindows()
```

**Returns**: `Promise<Array<Window>>`  
**When to use**: Multi-window scenarios

---

#### `switchToWindow(handle)`

Switch to a specific window.

```javascript
const windows = await browser.getWindows()
await browser.switchToWindow(windows[0].handle)
```

**Returns**: `Promise<void>`  
**When to use**: Work with popups or multiple windows

---

#### `getWindowSize()`

Get current window dimensions.

```javascript
const size = await browser.getWindowSize()
console.log(size) // { width: 1200, height: 800 }
```

**Returns**: `Promise<{width: number, height: number}>`

---

#### `setWindowSize(width, height)`

Resize the browser window.

```javascript
await browser.setWindowSize(1920, 1080)
```

**Parameters**:

- `width` (number): Width in pixels
- `height` (number): Height in pixels

**Returns**: `Promise<void>`  
**When to use**: Test responsive designs, different resolutions

---

### Page Content

#### `pageTitle()`

Get page title (alias for `getTitle()`).

```javascript
const title = await browser.pageTitle()
```

**Returns**: `Promise<string>`

---

#### `getPageSource()`

Get complete HTML source.

```javascript
const source = await browser.getPageSource()
```

**Returns**: `Promise<string>`

---

### Switching Contexts

#### `switchToFrame(frameElement)`

Switch into an iframe.

```javascript
const frame = await browser.element('iframe-id').find()
await browser.switchToFrame(frame)
```

**Parameters**:

- `frameElement` (WebElement): The iframe element

**Returns**: `Promise<void>`  
**When to use**: Access content inside iframes  
**Note**: Usually automatic with semantic element finding

---

#### `switchToDefaultContent()`

Switch back from iframe to main content.

```javascript
await browser.switchToDefaultContent()
```

**Returns**: `Promise<void>`  
**When to use**: After finishing iframe operations

---

## Common Patterns

### Pattern 1: Basic Test Flow

```javascript
const browser = new WebBrowser()

try {
  await browser.start()
  await browser.goto('https://example.com')

  // Perform actions...

  console.log('✅ Test passed')
} finally {
  await browser.close()
}
```

### Pattern 2: Multi-Tab Testing

```javascript
await browser.goto('https://example.com')

// Open new tab (via link with target="_blank")
await browser.link('Open in New Tab').click()

const tabs = await browser.getTabs()
await browser.switchToTab(1) // Switch to new tab

// Interact with new tab...

await browser.closeTab(1) // Close it
await browser.switchToTab(0) // Back to first tab
```

### Pattern 3: Responsive Testing

```javascript
const sizes = [
  { width: 375, height: 667 }, // Mobile
  { width: 768, height: 1024 }, // Tablet
  { width: 1920, height: 1080 }, // Desktop
]

for (const size of sizes) {
  await browser.setWindowSize(size.width, size.height)
  // Test layout...
}
```

### Pattern 4: Navigation History

```javascript
await browser.goto('https://example.com/page1')
await browser.button('Next').click() // Navigates to page2
await browser.back() // Back to page1
await browser.forward() // Forward to page2
```

## Browser Configuration

Browser behavior is configured in `.config/selenium.json`:

```json
{
  "browser": "chrome",
  "headless": false,
  "timeout": 30,
  "baseUrl": "https://example.com"
}
```

**Options**:

- `browser`: "chrome", "firefox", "safari", "edge"
- `headless`: true/false
- `timeout`: Seconds to wait for elements
- `baseUrl`: Default base URL

**See**: [Configuration Guide](../docs/CONFIGURATION.md)

## Best Practices

1. **Always cleanup** - Use finally block to ensure `close()` is called
2. **Prefer semantic navigation** - Use element clicks over `goto()` when testing user flow
3. **Wait for elements, not time** - Use element visibility waits instead of fixed `wait()`
4. **Test cross-browser** - Run same tests in Chrome, Firefox, Safari
5. **Handle multiple tabs carefully** - Always know which tab is active
6. **Verify page state** - Check title or element visibility after navigation

## Troubleshooting

| Issue                              | Solution                                  |
| ---------------------------------- | ----------------------------------------- |
| Page not loading                   | Increase timeout in config, check URL     |
| Element not found after navigation | Wait for specific element to appear       |
| Tab/window count wrong             | Check if popups are blocked               |
| Navigation fails                   | Check baseUrl config, verify URL is valid |

## Related Skills

- [Element Finding](elements.instructions.md) - Find elements on page
- [Element Interactions](element-interactions.instructions.md) - Interact with elements
- [Cross-Browser Setup](capabilities.instructions.md) - Configure browsers
