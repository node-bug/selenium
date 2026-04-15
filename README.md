# @nodebug/selenium

A comprehensive browser automation library built on top of Selenium WebDriver for Node.js. This library provides a high-level API for automating web browsers with support for multiple browsers and operating systems.

## Features

- **Multi-browser Support**: Chrome, Firefox, Safari, and Edge
- **Cross-platform**: Works on Windows, macOS, and Linux
- **Easy API**: Simple and intuitive interface for common browser automation tasks
- **Window Management**: Resize, maximize, and manage browser windows
- **Navigation**: Navigate between URLs, go back/forward, and refresh pages
- **Page Information**: Get URL, title, and other page metadata
- **Console Monitoring**: Detect and log console errors
- **State Management**: Reset browser state including cookies and storage
- **Actions API**: Advanced interactions using Selenium WebDriver actions
- **Error Handling**: Comprehensive error handling and logging

## Installation

```bash
npm install @nodebug/selenium
```

## Requirements

- Node.js >= 24.x
- Selenium WebDriver 4.43.0+
- Appropriate browser drivers installed

## Configuration

The library uses `@nodebug/config` for configuration. Create a configuration file (e.g., `.nodebugrc` or `config.js`) with the following options:

```javascript
module.exports = {
  selenium: {
    hub: 'http://localhost:4444', // Selenium Grid hub URL (optional)
    timeout: 30, // Default timeout in seconds
    width: 1280, // Default browser width
    height: 800, // Default browser height
  },
}
```

## Usage

### Basic Example

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()

async function runExample() {
  try {
    // Start the browser
    await browser.start()
    console.log('Browser started')

    // Get browser information
    const browserName = await browser.name()
    const osName = await browser.os()
    console.log(`Browser: ${browserName}, OS: ${osName}`)

    // Set window size
    await browser.setSize({ width: 1280, height: 800 })

    // Navigate to a URL
    await browser.goto('https://www.google.com')
    console.log(`URL: ${await browser.window.get.url()}`)

    // Wait for page to load
    await browser.sleep(1000)

    // Navigate back
    await browser.goBack()

    // Refresh the page
    await browser.refresh()

    // Get console errors
    const errors = await browser.consoleErrors()
    console.log(`Errors found: ${errors.length}`)

    // Reset browser state
    await browser.reset()

    // Close the browser
    await browser.close()
  } catch (error) {
    console.error('Error:', error.message)
  }
}

runExample()
```

### Example Scripts

The repository includes several example scripts demonstrating different features:

- **[example.js](example.js)** - Comprehensive example showing various browser automation features
- **[window-features-example.js](window-features-example.js)** - Demonstrates window management features (maximize, minimize, fullscreen)
- **[advanced-actions-example.js](advanced-actions-example.js)** - Shows advanced actions like sleep, navigation, and console error detection
- **[browser-info-example.js](browser-info-example.js)** - Demonstrates browser information retrieval and basic operations
- **[window-management-example.js](window-management-example.js)** - Demonstrates window management features including `isDisplayed` and `switch` functions
- **[consolidated-example.js](consolidated-example.js)** - Consolidated example covering all WebBrowser features

Run any example:

```bash
node example.js
```

### Window Management Examples

The library provides advanced window management capabilities through the `Window` class. The following examples demonstrate these features:

#### Window Features Example ([window-features-example.js](window-features-example.js))

This example demonstrates basic window management operations:

```javascript
// Set window size
await browser.setSize({ width: 1280, height: 800 })

// Maximize window
await browser.window.maximize()

// Minimize window
await browser.window.minimize()

// Switch to fullscreen
await browser.window.fullscreen()

// Restore window size
await browser.setSize({ width: 1280, height: 800 })
```

#### Window Management Example ([window-management-example.js](window-management-example.js))

This example demonstrates advanced window management features:

```javascript
// Check if a window is displayed
const isDisplayed = await browser.window.title('some title').isDisplayed()
console.log(`Window is displayed: ${isDisplayed}`)

// Switch to a window with a specific title
await browser.window.title('some other title').switch()

// Open a new window
await browser.window.new()
await browser.goto('https://www.wikipedia.com')

// Close a specific window
await browser.window.close()
```

#### Key Window Management Features

**isDisplayed()**
Checks if a window with a specific title is displayed and visible.

```javascript
// Check if current window is displayed
const isDisplayed = await browser.window.title('some title').isDisplayed()

