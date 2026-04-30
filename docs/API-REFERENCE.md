# API Reference

Complete method reference for WebBrowser. See [Core Concepts](CONCEPTS.md) for underlying patterns.

## Quick Navigation

- [Browser Control](#browser-control) - Session management
- [Element Selection](#element-selection) - Finding elements
- [Element Interaction](#element-interaction) - Clicking, typing, etc.
- [Dropdown Operations](#dropdown-operations) - Select/dropdown handling
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

- `link(selector)` - Link element
- `navigation(selector)` - Navigation
- `heading(selector)` - Heading
- `button(selector)` - Button element
- `checkbox(selector)` - Checkbox
- `switch(selector)` - Switch
- `radio(selector)` - Radio button
- `slider(selector)` - Slider
- `dropdown(selector)` - Dropdown
- `textbox(selector)` - Text input
- `file(selector)` - File input
- `list(selector)` - List
- `listitem(selector)` - List item
- `menu(selector)` - Menu
- `menuitem(selector)` - Menu item
- `toolbar(selector)` - Toolbar
- `dialog(selector)` - Dialog
- `row(selector)` - Table row
- `column(selector)` - Table column
- `image(selector)` - Image
- `element(selector)` - Generic element

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

Click an element. Supports modifier keys via chaining (`ctrl`, `shift`, `alt`, `meta`).

```javascript
await browser.button('Submit').click()
await browser.element('menu').click(10, 20) // Click at coordinates
await browser.button('link').ctrl.click() // Ctrl+click
await browser.element('item').shift.alt.click() // Shift+Alt+click
```

**Parameters**:

- `x` (number, optional): X coordinate
- `y` (number, optional): Y coordinate

**Returns**: `Promise<boolean>`

**Modifiers**: Chain `ctrl`, `shift`, `alt`, or `meta` before the element selector to hold modifier keys during the click. Modifiers are automatically released after the click.

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
await browser.element('button').longPress() // Default 1000ms
await browser.element('button').longPress(2000) // 2 seconds
```

**Parameters**:

- `duration` (number, optional): Milliseconds (default: 1000)

**Returns**: `Promise<boolean>`

### multipleClick(times)

Click an element multiple times.

```javascript
await browser.element('button').multipleClick(3) // Click 3 times
```

**Parameters**:

- `times` (number, optional): Number of clicks (default: 2)

**Returns**: `Promise<boolean>`

### hover()

Hover over an element.

```javascript
await browser.element('menu').hover()
```

**Returns**: `Promise<boolean>`

### write(text)

Write text to an input field or content-editable element. If the field, textarea or content-editable element was not empty, does not clear but adds text to it.

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

### press(key)

Press a keyboard key on the currently focused element.

```javascript
await browser.press('Enter')
await browser.press('Tab')
await browser.press('Escape')
await browser.ctrl.press('c') // Ctrl+C
await browser.ctrl.shift.press('c') // Ctrl+Shift+C
await browser.alt.press('Tab') // Alt+Tab
await browser.meta.press('w') // Cmd+W on Mac
```

**Parameters**:

- `key` (string): Key to press (e.g., `'Enter'`, `'Tab'`, `'Escape'`, `'a'`, `'left'`, `'right'`, `'up'`, `'down'`)

**Returns**: `Promise<boolean>`

### type(text)

Type a string character-by-character on the currently focused element. Each character is sent individually via Selenium's Actions API, with optional modifier keys held during the entire sequence. This is a terminal operation — the stack is cleared after execution.

```javascript
await browser.element('username').type('myusername')
await browser.ctrl.type('a') // Types 'a' while holding Ctrl
await browser.shift.type('abc') // Types 'abc' while holding Shift
await browser.ctrl.shift.type('abc') // Types 'abc' while holding Ctrl+Shift
await browser.alt.type('abc') // Types 'abc' while holding Alt
await browser.meta.type('abc') // Types 'abc' while holding Cmd (Mac) / Win (Windows)
```

**Parameters**:

- `text` (string): The string to type character by character

**Returns**: `Promise<boolean>`

**Modifiers**: Chain `ctrl`, `shift`, `alt`, or `meta` before the element selector to hold modifier keys during typing. Modifiers are automatically released after the operation.

### left([count])

Press the Left Arrow key a specified number of times.

```javascript
await browser.left() // Press left arrow once
await browser.left(5) // Press left arrow 5 times
```

**Parameters**:

- `count` (number, optional): Number of times to press (default: 1)

**Returns**: `Promise<boolean>`

### right([count])

Press the Right Arrow key a specified number of times.

```javascript
await browser.right() // Press right arrow once
await browser.right(3) // Press right arrow 3 times
```

**Parameters**:

- `count` (number, optional): Number of times to press (default: 1)

**Returns**: `Promise<boolean>`

### up([count])

Press the Up Arrow key a specified number of times.

```javascript
await browser.up() // Press up arrow once
await browser.up(2) // Press up arrow 2 times
```

**Parameters**:

- `count` (number, optional): Number of times to press (default: 1)

**Returns**: `Promise<boolean>`

### down([count])

Press the Down Arrow key a specified number of times.

```javascript
await browser.down() // Press down arrow once
await browser.down(4) // Press down arrow 4 times
```

**Parameters**:

- `count` (number, optional): Number of times to press (default: 1)

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

Check a checkbox.

```javascript
await browser.checkbox('Subscribe').check()
```

**Returns**: `Promise<boolean>`

### set()

Set a radio button.

```javascript
await browser.radio('Male').set()
```

**Returns**: `Promise<boolean>`

### uncheck()

Uncheck a checkbox.

```javascript
await browser.checkbox('Newsletter').uncheck()
```

**Returns**: `Promise<boolean>`

### on()

Turn a switch element on.

```javascript
await browser.switch('Dark Mode').on()
```

**Returns**: `Promise<boolean>`

### off()

Turn a switch element off.

```javascript
await browser.switch('Dark Mode').off()
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

## Dropdown Operations

Handle `<select>` elements and custom combobox widgets. Use `dropdown()` to select the dropdown element, then chain one of the methods below.

### option(value)

Specify an option to select. Accepts text, value, or a numeric index (0-based).

```javascript
// By text (partial match, case-insensitive)
await browser.dropdown('Country').option('United States').select()

// By value
await browser.dropdown('Country').option('US').select()

// By index (0-based)
await browser.dropdown('Country').option(0).select() // First option
await browser.dropdown('Country').option(2).select() // Third option
```

**Parameters**:

- `value` (string|number): Option text, value, or index

**Returns**: `WebBrowser` - For chaining

### select()

Select the previously specified option. Supports both native `<select>` elements and custom combobox widgets.

```javascript
await browser.dropdown('Country').option('United States').select()
await browser.dropdown('Country').option(0).select()
```

**Returns**: `Promise<boolean>`

**Throws**: Error if dropdown not found, option not found, or index out of range.

### get.text()

Get the text of the currently selected option.

```javascript
const text = await browser.dropdown('Country').get.text()
console.log(text) // e.g., 'United States'
```

**Returns**: `Promise<string>` - The text of the selected option

**Throws**: Error if dropdown not found or no option is selected.

### get.value()

Get the value of the currently selected option.

```javascript
const value = await browser.dropdown('Country').get.v()
console.log(value) // e.g., 'us'
```

**Returns**: `Promise<string>` - The value of the selected option

**Throws**: Error if dropdown not found or no option is selected.

### isSelected()

**Assertion that throws an error and stops test execution on failure.**

Assert that a specific option is currently selected. Accepts text, value, or index.

```javascript
// Assert by text
await browser.dropdown('Country').option('United States').isSelected()

// Assert by value
await browser.dropdown('Country').option('US').isSelected()

// Assert by index
await browser.dropdown('Country').option(0).isSelected()
```

**Throws**: Error if the specified option is not selected.

---

## Element State

### is.visible([timeout])

**Returns `true`/`false` for conditional logic** - Does not throw errors.

Check if element is visible in the DOM. Use this **only in if conditions** for branching logic. This method returns a boolean value and is intended for runtime decision-making, not for QA test assertions.

```javascript
const visible = await browser.element('Submit').is.visible()
if (visible) {
  await browser.element('Submit').click()
}
```

**Returns**: `Promise<boolean>` - `true` if visible, `false` otherwise

**QA Best Practice**: For test validations that validate whether elements are displayed, use `should.be.visible()` or `should.not.be.visible()` instead.

### should.be.visible([timeout])

**Assertion that throws an error and stops test execution on failure.**

Wait for element to become visible within the timeout and validate that it is displayed. Use this for QA test validations and verifications to ensure elements are properly visible on the screen.

```javascript
await browser.element('Loading').should.be.visible()
await browser.button('Submit').should.be.visible(10000) // 10s timeout
```

**Parameters**:

- `timeout` (number, optional): Milliseconds to wait for visibility

**Throws**: Error if not visible within timeout - **Test execution stops**

**QA Best Practice**: Use this method to assert and validate that an element is displayed on the screen in your test cases.

### should.not.be.visible([timeout])

**Assertion that throws an error and stops test execution on failure.**

Wait for element to disappear within the timeout and validate that it is no longer displayed. Use this for QA test validations and verifications to ensure elements are properly hidden from the screen.

```javascript
await browser.element('Modal').should.not.be.visible()
await browser.element('Spinner').should.not.be.visible(5000)
```

**Parameters**:

- `timeout` (number, optional): Milliseconds to wait for element to disappear

**Throws**: Error if still visible within timeout - **Test execution stops**

**QA Best Practice**: Use this method to assert and validate that an element is not displayed on the screen in your test cases.

### is.disabled()

**Returns `true`/`false` for conditional logic** - Does not throw errors.

Check if element is disabled. Use this **only in if conditions** for branching logic. This method returns a boolean value and is intended for runtime decision-making, not for QA test assertions.

```javascript
const disabled = await browser.button('Submit').is.disabled()
if (!disabled) {
  await browser.button('Submit').click()
}
```

**Returns**: `Promise<boolean>` - `true` if disabled, `false` otherwise

**QA Best Practice**: For test validations that validate whether elements are disabled, use `should.be.disabled()` or `should.be.enabled()` instead.

### is.enabled()

**Returns `true`/`false` for conditional logic** - Does not throw errors.

Check if element is enabled. Use this **only in if conditions** for branching logic.

```javascript
const enabled = await browser.button('Submit').is.enabled()
if (enabled) {
  await browser.button('Submit').click()
}
```

**Returns**: `Promise<boolean>` - `true` if enabled, `false` if disabled

### should.be.disabled()

**Assertion that throws an error and stops test execution on failure.**

Validate that an element is disabled. Use this for QA test validations and verifications to ensure elements are properly disabled on the screen.

```javascript
await browser.button('Submit').should.be.disabled()
```

**Throws**: Error if element is enabled - **Test execution stops**

**QA Best Practice**: Use this method to assert and validate that an element is disabled on the screen in your test cases.

### should.be.enabled()

**Assertion that throws an error and stops test execution on failure.**

Validate that an element is enabled. Use this for QA test validations and verifications to ensure elements are properly enabled on the screen.

```javascript
await browser.button('Submit').should.be.enabled()
```

**Throws**: Error if element is disabled - **Test execution stops**

**QA Best Practice**: Use this method to assert and validate that an element is enabled on the screen in your test cases.

### isChecked()

**Assertion that throws an error and stops test execution on failure.**

Check if checkbox is checked.

```javascript
const checked = await browser.checkbox('Subscribe').isChecked()
```

**Throws**: Error if checkbox is not checked - **Test execution stops**

### isUnchecked()

**Assertion that throws an error and stops test execution on failure.**

Check if checkbox is unchecked.

```javascript
const unchecked = await browser.checkbox('Subscribe').isUnchecked()
```

**Throws**: Error if checkbox is checked - \*_Test execution stops_

### isOn()

**Assertion that throws an error and stops test execution on failure.**

Check if a switch is currently on.

```javascript
const on = await browser.switch('Dark Mode').isOn()
```

**Throws**: Error if switch is off - **Test execution stops**

### isOff()

**Assertion that throws an error and stops test execution on failure.**

Check if a switch is currently off.

```javascript
const off = await browser.switch('Dark Mode').isOff()
```

**Throws**: Error if switch is on - **Test execution stops**

### isSet()

**Assertion that throws an error and stops test execution on failure.**

Assert that a radio button is currently set (selected).

```javascript
await browser.radio('Male').isSet()
```

**Throws**: Error if radio button is not set - **Test execution stops**

**Returns**: `Promise<boolean>`

### isNotSet()

**Assertion that throws an error and stops test execution on failure.**

Assert that a radio button is currently NOT set (not selected).

```javascript
await browser.radio('Female').isNotSet()
```

**Throws**: Error if radio button is set - **Test execution stops**

**Returns**: `Promise<boolean>`

### scroll([alignToTop])

Scroll element into view.

```javascript
await browser.element('Submit').scroll() // Align to top
await browser.element('Footer').scroll(false) // Align to bottom
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
browser.window() // Current window
browser.window('Google') // By title
browser.window(0) // By index
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

### window().should.be.visible([timeout])

**Assertion that throws an error and stops test execution on failure.**
Check if window is displayed.

```javascript
const displayed = await browser.window('Google').should.be.visible()
await browser.window('Title').should.be.visible(5000) // 5s timeout
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
browser.tab() // Current tab
browser.tab('Google') // By title
browser.tab(0) // By index
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

### tab().should.be.visible([timeout])

**Assertion that throws an error and stops test execution on failure.**
Check if tab is displayed.

```javascript
const displayed = await browser.tab(0).should.be.visible()
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
browser.alert() // Any alert
browser.alert('Confirmation') // With specific text
```

**Parameters**:

- `text` (string, optional): Expected alert text

**Returns**: `AlertInstance`

### alert().is.visible()

Check if alert is present.

```javascript
const present = await browser.alert().is.visible()
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

### get.value()

Get element text content (alias for `get.text()`).

```javascript
const text = await browser.element('div').get.value()
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
const name = await browser.get.name() // 'chrome', 'firefox', etc.
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

Get specific element occurrence (0-based).

```javascript
await browser.element('Item').atIndex(0).click()
await browser.textbox('Email').atIndex(2).write('...')
```

### exact

Exact text matching instead of partial.

```javascript
await browser.exact.element('male').click() // Won't match 'Female'
```

### hidden

Get hidden elements.

```javascript
await browser.hidden.element('tooltip').click()
```

### above / below

Spatial positioning relative to anchor.

```javascript
await browser.button('Delete').above.element('Section').click()
```

### toLeftOf / toRightOf

Horizontal spatial positioning.

```javascript
await browser.element('target').toLeftOf.element('anchor').click()
```

### within

Element containment.

```javascript
await browser.button('Submit').within.dialog('Form').click()
```

### near

Proximity-based selection.

```javascript
await browser.element('Item').near.element('Anchor').click()
```

### or

Multiple possible names.

```javascript
await browser.button('Save').or.button('Apply').click()
```

### exactly

Precise positioning (vs approximate).

```javascript
await browser.textbox('Name').exactly.below.element('Label').write('...')
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
