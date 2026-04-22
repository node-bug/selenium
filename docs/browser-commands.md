# Browser Class

The Browser class provides a high-level API for automating web browsers using Selenium WebDriver. It supports multiple browsers (Chrome, Firefox, Safari) and provides convenient methods for window management, navigation, and browser state control.

## Usage

```javascript
import Browser from './app/browser/index.js'

const browser = new Browser()
await browser.new()
await browser.goto('https://www.example.com')
await browser.close()
```

## Constructor

### `new Browser()`

Creates a new Browser instance.

**Parameters:**

- `options` (Object, optional): Browser configuration options
  - `hub` (string): Selenium Grid hub URL (optional)
  - `timeout` (number): Default timeout in seconds
  - `width` (number): Default browser width
  - `height` (number): Default browser height

## Properties

### `window`

Window management instance. Returns a Window instance for managing browser windows.

**Usage:**

```javascript
// Get window instance
const window = browser.window()

// Get window title
const title = await browser.window().get.title()
```

### `tab`

Tab management instance. Returns a Tab instance for managing browser tabs.

**Usage:**

```javascript
// Get tab instance
const tab = browser.tab()

// Get tab title
const title = await browser.tab().get.title()
```

### `alert`

Alert management instance. Returns an Alert instance for managing browser alerts.

**Usage:**

```javascript
// Get alert instance
const alert = browser.alert()

// Get alert text
const text = await browser.alert().get.text()
```

### `capabilities`

Browser capabilities configuration object.

**Usage:**

```javascript
// Get capabilities
const capabilities = browser.capabilities

// Set capabilities
browser.capabilities = { browserName: 'chrome' }
```

### `driver`

Selenium WebDriver instance.

**Usage:**

```javascript
// Get driver
const driver = browser.driver

// Set driver
browser.driver = driver
```

## Methods

### `async new()`

Initialize a new browser session with specified capabilities.

**Returns:** `Promise<void>` - Resolves when the browser session is initialized

**Example:**

```javascript
await browser.new()
```

### `get timeout()`

Get the default timeout value in milliseconds.

**Returns:** `number` - Timeout value in milliseconds

**Example:**

```javascript
const timeout = browser.timeout
console.log(timeout) // e.g., 30000
```

### `async sleep(ms)`

Sleep for specified milliseconds.

**Parameters:**

- `ms` (number): Milliseconds to sleep

**Returns:** `Promise<void>` - Resolves after the specified time

**Example:**

```javascript
await browser.sleep(1000) // Sleep for 1 second
```

### `async close()`

Close the browser session.

**Returns:** `Promise<boolean>` - True if successful

**Example:**

```javascript
await browser.close()
```

### `async setSize(size)`

Set browser window size.

**Parameters:**

- `size` (Object): Window size object with width and height
  - `width` (number): Width in pixels
  - `height` (number): Height in pixels

**Returns:** `Promise<boolean>` - True if successful

**Example:**

```javascript
await browser.setSize({ width: 1280, height: 800 })
```

### `async goto(url)`

Navigate to a URL.

**Parameters:**

- `url` (string): URL to navigate to

**Returns:** `Promise<boolean>` - True if successful

**Example:**

```javascript
await browser.goto('https://www.google.com')
```

### `async refresh()`

Refresh the current page.

**Returns:** `Promise<void>` - Resolves when the page is refreshed

**Example:**

```javascript
await browser.refresh()
```

### `async goBack()`

Go back in browser history.

**Returns:** `Promise<boolean>` - True if successful

**Example:**

```javascript
await browser.goBack()
```

### `async goForward()`

Go forward in browser history.

**Returns:** `Promise<boolean>` - True if successful

**Example:**

```javascript
await browser.goForward()
```

### `async reset()`

Reset browser state (close all windows, delete cookies, clear storage).

**Returns:** `Promise<void>` - Resolves when the browser is reset

**Example:**

```javascript
await browser.reset()
```

### `async get.consoleErrors()`

Get console errors from the current window or tab.

**Returns:** `Promise<Array>` - Array of console error entries

**Example:**

```javascript
const errors = await browser.window().get.consoleErrors()
// or
const errors = await browser.tab.get.consoleErrors()
```

### `actions()`

Get the WebDriver actions instance.

**Returns:** `Object` - WebDriver actions instance

**Example:**

```javascript
const actions = browser.actions()
```

## Getters

### `get get`

Provides access to various browser information.

#### `get.name()`

Get browser name.

**Returns:** `Promise<string>` - Browser name

#### `get.os()`

Get operating system.

**Returns:** `Promise<string>` - Operating system name

#### `get.size()`

Get browser size.

**Returns:** `Promise<Object>` - Browser size with width and height properties

**Example:**

```javascript
const size = await browser.get.size()
console.log(size.width, size.height)
```
