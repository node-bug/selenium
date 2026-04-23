# WebBrowser

A JavaScript library for browser automation with a fluent API, built on top of Selenium WebDriver.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
  - [Browser Class](#browser-class)
  - [Window Management](#window-management)
  - [Tab Management](#tab-management)
  - [Alerts](#alerts)
  - [Element Methods](#element-methods)
  - [Command Delegates](#command-delegates)
- [Browser Management](#browser-management)
- [Examples](#examples)
- [Testing](#testing)
- [Browser Support](#browser-support)
- [Documentation](#documentation)
- [Contributing](#contributing)
- [License](#license)

## Features

- Fluent API for browser automation
- Support for various element types (buttons, textboxes, checkboxes, etc.)
- Element location and manipulation
- Navigation and browser control
- Drag and drop operations
- File upload capabilities
- Visibility and state checks
- Method chaining support
- Human-like element prioritization for text and attributes

## Installation

```bash
npm install @nodebug/selenium
```

## Quick Start

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()

// Navigate to a page
await browser.goto('https://example.com')

// Find and interact with elements
await browser.element('input').write('Hello World')
await browser.button('submit').click()

// Check element visibility
const isVisible = await browser.element('div').isVisible()
```

## Configuration

Before using the library, you must create a configuration file named `selenium.json` in your project's `.config` directory. This file defines which browser to use and other settings.

Create a `.config/selenium.json` file with the desired browser configuration:

```json
{
  "browser": "firefox",
  "headless": true,
  "timeout": 10
}
```

For more information on browser management and configuration options, see the [browser management documentation](docs/browser-management.md).

## Usage Guide

### Element Selection Priority

When locating elements, the library prioritizes visible text and attributes in the following order, processing elements as a human would:

1. **Text** - Text content of the element
2. **Placeholder** - Placeholder attribute
3. **Value** - Value attribute
4. **data-tid/data-testid/data-test-id/Id/resource-id/data-id** - Test identifiers
5. **Name** - Name attribute
6. **aria-label** - ARIA label attribute
7. **CSS Class** - CSS class attribute
8. **Hint/Title/Tooltip** - Title or tooltip attributes
9. **Alt/Src** - Alt or src attributes for images

For inputs, edits, dropdowns, selects, and other form elements, the library will also search for corresponding labels to improve element identification accuracy.

For detailed information about how elements are located and prioritized in this library, please see the [locator strategy documentation](docs/locator-strategy.md).

### Basic Usage Examples

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()

// Navigate to a page
await browser.goto('https://example.com')

// Find and interact with elements
await browser.element('input').write('Hello World')
await browser.button('submit').click()

// Check element visibility
const isVisible = await browser.element('div').isVisible()

// Element Selection Priority Examples
// Find a button by its text content
await browser.button('Submit').click()

// Find a textbox by its placeholder
await browser.textbox('Enter your email').write('user@example.com')

// Find a checkbox by its data-testid attribute
await browser.checkbox('remember-me').check()

// Find a dropdown by its name attribute
await browser.element('country').click()

// Find a link by its aria-label
await browser.link('Go to home page').click()

// Find an image by its alt text
await browser.image('Company Logo').click()

// Find a textbox by its value
await browser.textbox('john.doe@example.com').write('new.email@example.com')

// Find a button by its data-id
await browser.button('save-button').click()

// Find a radio button by its name
await browser.radio('male gender').check()

// Find a file input by its title attribute
await browser.file('Upload your resume').upload('/path/to/resume.pdf')

// Handle alerts
const isAlertPresent = await browser.alert('with text').isVisible()
if (isAlertPresent) {
  await browser.alert().accept()
}

// Hover over an element to trigger hover states
await browser.element('menu').hover()
await browser.button('dropdown').hover()
```

## API Reference

### Browser Class

For detailed information about the Browser class and its methods, see the [browser commands documentation](docs/browser-commands.md).

#### Constructor

```javascript
const browser = new Browser()
```

#### Core Methods

- `start()` - Start a new browser session
- `goto(url)` - Navigate to a URL
- `element(selector)` - Find an element by selector
- `button(selector)` - Find a button element
- `textbox(selector)` - Find a textbox element
- `checkbox(selector)` - Find a checkbox element
- `write(text)` - Write text to an element
- `click()` - Click on an element
- `hover()` - Hover over an element
- `find()` - Find an element
- `clear()` - Clear text from an element
- `check()` - Check a checkbox
- `uncheck()` - Uncheck a checkbox
- `isVisible()` - Check if element is visible
- `isDisplayed()` - Check if element is displayed
- `isNotDisplayed()` - Check if element is not displayed
- `isDisabled()` - Check if element is disabled
- `hide()` - Hide an element
- `unhide()` - Unhide an element
- `upload(filePath)` - Upload a file
- `drag()` - Start drag operation
- `onto()` - Specify drop target
- `drop()` - Complete drag and drop operation

### Window Management

The library provides advanced window management capabilities through the `Window` class.

For detailed information about window management, see the [window management documentation](docs/window-management.md).

For more information about multiple element references, see the [multiple references documentation](docs/multiple-references.md).

For information about spatial references and element positioning, see the [spatial references documentation](docs/spatial-references.md).

#### Window Object Methods

**window().get.url()**
Gets the current URL.

```javascript
const url = await browser.window().get.url()
```

**window().get.title()**
Gets the page title.

```javascript
const title = await browser.window().get.title()
```

**window().maximize()**
Maximizes the browser window.

```javascript
await browser.window().maximize()
```

**window().minimize()**
Minimizes the browser window.

```javascript
await browser.window('some window title').minimize()
```

**window().fullscreen()**
Switches the browser to fullscreen mode.

```javascript
await browser.window(index).fullscreen()
await browser.window('some window title').fullscreen()
await browser.window().fullscreen()
```

**window().new()**
Opens a new browser window.

```javascript
await browser.window().new()
```

**window().close()**
Closes the current window.

```javascript
await browser.window(index).close()
await browser.window('title').close()
await browser.window().close()
```

**window().isDisplayed()**
Checks if a window with a specific title is displayed and visible.

```javascript
// Check current window
const isDisplayed = await browser.window('some title').isDisplayed()

// Check with custom timeout
const isDisplayed = await browser.window('some title').isDisplayed(5000)
```

**window().switch()**
Switches to a window with a specific title.

```javascript
// Switch to window with title
await browser.window('some title').switch()

// Switch with custom timeout
await browser.window('some title').switch(5000)
```

### Tab Management

The library provides tab management capabilities through the `Tab` class.

For detailed information about tab management, see the [tab management documentation](docs/tab-management.md).

#### Tab Object Methods

**tab.new()**
Opens a new browser tab.

```javascript
await browser.tab().new()
```

**tab.close()**
Closes the current tab.

```javascript
await browser.tab('some tab title').close()
await browser.tab(3).close()
```

**tab.isDisplayed()**
Checks if a tab with a specific index is displayed and visible.

```javascript
// Check if tab at index 0 is displayed
const isDisplayed = await browser.tab(0).isDisplayed()

// Check with custom timeout
const isDisplayed = await browser.tab(0).isDisplayed(5000)
```

**tab.switch()**
Switches to a tab with a specific index.

```javascript
// Switch to tab at index 0
await browser.tab(0).switch()

// Switch with custom timeout
await browser.tab(0).switch(5000)
```

**tab.get.url()**
Gets the current tab or another tab URL.

```javascript
const url = await browser.tab().get.url()
const url2 = await browser.tab('some other tab').get.url()
```

**tab.get.title()**
Gets the current tab or by index title.

```javascript
const title = await browser.tab().get.title()
const title2 = await browser.tab(5).get.title()
```

### Element Methods

- `element()` - Generic element selector
- `button()` - Button element selector
- `radio()` - Radio button element selector
- `textbox()` - Textbox element selector
- `checkbox()` - Checkbox element selector
- `image()` - Image element selector
- `toolbar()` - Toolbar element selector
- `tab()` - Tab element selector
- `link()` - Link element selector
- `dialog()` - Dialog element selector
- `file()` - File input element selector

### Command Delegates

For detailed information about command delegates, see the documentation:

- [Click Delegate](docs/click-delegate.md)
- [Input Delegate](docs/input-delegate.md)
- [Visibility Delegate](docs/visibility-delegate.md)

### Alerts

The library provides alert handling capabilities through the Alert class.

For detailed information about alerts, see the [alerts documentation](docs/alerts.md).

## Browser Management

The WebBrowser library provides methods to start and stop browser sessions:

### Starting a Browser Session

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()
```

### Stopping a Browser Session

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()

// Do some browser operations...

// Close the browser
await browser.close()
```

### Browser Selection

The browser type is determined by configuration and cannot be set programmatically. The browser can be selected using:

1. **Configuration file**: Using `.config/selenium.json`
2. **Environment variables**: Setting `browser` environment variable
3. **Command line parameters**: Passing as Node.js command line arguments

#### Using Configuration File

Create a `.config/selenium.json` file with the desired browser:

```json
{
  "browser": "firefox",
  "headless": true,
  "timeout": 10
}
```

#### Using Environment Variables

Set the browser type using environment variables:

```bash
export browser=firefox
node your-script.js
```

Or set it directly in the command:

```bash
browser=firefox node your-script.js
```

#### Using Command Line Parameters

You can also set the browser through command line arguments when running Node.js:

```bash
node your-script.js --browser=firefox
```

### Browser Options

Additional browser options can be configured in the selenium.json file:

```json
{
  "browser": "chrome",
  "headless": true,
  "timeout": 10,
  "downloadsPath": "./reports/downloads",
  "incognito": false,
  "height": null,
  "width": null,
  "hub": null,
  "goog:chromeOptions": {
    "args": ["--no-sandbox", "--disable-dev-shm-usage"]
  }
}
```

#### Headless Mode

Headless mode allows the browser to run without a graphical user interface. This is useful for running tests in CI/CD environments or when you don't need to see the browser window.

```json
{
  "browser": "chrome",
  "headless": true
}
```

When `headless` is set to `true`, the browser will run in headless mode. This is particularly useful for automated testing.

#### Incognito Mode

Incognito mode provides a private browsing session where no cookies or browsing history are saved.

```json
{
  "browser": "chrome",
  "incognito": true
}
```

## Examples

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
    const browserName = await browser.get.name()
    const osName = await browser.get.os()
    console.log(`Browser: ${browserName}, OS: ${osName}`)

    // Set window size
    await browser.setSize({ width: 1280, height: 800 })

    // Navigate to a URL
    await browser.goto('https://www.google.com')
    console.log(`URL: ${await browser.window().get.url()}`)

    // Wait for page to load
    await browser.sleep(1000)

    // Navigate back
    await browser.goBack()

    // Refresh the page
    await browser.refresh()

    // Get console errors
    const errors = await browser.window().get.consoleErrors()
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

### Alert Management

The library provides alert management capabilities through the `Alert` class.

**alert.accept()**
Accepts an alert.

```javascript
await browser.alert().accept()
await browser.alert('some text').accept()
```

**alert.dismiss()**
Dismisses an alert.

```javascript
await browser.alert().dismiss()
await browser.alert('some text').dismiss()
```

## Browser Support

- Chrome
- Firefox
- Safari
- Edge

## Documentation

For detailed information about specific features, see the documentation:

- [Alerts](docs/alerts.md) - Alert handling methods
- [Browser Commands](docs/browser-commands.md) - Browser class methods and properties
- [Browser Management](docs/browser-management.md) - Configuration and browser selection
- [Click Delegate](docs/click-delegate.md) - Click command delegate
- [Element Types](docs/element-types.md) - Supported element types and selectors
- [Input Delegate](docs/input-delegate.md) - Input command delegate
- [Locator Strategy](docs/locator-strategy.md) - How elements are located and prioritized
- [Multiple References](docs/multiple-references.md) - Multiple element references
- [Spatial References](docs/spatial-references.md) - Spatial references and positioning
- [Tab Management](docs/tab-management.md) - Tab management methods
- [Visibility Delegate](docs/visibility-delegate.md) - Visibility command delegate
- [Window Management](docs/window-management.md) - Window management methods

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and questions, please visit the [GitHub repository](https://github.com/node-bug/selenium/issues).
