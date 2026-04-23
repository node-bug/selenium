# WebBrowser

A fluent JavaScript library for browser automation with a human-like element location strategy, built on Selenium WebDriver.

**Quick Links**: [Installation](#installation) | [Quick Start](#quick-start) | [Core Concepts](docs/CONCEPTS.md) | [API Reference](docs/API-REFERENCE.md) | [Configuration](docs/CONFIGURATION.md)

## Features

- 🎯 **Human-like element selection** - Prioritizes visible text and attributes as humans would
- 🔗 **Fluent API** - Method chaining for readable, expressive code
- 🏗️ **Multi-window/tab support** - Manage multiple browser contexts
- 🎭 **Multiple element types** - Semantic selectors (button, textbox, checkbox, etc.)
- 📍 **Spatial references** - Locate elements by position relative to others
- ⌨️ **Rich interactions** - Click, drag, type, hover, upload files, handle alerts
- 📦 **Cross-browser** - Chrome, Firefox, Safari support
- 🔧 **Flexible configuration** - Config file, environment variables, or CLI

## Installation

```bash
npm install @nodebug/selenium
```

## Quick Start

### 1. Create Configuration

Create `.config/selenium.json`:

```json
{
  "browser": "chrome",
  "headless": false,
  "timeout": 10
}
```

See [Configuration Guide](docs/CONFIGURATION.md) for all options.

### 2. Use in Code

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()

// Navigate
await browser.goto('https://example.com')

// Find and interact with elements
await browser.textbox('Email').write('user@example.com')
await browser.button('Submit').click()

// Check state
const visible = await browser.element('Success').isVisible()

// Cleanup
await browser.close()
```

## Core Patterns

### Element Selection

Find elements using type and text/attribute:

```javascript
// By type (button, textbox, link, etc.)
await browser.button('Click Me').click()
await browser.textbox('Email').write('...')
await browser.checkbox('Subscribe').check()

// Generic selector
await browser.element('Text').click()

// By attribute if text doesn't match
await browser.textbox('data-testid-email').write('...')
```

Learn more: [Core Concepts](docs/CONCEPTS.md#element-locator-strategy-human-like-prioritization)

### Fluent Operations

Chain intermediate operations ending with a terminal operation:

```javascript
// Intermediate operations build selector, don't execute
await browser
  .button('Delete')           // Select button
  .below()                    // Position filter
  .element('Actions')         // Anchor reference
  .click()                    // Terminal operation (execute)
```

Learn more: [Core Concepts](docs/CONCEPTS.md#operations-intermediate-vs-terminal)

### Spatial References

Find elements by position relative to others:

```javascript
await browser.button('Delete').below().element('Section').click()
await browser.textbox('Name').toRightOf().label('Name').write('John')
await browser.link('Home').within().dialog('Modal').click()
```

Learn more: [Core Concepts](docs/CONCEPTS.md#spatial-references)

### Multi-Window & Multi-Tab

```javascript
// Windows (separate contexts)
await browser.window().new()
await browser.window('Title').switch()
await browser.window().maximize()

// Tabs (shared context)
await browser.tab().new()
await browser.tab(0).switch()
await browser.tab().close()
```

Learn more: [Core Concepts](docs/CONCEPTS.md#window-vs-tab-management)

## Common Tasks

### Handle Alerts

```javascript
if (await browser.alert().isVisible()) {
  await browser.alert().accept()
}

// Send text to prompt
await browser.alert().write('User input')

// Dismiss alert
await browser.alert().dismiss()
```

### Upload Files

```javascript
await browser.file('Choose File').upload('/path/to/file.txt')
```

### Check Element State

```javascript
// Get boolean for conditional logic
const visible = await browser.element('Item').isVisible()
const disabled = await browser.button('Submit').isDisabled()
const checked = await browser.checkbox('Subscribe').isChecked()

if (visible) {
  await browser.element('Item').click()
}

// Assert and wait for state changes (throws error if not met)
await browser.element('Loading').isNotDisplayed()  // Assert disappears
await browser.button('Ready').isDisplayed()        // Assert appears
```

### Get Element Properties

```javascript
const text = await browser.element('div').get.text()
const id = await browser.element('input').get.attribute('id')
const screenshot = await browser.element('chart').get.screenshot()
```

### Multiple Possible Names

Use `or()` when elements might have different names:

```javascript
await browser.button('Save').or().button('Apply').click()
```

### Exact Text Matching

By default, partial matches work. Use `exact()` for exact matching:

```javascript
await browser.exact().element('Test').click()  // Won't match 'Testing'
```

## Documentation

- **[Core Concepts](docs/CONCEPTS.md)** - Understand operations, locator strategy, spatial references
- **[API Reference](docs/API-REFERENCE.md)** - Complete method reference
- **[Configuration](docs/CONFIGURATION.md)** - Browser and session setup
- **[Window Operations](docs/window-management.md)** - Multi-window patterns
- **[Tab Operations](docs/tab-management.md)** - Multi-tab patterns
- **[Alert Handling](docs/alerts.md)** - JavaScript alert/prompt handling
- **[Click Interactions](docs/click-delegate.md)** - Various click types (double, right, long press, etc.)
- **[Input Operations](docs/input-delegate.md)** - Text entry, focus, clear, overwrite
- **[Visibility Control](docs/visibility-delegate.md)** - Visibility checks, scrolling, hiding
- **[Element Types](docs/element-types.md)** - Complete list of supported element selectors
- **[Locator Strategy](docs/locator-strategy.md)** - How elements are prioritized and matched
- **[Spatial References](docs/spatial-references.md)** - Position-based element selection
- **[Multiple References](docs/multiple-references.md)** - Using `or()` for alternative names
- **[Messenger](docs/messenger.md)** - Log message generation

## Examples

### Login Form

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()
await browser.goto('https://example.com/login')

// Fill form
await browser.textbox('Username').write('user@example.com')
await browser.textbox('Password').write('password123')
await browser.checkbox('Remember Me').check()

// Submit
await browser.button('Sign In').click()

// Wait for redirect
await browser.element('Dashboard').isDisplayed()

await browser.close()
```

### Data Table Interaction

```javascript
// Click delete in specific row
await browser.button('Delete')
  .within()
  .row('User123')
  .click()

// Confirm delete
await browser.button('Confirm').click()
```

### Modal Dialog

```javascript
// Fill form in modal
await browser.textbox('Name')
  .within()
  .dialog('User Details')
  .write('John Doe')

// Submit
await browser.button('Save')
  .within()
  .dialog('User Details')
  .click()

// Verify modal closed
const visible = await browser.dialog('User Details').isVisible()
```

### Multi-Window

```javascript
await browser.goto('https://example.com')

// Open new window
await browser.window().new()
await browser.goto('https://other.com')

// Switch back
await browser.window('Example').switch()

// Get URLs
const url1 = await browser.window().get.url()
```

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome | ✅ Fully supported |
| Firefox | ✅ Fully supported |
| Safari | ✅ Fully supported |

## API Overview

### Session Management
`start()`, `close()`, `reset()`, `sleep(ms)`

### Navigation
`goto(url)`, `refresh()`, `goBack()`, `goForward()`

### Element Selection
`element()`, `button()`, `textbox()`, `checkbox()`, `radio()`, `link()`, `image()`, `file()`, `dropdown()`, and 15+ more

### Interaction
`click()`, `write()`, `hover()`, `drag()`, `upload()`, `focus()`, `clear()`, `check()`, `uncheck()`

### State Checks
- **Conditionals** (return true/false): `isVisible()`, `isDisabled()`, `isChecked()`, `isUnchecked()`
- **Assertions** (throw errors): `isDisplayed()`, `isNotDisplayed()`

### Data
`get.text()`, `get.value()`, `get.attribute()`, `get.screenshot()`, `get.size()`, `get.name()`, `get.os()`

### Windows
`window()`, `window().new()`, `window().close()`, `window().switch()`, `window().maximize()`, `window().get.url()`, `window().get.title()`

### Tabs
`tab()`, `tab().new()`, `tab().close()`, `tab().switch()`, `tab().get.url()`, `tab().get.title()`

### Alerts
`alert()`, `alert().accept()`, `alert().dismiss()`, `alert().write()`, `alert().get.text()`

### Positioning
`atIndex()`, `above()`, `below()`, `toLeftOf()`, `toRightOf()`, `within()`, `near()`, `or()`, `exact()`, `hidden()`

See [API Reference](docs/API-REFERENCE.md) for complete documentation.

## Configuration

### Minimal Setup

```json
{
  "browser": "chrome",
  "headless": true,
  "timeout": 10
}
```

### Full Example

```json
{
  "browser": "chrome",
  "headless": false,
  "timeout": 10,
  "width": 1280,
  "height": 800,
  "incognito": false,
  "downloadsPath": "./reports/downloads",
  "hub": null,
  "goog:chromeOptions": {
    "args": ["--no-sandbox"]
  }
}
```

See [Configuration Guide](docs/CONFIGURATION.md) for all options.

## Browser Lifecycle

```javascript
const browser = new WebBrowser()

await browser.start()      // Initialize session
// ... perform operations ...
await browser.close()      // Cleanup
```

The library automatically handles cleanup on process termination (SIGINT, SIGTERM).

## Best Practices

1. **Use semantic types** - `button()`, `textbox()` vs generic `element()`
2. **Leverage text matching** - Target visible text when possible
3. **Apply spatial context** - Use `within()`, `below()`, etc. for precise targeting
4. **Check state before acting** - Verify visibility/disabled state before interaction
5. **Chain operations** - Build fluent chains for readability
6. **Use `or()` sparingly** - Multiple alternatives are last resort
7. **Use correct state check** - `isVisible()` for conditionals (returns boolean), `isDisplayed()`/`isNotDisplayed()` for assertions (throw errors)

## Contributing

Issues and pull requests welcome on [GitHub](https://github.com/node-bug/selenium).

## License

MIT

---

**Questions?** Check [Core Concepts](docs/CONCEPTS.md) for how everything works, or [API Reference](docs/API-REFERENCE.md) for specific methods.
