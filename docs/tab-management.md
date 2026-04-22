# Tab Management

This document explains how to manage browser tabs using the WebBrowser library.

## Tab Instance

The `tab()` method returns a Tab instance that provides methods for managing browser tabs.

```javascript
const browser = new WebBrowser()
await browser.start()

// Get tab instance
const tab = browser.tab('Google')
```

## Methods

### switch()

Switch to a specific tab by title or index.

```javascript
// Switch to tab by title
await browser.tab('Google').switch()

// Switch to tab by index
await browser.tab(0).switch()
```

### new()

Open a new browser tab.

```javascript
await browser.tab().new()
```

### close()

Close the current tab.

```javascript
await browser.tab().close()
```

### isDisplayed()

Check if a tab is displayed.

```javascript
const isDisplayed = await browser.tab('Google').isDisplayed()
```

## Usage Examples

### Opening a new tab

```javascript
import WebBrowser from '@nodebug/selenium'

const browser = new WebBrowser()
await browser.start()

// Open a new tab
await browser.tab().new()
```

### Switching between tabs

```javascript
// Switch to a specific tab by title
await browser.tab('Google').switch()

// Switch to a specific tab by index
await browser.tab(0).switch()
```

### Working with multiple tabs

```javascript
// Open a new tab
await browser.tab().new()

// Switch to the new tab
await browser.tab(1).switch()

// Perform actions in the new tab
await browser.goTo('https://example.com')

// Switch back to the original tab
await browser.tab(0).switch()
```

## Tab Management API Reference

### tab.new()

Opens a new browser tab.

```javascript
await browser.tab().new()
```

### tab.close()

Closes the current tab.

```javascript
await browser.tab('some tab title').close()
await browser.tab(3).close()
```

### tab.isDisplayed()

Checks if a tab with a specific index is displayed and visible.

```javascript
// Check if tab at index 0 is displayed
const isDisplayed = await browser.tab(0).isDisplayed()

// Check with custom timeout
const isDisplayed = await browser.tab(0).isDisplayed(5000)
```

### tab.switch()

Switches to a tab with a specific index.

```javascript
// Switch to tab at index 0
await browser.tab(0).switch()

// Switch with custom timeout
await browser.tab(0).switch(5000)
```

### tab.get.url()

Gets the current tab or another tab URL.

```javascript
const url = await browser.tab().get.url()
const url2 = await browser.tab('some other tab').get.url()
```

### tab.get.title()

Gets the current tab or by index title.

```javascript
const title = await browser.tab().get.title()
const title2 = await browser.tab(5).get.title()
```
