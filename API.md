# @nodebug/selenium API Documentation

This document provides comprehensive API documentation for the @nodebug/selenium library.

## Table of Contents

- [WebBrowser Class](#web-browser-class)
  - [Constructor](#constructor)
  - [Browser Session Management](#browser-session-management)
  - [Navigation](#navigation)
  - [Window Management](#window-management)
  - [Tab Management](#tab-management)
  - [Alert Handling](#alert-handling)
  - [Element Interaction](#element-interaction)
  - [Element Selection](#element-selection)
  - [Element Positioning](#element-positioning)
  - [Element Logic](#element-logic)
  - [Drag and Drop](#drag-and-drop)
  - [Utilities](#utilities)

## WebBrowser Class

The main class for browser automation using Selenium WebDriver.

### Constructor

```javascript
const browser = new WebBrowser()
```

Creates a new WebBrowser instance.

### Browser Session Management

#### start()

Starts a new browser session.

```javascript
await browser.start()
```

#### close()

Closes the browser session.

```javascript
await browser.close()
```

#### reset()

Resets browser state (closes all windows, deletes cookies, clears storage).

```javascript
await browser.reset()
```

### Navigation

#### goto(url)

Navigates to a URL.

```javascript
await browser.goto('https://www.google.com')
```

#### refresh()

Refreshes the current page.

```javascript
await browser.refresh()
```

#### goBack()

Goes back in browser history.

```javascript
await browser.goBack()
```

#### goForward()

Goes forward in browser history.

```javascript
await browser.goForward()
```

### Window Management

#### window([title])

Gets window management instance.

```javascript
await browser.window().maximize()
await browser.window('Google').switch()
```

#### setSize(size)

Sets browser window size.

```javascript
await browser.setSize({ width: 1280, height: 800 })
```

### Tab Management

#### tab([title])

Gets tab management instance.

```javascript
await browser.tab().new()
await browser.tab('GitHub').switch()
```

### Alert Handling

#### alert([text])

Gets alert management instance.

```javascript
await browser.alert().accept()
await browser.alert('Expected Text').isVisible()
```

### Element Interaction

#### click([x], [y])

Clicks on an element.

```javascript
await browser.button('submit').click()
await browser.element('menu').click(10, 20) // Click at coordinates
```

#### doubleClick()

Double-clicks on an element.

```javascript
await browser.element('text').doubleClick()
```

#### rightClick()

Right-clicks on an element.

```javascript
await browser.element('context-menu').rightClick()
```

#### write(value)

Enters text into an input field.

```javascript
await browser.textbox('username').write('myusername')
```

#### clear()

Clears text from an input field.

```javascript
await browser.textbox('username').clear()
```

#### overwrite(value)

Overwrites text in an input field.

```javascript
await browser.textbox('username').overwrite('newvalue')
```

#### check()

Checks a checkbox.

```javascript
await browser.checkbox('agree').check()
```

#### uncheck()

Unchecks a checkbox.

```javascript
await browser.checkbox('agree').uncheck()
```

#### hover()

Hovers over an element.

```javascript
await browser.element('menu').hover()
```

#### scroll([alignToTop])

Scrolls an element into view.

```javascript
await browser.element('submit').scroll()
await browser.element('footer').scroll(false) // Align to bottom
```

#### focus()

Sets focus on an element.

```javascript
await browser.textbox('username').focus()
```

#### text()

Gets text content of an element.

```javascript
const text = await browser.element('welcome').text()
```

#### attribute(name)

Gets attribute value of an element.

```javascript
const href = await browser.link('home').attribute('href')
```

#### screenshot()

Captures screenshot of element or page.

```javascript
const screenshot = await browser.element('form').screenshot()
const fullPage = await browser.screenshot()
```

#### isVisible([timeout])

Checks if element is visible (non-throwing).

```javascript
const visible = await browser.element('submit').isVisible()
```

#### isDisplayed([timeout])

Waits for element to be visible (throwing).

```javascript
await browser.element('loading-indicator').isDisplayed()
```

#### isNotDisplayed([timeout])

Waits for element to be invisible.

```javascript
await browser.element('loading-spinner').isNotDisplayed()
```

#### isDisabled()

Checks if element is disabled.

```javascript
const disabled = await browser.button('submit').isDisabled()
```

#### upload(filePath)

Uploads file to file input.

```javascript
await browser.file('upload').upload('/path/to/file.txt')
```

#### hide()

Hides matching elements.

```javascript
await browser.element('ad').hide()
```

#### unhide()

Restores visibility to hidden elements.

```javascript
await browser.element('ad').unhide()
```

### Element Selection

#### element(data)

Creates element selector.

```javascript
browser.element('submit').click()
browser.element('username').write('test')
```

#### button(data)

Creates button selector.

```javascript
browser.button('submit').click()
```

#### textbox(data)

Creates textbox selector.

```javascript
browser.textbox('username').write('test')
```

#### checkbox(data)

Creates checkbox selector.

```javascript
browser.checkbox('agree').check()
```

#### radio(data)

Creates radio button selector.

```javascript
browser.radio('option1').check()
```

#### link(data)

Creates link selector.

```javascript
browser.link('home').click()
```

#### image(data)

Creates image selector.

```javascript
browser.image('logo').click()
```

#### file(data)

Creates file input selector.

```javascript
browser.file('upload').upload('/path/to/file.txt')
```

#### dialog(data)

Creates dialog selector.

```javascript
browser.dialog('modal').isDisplayed()
```

#### toolbar(data)

Creates toolbar selector.

```javascript
browser.toolbar('nav').isDisplayed()
```

#### tab(data)

Creates tab selector.

```javascript
browser.tab('settings').click()
```

### Element Positioning

#### above()

Targets element above current element.

```javascript
browser.element('target').above().click()
```

#### below()

Targets element below current element.

```javascript
browser.element('target').below().click()
```

#### toLeftOf()

Targets element to the left of current element.

```javascript
browser.element('target').toLeftOf().click()
```

#### toRightOf()

Targets element to the right of current element.

```javascript
browser.element('target').toRightOf().click()
```

#### within()

Targets element within current element.

```javascript
browser.element('menu').within().element('item').click()
```

#### near()

Targets element near current element.

```javascript
browser.element('target').near().element('item').click()
```

### Element Logic

#### exact()

Forces exact text matching.

```javascript
browser.exact().element('exact text').click()
```

#### exactly()

Forces strict text match.

```javascript
browser.element('text').exactly().toLeftOf().element('item').click()
```

#### hidden()

Allows searching for hidden elements.

```javascript
browser.hidden().element('hidden-item').click()
```

#### or()

Combines search criteria with OR logic.

```javascript
browser.element('text1').or().element('text2').click()
```

#### atIndex(index)

Selects specific occurrence of element.

```javascript
browser.element('item').atIndex(2).click()
```

### Drag and Drop

#### drag()

Initiates drag operation.

```javascript
browser.exact().element('drag-item').drag().onto().element('drop-target').drop()
```

#### onto()

Specifies drop target.

```javascript
browser.element('drag-item').drag().onto().element('drop-target').drop()
```

#### drop()

Completes drag-and-drop operation.

```javascript
browser.element('drag-item').drag().onto().element('drop-target').drop()
```

### Utilities

#### sleep(ms)

Pauses execution.

```javascript
await browser.sleep(1000) // Sleep for 1 second
```

#### consoleErrors()

Gets console errors from browser.

```javascript
const errors = await browser.consoleErrors()
```

#### actions()

Gets WebDriver actions instance.

```javascript
const actions = browser.actions()
```

#### get

Gets browser information.

```javascript
const name = await browser.get.name()
const os = await browser.get.os()
const size = await browser.get.size()
```

## Configuration

The library uses `@nodebug/config` for configuration. Create a configuration file with:

```javascript
module.exports = {
  selenium: {
    hub: 'http://localhost:4444', // Selenium Grid hub URL (optional)
    timeout: 30, // Default timeout in seconds
    width: 1280, // Default browser width
    height: 800, // Default browser height
    headless: false, // Run in headless mode
    incognito: false, // Run in incognito mode
  },
}
```

## Examples

See the [examples](examples/) directory for complete working examples.

## Browser Capabilities

The library supports Chrome, Firefox, and Safari browsers with configurable capabilities.

### Chrome

```javascript
const chromeCaps = new Chrome().capabilities
```

### Firefox

```javascript
const firefoxCaps = new Firefox().capabilities
```

### Safari

```javascript
const safariCaps = new Safari().capabilities
```

## Error Handling

All methods throw errors on failure. Use try-catch blocks to handle errors:

```javascript
try {
  await browser.goto('https://www.google.com')
  await browser.element('submit').click()
} catch (error) {
  console.error('Error:', error.message)
}
```

## Best Practices

1. Always call `browser.close()` when done
2. Use explicit waits (`isDisplayed()`) instead of `sleep()`
3. Use descriptive element selectors
4. Handle errors appropriately
5. Clean up browser state with `reset()` when needed
6. Use configuration file for reusable settings
