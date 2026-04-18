# WebBrowser

A JavaScript library for browser automation with a fluent API, built on top of Selenium WebDriver.

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

## Usage

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()

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
```

## API Reference

### Core Methods

- `start()` - Start a new browser session
- `goto(url)` - Navigate to a URL
- `element(selector)` - Find an element by selector
- `button(selector)` - Find a button element
- `textbox(selector)` - Find a textbox element
- `checkbox(selector)` - Find a checkbox element
- `write(text)` - Write text to an element
- `click()` - Click on an element
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

#### Examples

```javascript
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
await browser.radio('gender male').check()

// Find a file input by its title attribute
await browser.file('Upload your resume').upload('/path/to/resume.pdf')
```

### Navigation Methods

- `refresh()` - Refresh the current page
- `goBack()` - Go back in browser history
- `goForward()` - Go forward in browser history
- `window()` - Switch to a different window

### Element Type Methods

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

## Testing

The project includes both unit and integration tests:

```bash
# Run unit tests
npm test -- tests/unit/webbrowser.test.js

# Run integration tests
npm test -- tests/integration/webbrowser.test.js

# Run all tests
npm test
```

## Examples

The project includes several examples demonstrating various features:

- `examples/form-interaction-example.js` - Basic form interaction
- `examples/javascript-alerts-example.js` - JavaScript alert handling
- `examples/tab-management-example.js` - Tab management
- `examples/window-management-example.js` - Window management
- `examples/comprehensive-demo.js` - Comprehensive demo showing various features
- `examples/comprehensive-demo.js` - Comprehensive demo showing various features interacting with the SeleniumBase demo page

To run any example:

```bash
node examples/[example-name].js
```

## License

MIT

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
await browser.window().maximize()

// Minimize window
await browser.window().minimize()

// Switch to fullscreen
await browser.window().fullscreen()

// Restore window size
await browser.setSize({ width: 1280, height: 800 })
```

#### Window Management Example ([window-management-example.js](window-management-example.js))

This example demonstrates advanced window management features:

```javascript
// Check if a window is displayed
const isDisplayed = await browser.window('some title').isDisplayed()
console.log(`Window is displayed: ${isDisplayed}`)

// Switch to a window with a specific title
await browser.window('some other title').switch()

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
const isDisplayed = await browser.window('some title').isDisplayed()

// Check with custom timeout
const isDisplayed = await browser.window('some title').isDisplayed(5000)
```

**switch()**
Switches to a window with a specific title.

```javascript
// Switch to window with title "Google"
await browser.window('some title').switch()

// Switch with custom timeout
await browser.window('some other title').switch(5000)
```

**new()**
Opens a new browser window.

```javascript
await browser.window().new()
```

**close()**
Closes the current window.

```javascript
await browser.window().close()
```

**maximize()**
Maximizes the browser window.

```javascript
await browser.window().maximize()
```

**minimize()**
Minimizes the browser window.

```javascript
await browser.window('some window title').minimize()
```

**fullscreen()**
Switches the browser to fullscreen mode.

```javascript
await browser.window(index).fullscreen()
await browser.window('some window title').fullscreen()
await browser.window().fullscreen()
```

### Tab Management Examples

The library provides tab management capabilities through the `Tab` class.

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

### Alert Management Examples

The library provides alert management capabilities through the `Alert` class.

**alert.text()**
Sets the text for an alert to be handled.

```javascript
await browser.alert().get.text()
```

**alert.isVisible()**
Accepts an alert.

```javascript
await browser.alert('Some alert text').isVisible()
```

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

```javascript
await browser.window().maximize()
```

**minimize()**
Minimizes the browser window.

```javascript
await browser.window().minimize()
```

**fullscreen()**
Switches the browser to fullscreen mode.

```javascript
await browser.window().fullscreen()
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
const browserName = await browser.get.name()
```

**os()**
Gets the operating system name.

```javascript
const osName = await browser.get.os()
```

**setSize(size)**
Sets the browser window size.

```javascript
await browser.setSize({ width: 1280, height: 800 })
```

**get.size()**
Gets the current browser window size.

```javascript
const size = await browser.get.size()
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
const url = await browser.window().get.url()
```

**window.get.title()**
Gets the page title.

```javascript
const title = await browser.window().get.title()
```

**window.maximize()**
Maximizes the browser window.

```javascript
await browser.window().maximize()
```

**window.minimize()**
Minimizes the browser window.

```javascript
await browser.window('some window title').minimize()
```

**window.fullscreen()**
Switches the browser to fullscreen mode.

```javascript
await browser.window(index).fullscreen()
await browser.window('some window title').fullscreen()
await browser.window().fullscreen()
```

**window.new()**
Opens a new browser window.

```javascript
await browser.window().new()
```

**window.close()**
Closes the current window.

```javascript
await browser.window(index).close()
await browser.window('title').close()
await browser.window().close()
```

**window.isDisplayed()**
Checks if a window with a specific title is displayed and visible.

```javascript
// Check current window
const isDisplayed = await browser.window('some title').isDisplayed()

// Check with custom timeout
const isDisplayed = await browser.window('some title').isDisplayed(5000)
```

**window.switch()**
Switches to a window with a specific title.

```javascript
// Switch to window with title
await browser.window('some title').switch()

// Switch with custom timeout
await browser.window('some title').switch(5000)
```

#### Tab Object

The `browser.tab` object provides access to tab management methods.

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

## Get Methods

The library also provides `.get` methods for retrieving element information:

### Element Get Methods

#### get.text()

Gets text content of an element using the `.get` method.

```javascript
const text = await browser.element('welcome').get.text()
```

#### get.attribute(name)

Gets attribute value of an element using the `.get` method.

```javascript
const href = await browser.link('home').get.attribute('href')
```

#### get.screenshot()

Captures screenshot of element using the `.get` method.

```javascript
const screenshot = await browser.element('form').get.screenshot()
```

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
