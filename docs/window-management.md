# Window Management

This document explains how to manage browser windows using the WebBrowser library.

## Window Instance

The `window()` method returns a Window instance that provides methods for managing browser windows.

```javascript
const browser = new WebBrowser()
await browser.start()

// Get window instance
await browser.goto('https://google.com')
const window = await browser.window('Google')
```

## Methods

### switch()

Switch to a specific window by title or index.

```javascript
// Switch to window by title
await browser.window('Google').switch()

// Switch to window by index
await browser.window(0).switch()
```

### new()

Open a new browser window.

```javascript
await browser.window().new()
```

### close()

Close the current window.

```javascript
await browser.window().close()
```

### maximize()

Maximize the browser window.

```javascript
await browser.window().maximize()
```

### minimize()

Minimize the browser window.

```javascript
await browser.window().minimize()
```

### fullscreen()

Switch to fullscreen mode.

```javascript
await browser.window().fullscreen()
```

### isDisplayed()

Check if a window is displayed.

```javascript
const isDisplayed = await browser.window('Google').isDisplayed()
```

## Usage Examples

### Opening a new window

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()

// Open a new window
await browser.window().new()
```

### Switching between windows

```javascript
// Switch to a specific window by title
await browser.window('Google').switch()

// Switch to a specific window by index
await browser.window(0).switch()
```

### Managing window size

```javascript
// Maximize window
await browser.window().maximize()

// Minimize window
await browser.window().minimize()

// Fullscreen
await browser.window().fullscreen()
```

## Window Management API Reference

### window().get.url()

Gets the current URL.

```javascript
const url = await browser.window().get.url()
```

### window().get.title()

Gets the page title.

```javascript
const title = await browser.window().get.title()
```

### window().maximize()

Maximizes the browser window.

```javascript
await browser.window().maximize()
```

### window().minimize()

Minimizes the browser window.

```javascript
await browser.window('some window title').minimize()
```

### window().fullscreen()

Switches the browser to fullscreen mode.

```javascript
await browser.window(index).fullscreen()
await browser.window('some window title').fullscreen()
await browser.window().fullscreen()
```

### window().new()

Opens a new browser window.

```javascript
await browser.window().new()
```

### window().close()

Closes the current window.

```javascript
await browser.window(index).close()
await browser.window('title').close()
await browser.window().close()
```

### window().isDisplayed()

Checks if a window with a specific title is displayed and visible.

```javascript
// Check current window
const isDisplayed = await browser.window('some title').isDisplayed()

// Check with custom timeout
const isDisplayed = await browser.window('some title').isDisplayed(5000)
```

### window().switch()

Switches to a window with a specific title.

```javascript
// Switch to window with title
await browser.window('some title').switch()

// Switch with custom timeout
await browser.window('some title').switch(5000)
```