// Check with custom timeout
const isDisplayed = await browser.window.title('some title').isDisplayed(5000)
```

**switch()**
Switches to a window with a specific title.

```javascript
// Switch to window with title "Google"
await browser.window.title('some title').switch()

// Switch with custom timeout
await browser.window.title('some other title').switch(5000)
```

**new()**
Opens a new browser window.

```javascript
await browser.window.new()
```

**close()**
Closes the current window.

```javascript
await browser.window.close()
```

**maximize()**
Maximizes the browser window.

```javascript
await browser.window.maximize()
```

**minimize()**
Minimizes the browser window.

```javascript
await browser.window.minimize()
```

**fullscreen()**
Switches the browser to fullscreen mode.

```javascript
await browser.window.fullscreen()
```

### API Reference

#### Browser Class ([app/browser/index.js](app/browser/index.js))

The main Browser class provides core browser automation functionality.

##### Constructor

```javascript
const browser = new Browser()
```

##### Methods

**start()**
Starts a new browser session.

```javascript
await browser.start()
```

**close()**
Closes the browser session.

```javascript
await browser.close()
```

**name()**
Gets the browser name.

```javascript
const browserName = await browser.name()
```

**os()**
Gets the operating system name.

```javascript
const osName = await browser.os()
```

**setSize(size)**
Sets the browser window size.

```javascript
await browser.setSize({ width: 1280, height: 800 })
```

**getSize()**
Gets the current browser window size.

```javascript
const size = await browser.getSize()
// Returns: { width: number, height: number }
```

**goto(url)**
Navigates to the specified URL.

```javascript
await browser.goto('https://example.com')
```

**goBack()**
Navigates back in browser history.

```javascript
await browser.goBack()
```

**goForward()**
Navigates forward in browser history.

```javascript
await browser.goForward()
```

**refresh()**
Refreshes the current page.

```javascript
await browser.refresh()
```

**sleep(ms)**
Pauses execution for the specified milliseconds.

```javascript
await browser.sleep(1000)
```

**reset()**
Resets browser state by closing all windows, deleting cookies, and clearing storage.

```javascript
await browser.reset()
```

**consoleErrors()**
Gets console errors from the browser.

```javascript
const errors = await browser.consoleErrors()
// Returns: Array of error entries
```

**actions()**
Gets the WebDriver actions instance for advanced interactions.

```javascript
const actions = browser.actions()
```

#### Window Object

The `browser.window` object provides access to window management methods.

**window.get.url()**
Gets the current URL.

```javascript
const url = await browser.window.get.url()
```

**window.get.title()**
Gets the page title.

```javascript
const title = await browser.window.get.title()
```

**window.maximize()**
Maximizes the browser window.

```javascript
await browser.window.maximize()
```

**window.minimize()**
Minimizes the browser window.

```javascript
await browser.window.minimize()
```

**window.fullscreen()**
Switches the browser to fullscreen mode.

```javascript
await browser.window.fullscreen()
```

**window.new()**
Opens a new browser window.

```javascript
await browser.window.new()
```

**window.close()**
Closes the current window.

```javascript
await browser.window.close()
```

**window.isDisplayed()**
Checks if a window with a specific title is displayed and visible.

```javascript
// Check current window
const isDisplayed = await browser.window.title('some title').isDisplayed()

// Check with custom timeout
const isDisplayed = await browser.window.title('some title').isDisplayed(5000)
```

**window.switch()**
Switches to a window with a specific title.

```javascript
// Switch to window with title "Google"
await browser.window.title('some title').switch()

// Switch with custom timeout
await browser.window.title('some title').switch(5000)
```

## Browser Support

- Chrome
- Firefox
- Safari
- Edge

## Testing

Run the test suite:

```bash
npm test
```

Run linting:

```bash
npm run lint
```

## License

MPL-2.0

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please visit the [GitHub repository](https://github.com/node-bug/selenium/issues).

## Project Structure

```
test2/
├── app/
│   ├── browser/
│   │   ├── index.js          # Main Browser class
│   │   └── window.js         # Window management class
│   └── capabilities/
│       ├── chrome.js
│       ├── firefox.js
│       ├── safari.js
│       ├── index.js
│       └── preferences.js
├── example.js                 # Basic example
├── window-features-example.js # Window management examples
├── advanced-actions-example.js # Advanced actions examples
├── browser-info-example.js    # Browser info examples
├── index.js                   # WebBrowser class (extends Browser)
├── package.json
├── jest.config.js
├── eslint.config.js
└── README.md
```
