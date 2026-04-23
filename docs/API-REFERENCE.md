# API Reference

Complete method reference for WebBrowser. See [Core Concepts](CONCEPTS.md) for underlying patterns.

## Quick Navigation
- [Browser Control](#browser-control) - Session management
- [Element Selection](#element-selection) - Finding elements  
- [Element Interaction](#element-interaction) - Clicking, typing, etc.
- [Element State](#element-state) - Visibility, disabled, etc.
- [Window Management](#window-management) - Multi-window operations
- [Tab Management](#tab-management) - Multi-tab operations
- [Alert Handling](#alert-handling) - JavaScript alerts/prompts
- [Data Retrieval](#data-retrieval) - Getting element properties

---

## Browser Control

### start()
Initialize a new browser session.

```javascript
await browser.start()
```

**Returns**: `Promise<void>`

### close()
Close the browser session and cleanup resources.

```javascript
await browser.close()
```

**Returns**: `Promise<boolean>` - Success status

### goto(url)
Navigate to a URL.

```javascript
await browser.goto('https://example.com')
```

**Parameters**: 
- `url` (string): URL to navigate to

**Returns**: `Promise<boolean>`

### refresh()
Refresh the current page.

```javascript
await browser.refresh()
```

**Returns**: `Promise<void>`

### goBack()
Navigate back in browser history.

```javascript
await browser.goBack()
```

**Returns**: `Promise<boolean>`

### goForward()
Navigate forward in browser history.

```javascript
await browser.goForward()
```

**Returns**: `Promise<boolean>`

### reset()
Reset browser state (close all windows, delete cookies, clear storage).

```javascript
await browser.reset()
```

**Returns**: `Promise<void>`

### setSize(size)
Set browser window dimensions.

```javascript
await browser.setSize({ width: 1280, height: 800 })
```

**Parameters**:
- `size` (Object): `{ width: number, height: number }`

**Returns**: `Promise<boolean>`

### sleep(ms)
Sleep for specified milliseconds.

```javascript
await browser.sleep(1000)
```

**Parameters**: 
- `ms` (number): Milliseconds to sleep

**Returns**: `Promise<void>`

### actions()
Get WebDriver actions instance for advanced interactions.

```javascript
const actions = browser.actions()
```

**Returns**: `Object` - WebDriver actions

---

## Element Selection

### element(selector)
Generic element selector. Intermediate operation.

```javascript
await browser.element('text').click()
```

**Parameters**: 
- `selector` (string): Element identifier (text, attribute, etc.)

**Returns**: `WebBrowser` - For chaining

### Type-Specific Selectors
All return `WebBrowser` for chaining:

- `button(selector)` - Button element
- `textbox(selector)` - Text input (aliases: `input()`, `field()`, `edit()`, `email()`, `search()`)
- `checkbox(selector)` - Checkbox (aliases: `toggle()`, `switch()`)
- `radio(selector)` - Radio button (alias: `radiobutton()`)
- `dropdown(selector)` - Dropdown (alias: `select()`)
- `link(selector)` - Link element
- `image(selector)` - Image (alias: `img()`)
- `file(selector)` - File input (alias: `inputfile()`)
- `label(selector)` - Label element
- `toolbar(selector)` - Toolbar
- `tab(selector)` - Tab element
- `dialog(selector)` - Dialog
- `navigation(selector)` - Navigation
- `heading(selector)` - Heading
- `slider(selector)` - Slider
- `combobox(selector)` - Combobox
- `list(selector)` - List
- `listitem(selector)` - List item
- `menu(selector)` - Menu
- `menuitem(selector)` - Menu item
- `row(selector)` - Table row
- `column(selector)` - Table column
- `alert(selector)` - Alert (optional text)

```javascript
await browser.button('Submit').click()
await browser.textbox('Email').write('user@example.com')
await browser.checkbox('Remember Me').check()
```

### find()
Find first matching element.

```javascript
const element = await browser.element('text').find()
```

**Returns**: `Promise<Element>`

### findAll()
Find all matching elements.

```javascript
const elements = await browser.element('text').findAll()
```

**Returns**: `Promise<Array<Element>>`

---

## Element Interaction

### click([x, y])
Click an element.

```javascript
await browser.button('Submit').click()
await browser.element('menu').click(10, 20)  // Click at coordinates
```

**Parameters**: 
- `x` (number, optional): X coordinate
- `y` (number, optional): Y coordinate

**Returns**: `Promise<boolean>`

### doubleClick()
Double-click an element.

```javascript
await browser.element('text').doubleClick()
```

**Returns**: `Promise<boolean>`

### rightClick()
Right-click (context click) an element.

```javascript
await browser.element('menu').rightClick()
```

**Returns**: `Promise<boolean>`

### middleClick()
Middle-click an element.

```javascript
await browser.element('target').middleClick()
```

**Returns**: `Promise<boolean>`

### tripleClick()
Triple-click an element.

```javascript
await browser.element('text').tripleClick()
```

**Returns**: `Promise<boolean>`

### longPress([duration])
Long press (hold) an element.

```javascript
await browser.element('button').longPress()      // Default 1000ms
await browser.element('button').longPress(2000)  // 2 seconds
```

**Parameters**:
- `duration` (number, optional): Milliseconds (default: 1000)

**Returns**: `Promise<boolean>`

### multipleClick(times)
Click an element multiple times.

```javascript
await browser.element('button').multipleClick(3)  // Click 3 times
```

**Parameters**:
- `times` (number, optional): Number of clicks (default: 2)

**Returns**: `Promise<boolean>`

### clickWithModifier(options)
Click with modifier keys.

```javascript
await browser.link('Delete').clickWithModifier({ ctrl: true })
await browser.element('item').clickWithModifier({ shift: true, alt: true })
```

**Parameters**:
- `options` (Object, optional):
  - `shift` (boolean)
  - `ctrl` (boolean)
  - `alt` (boolean)
  - `meta` (boolean)

**Returns**: `Promise<boolean>`

### hover()
Hover over an element.

```javascript
await browser.element('menu').hover()
```

**Returns**: `Promise<boolean>`

### write(text)
Write text to an input field or content-editable element.

```javascript
await browser.textbox('Search').write('query')
await browser.element('input').write('text')
```

**Parameters**:
- `text` (string): Text to enter

**Returns**: `Promise<boolean>`

### clear()
Clear text from an input field.

```javascript
await browser.textbox('Email').clear()
```

**Returns**: `Promise<boolean>`

### overwrite(text)
Clear and write new text.

```javascript
await browser.textbox('Email').overwrite('new@example.com')
```

**Parameters**:
- `text` (string): Text to write

**Returns**: `Promise<boolean>`

### focus()
Set focus on an element.

```javascript
await browser.textbox('Email').focus()
```

**Returns**: `Promise<boolean>`

### upload(filePath)
Upload a file.

```javascript
await browser.file('Resume').upload('/path/to/resume.pdf')
```

**Parameters**:
- `filePath` (string): Path to file

**Returns**: `Promise<boolean>`

### check()
Check a checkbox or radio button.

```javascript
await browser.checkbox('Subscribe').check()
await browser.radio('Male').check()
```

**Returns**: `Promise<boolean>`

### uncheck()
Uncheck a checkbox.

```javascript
await browser.checkbox('Newsletter').uncheck()
```

**Returns**: `Promise<boolean>`

### drag()
Start a drag operation. Use `onto()` and `drop()` to complete.

```javascript
await browser.element('Item').drag().onto().element('Target').drop()
```

**Returns**: `Promise<boolean>`

### onto()
Specify drop target for drag operation.

```javascript
await browser.element('Item').drag().onto().element('Trash').drop()
```

**Returns**: `WebBrowser` - For chaining

### drop()
Complete drag and drop operation.

```javascript
await browser.element('Item').drag().onto().element('Trash').drop()
```

**Returns**: `Promise<boolean>`

---

## Element State

### isVisible()
**Returns `true`/`false` for conditional logic** - Does not throw errors.

Check if element is visible in the DOM.

```javascript
const visible = await browser.element('Submit').isVisible()
if (visible) {
  await browser.element('Submit').click()
}
```

**Returns**: `Promise<boolean>` - `true` if visible, `false` otherwise

### isDisplayed([timeout])
**Assertion that throws an error and stops test execution on failure.**

Wait for element to become visible within the timeout. Use this for test validations and verifications.

```javascript
await browser.element('Loading').isDisplayed()
await browser.button('Submit').isDisplayed(10000)  // 10s timeout
```

**Parameters**:
- `timeout` (number, optional): Milliseconds to wait for visibility

**Returns**: `Promise<boolean>`

**Throws**: Error if not visible within timeout - **Test execution stops**

### isNotDisplayed([timeout])
**Assertion that throws an error and stops test execution on failure.**

Wait for element to disappear within the timeout. Use this for test validations and verifications.

```javascript
await browser.element('Modal').isNotDisplayed()
await browser.element('Spinner').isNotDisplayed(5000)
```

**Parameters**:
- `timeout` (number, optional): Milliseconds to wait for element to disappear

**Returns**: `Promise<boolean>`

**Throws**: Error if still visible within timeout - **Test execution stops**

### isDisabled([timeout])
Check if element is disabled.

```javascript
const disabled = await browser.button('Submit').isDisabled()
if (!disabled) {
  await browser.button('Submit').click()
}
```

**Parameters**:
- `timeout` (number, optional): Milliseconds to wait

**Returns**: `Promise<boolean>`

### isChecked()
Check if checkbox is checked.

```javascript
const checked = await browser.checkbox('Subscribe').isChecked()
```

**Returns**: `Promise<boolean>`

### isUnchecked()
Check if checkbox is unchecked.

```javascript
const unchecked = await browser.checkbox('Subscribe').isUnchecked()
```

**Returns**: `Promise<boolean>`

### scroll([alignToTop])
Scroll element into view.

```javascript
await browser.element('Submit').scroll()          // Align to top
await browser.element('Footer').scroll(false)     // Align to bottom
```

**Parameters**:
- `alignToTop` (boolean, optional): Default true

**Returns**: `Promise<boolean>`

### hide()
Hide an element by setting opacity to 0.

```javascript
await browser.element('Ad').hide()
```

**Returns**: `Promise<boolean>`

### unhide()
Unhide an element.

```javascript
await browser.element('Ad').unhide()
```

**Returns**: `Promise<boolean>`

---

## Window Management

See [Window Operations Guide](docs/window-management.md) for patterns.

### window([selector])
Get window instance.

```javascript
browser.window()              // Current window
browser.window('Google')      // By title
browser.window(0)             // By index
```

**Parameters**:
- `selector` (string|number, optional): Window title or index

**Returns**: `WindowInstance`

### window().new()
Open a new browser window.

```javascript
await browser.window().new()
```

### window().close()
Close a window.

```javascript
await browser.window().close()
await browser.window('Google').close()
```

### window().switch()
Switch to a window.

```javascript
await browser.window('Google').switch()
await browser.window(0).switch()
```

**Parameters** (optional):
- `timeout` (number): Custom timeout

### window().maximize()
Maximize window.

```javascript
await browser.window().maximize()
```

### window().minimize()
Minimize window.

```javascript
await browser.window('Google').minimize()
```

### window().fullscreen()
Switch to fullscreen.

```javascript
await browser.window().fullscreen()
```

### window().isDisplayed([timeout])
Check if window is displayed.

```javascript
const displayed = await browser.window('Google').isDisplayed()
await browser.window('Title').isDisplayed(5000)  // 5s timeout
```

### window().get.url()
Get window URL.

```javascript
const url = await browser.window().get.url()
```

### window().get.title()
Get window title.

```javascript
const title = await browser.window().get.title()
```

### window().get.consoleErrors()
Get console errors from window.

```javascript
const errors = await browser.window().get.consoleErrors()
```

---

## Tab Management

See [Tab Operations Guide](docs/tab-management.md) for patterns.

### tab([selector])
Get tab instance.

```javascript
browser.tab()            // Current tab
browser.tab('Google')    // By title
browser.tab(0)           // By index
```

**Parameters**:
- `selector` (string|number, optional): Tab title or index

**Returns**: `TabInstance`

### tab().new()
Open a new tab.

```javascript
await browser.tab().new()
```

### tab().close()
Close a tab.

```javascript
await browser.tab().close()
await browser.tab(0).close()
```

### tab().switch()
Switch to a tab.

```javascript
await browser.tab(0).switch()
await browser.tab('Google').switch()
```

**Parameters** (optional):
- `timeout` (number): Custom timeout

### tab().isDisplayed([timeout])
Check if tab is displayed.

```javascript
const displayed = await browser.tab(0).isDisplayed()
```

### tab().get.url()
Get tab URL.

```javascript
const url = await browser.tab().get.url()
const url2 = await browser.tab(1).get.url()
```

### tab().get.title()
Get tab title.

```javascript
const title = await browser.tab().get.title()
```

---

## Alert Handling

See [Alerts Guide](docs/alerts.md) for detailed patterns.

### alert([text])
Get alert instance.

```javascript
browser.alert()                    // Any alert
browser.alert('Confirmation')      // With specific text
```

**Parameters**:
- `text` (string, optional): Expected alert text

**Returns**: `AlertInstance`

### alert().isVisible()
Check if alert is present.

```javascript
const present = await browser.alert().isVisible()
if (present) {
  await browser.alert().accept()
}
```

**Returns**: `Promise<boolean>`

### alert().accept()
Accept alert.

```javascript
await browser.alert().accept()
await browser.alert('Confirm').accept()
```

### alert().dismiss()
Dismiss alert.

```javascript
await browser.alert().dismiss()
```

### alert().write(text)
Send text to prompt.

```javascript
await browser.alert().write('user input')
```

**Parameters**:
- `text` (string): Text to send

**Returns**: `Promise<void>`

### alert().get.text()
Get alert text.

```javascript
const text = await browser.alert().get.text()
```

---

## Data Retrieval

### get.text()
Get element text content.

```javascript
const text = await browser.element('div').get.text()
```

**Returns**: `Promise<string>`

### get.attribute(attributeName)
Get element attribute value.

```javascript
const id = await browser.element('input').get.attribute('id')
const classes = await browser.button('Submit').get.attribute('class')
```

**Parameters**:
- `attributeName` (string): Attribute name

**Returns**: `Promise<string>`

### get.screenshot()
Capture element screenshot.

```javascript
const screenshot = await browser.element('chart').get.screenshot()
```

**Returns**: `Promise<Buffer>`

### get.size()
Get browser viewport size.

```javascript
const size = await browser.get.size()
console.log(size.width, size.height)
```

**Returns**: `Promise<{width: number, height: number}>`

### get.name()
Get browser name.

```javascript
const name = await browser.get.name()  // 'chrome', 'firefox', etc.
```

**Returns**: `Promise<string>`

### get.os()
Get operating system.

```javascript
const os = await browser.get.os()
```

**Returns**: `Promise<string>`

---

## Positioning & Filtering

These are intermediate operations for refining element selection:

### atIndex(index)
Select specific element occurrence (0-based).

```javascript
await browser.element('Item').atIndex(0).click()
await browser.textbox('Email').atIndex(2).write('...')
```

### exact()
Exact text matching instead of partial.

```javascript
await browser.exact().element('male').click()  // Won't match 'Female'
```

### hidden()
Select hidden elements.

```javascript
await browser.element('tooltip').hidden().click()
```

### above() / below()
Spatial positioning relative to anchor.

```javascript
await browser.button('Delete').above().element('Section').click()
```

### toLeftOf() / toRightOf()
Horizontal spatial positioning.

```javascript
await browser.element('target').toLeftOf().element('anchor').click()
```

### within()
Element containment.

```javascript
await browser.button('Submit').within().dialog('Form').click()
```

### near()
Proximity-based selection.

```javascript
await browser.element('Item').near().element('Anchor').click()
```

### or()
Multiple possible names.

```javascript
await browser.button('Save').or().button('Apply').click()
```

### exactly()
Precise positioning (vs approximate).

```javascript
await browser.textbox('Name').exactly().below().element('Label').write('...')
```

---

## Properties

### timeout
Get default timeout in milliseconds.

```javascript
const timeout = browser.timeout
```

### capabilities
Browser capabilities object.

```javascript
browser.capabilities = { browserName: 'chrome' }
```

### driver
Selenium WebDriver instance.

```javascript
const driver = browser.driver
```
