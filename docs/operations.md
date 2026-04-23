# Operations in WebBrowser

The WebBrowser library uses a fluent API pattern where operations are divided into two categories: **intermediate operations** and **terminal operations**.

## Intermediate Operations

Intermediate operations are methods that build up the selector stack but do not execute any actions. They return the `WebBrowser` instance to allow for method chaining. These operations are used to refine element selection criteria.

### Examples of Intermediate Operations

- `element()`, `button()`, `textbox()`, `checkbox()`, `link()`, `image()`, `file()`, `radio()`, `slider()`, `combobox()`, `navigation()`, `heading()`, `list()`, `listitem()`, `menu()`, `menuitem()`, `tab()`, `toolbar()`, `dialog()`, `row()`, `column()` - Element selectors
- `above()`, `below()`, `toLeftOf()`, `toRightOf()` - Spatial positioning
- `within()` - Element containment
- `near()` - Proximity-based selection
- `exactly()` - Exact text matching
- `or()` - Logical OR conditions
- `atIndex()` - Select specific occurrence
- `exact()` - Exact text matching (alternative)
- `hidden()` - Hidden element selection
- `drag()`, `onto()`, `drop()` - Drag and drop operations
- `find()`, `findAll()` - Element location

### Usage Example

```javascript
// These are intermediate operations - they build up the stack
await browser.element('submit').above().button('cancel').click()
await browser.element('menu').within().link('home').click()
await browser.element('item').atIndex(2).click()
await browser.element('hidden-element').hidden().click()
await browser.element('text').exactly().toLeftOf().element('other').click()
await browser.element('file').file().upload('/path/to/file.txt')
await browser.element('radio-button').radio().check()
```

## Terminal Operations

Terminal operations are methods that execute the built-up selector stack and perform actual actions on elements. They typically return a value or perform an action and reset the stack.

### Examples of Terminal Operations

- `click()`, `write()`, `focus()`, `hover()`, `doubleClick()`, `rightClick()`, `middleClick()`, `tripleClick()`, `longPress()`, `multipleClick()`, `clickWithModifier()`, `overwrite()` - Element interaction
- `find()`, `findAll()` - Element location
- `isVisible()`, `isDisplayed()`, `isNotDisplayed()`, `isDisabled()` - Visibility checks
- `check()`, `uncheck()`, `isChecked()`, `isUnchecked()` - Checkbox operations
- `scroll()`, `hide()`, `unhide()` - Element manipulation
- `upload()`, `clear()` - File upload and input clearing
- `get.text()`, `get.attribute()`, `get.screenshot()` - Element data retrieval
- `drop()` - Drag and drop completion
- `close()`, `new()`, `refresh()`, `goBack()`, `goForward()`, `reset()` - Browser control
- `alert().accept()`, `alert().dismiss()` - Alert handling
- `window().switch()`, `tab().switch()`, `window().get.title()`, `window().get.url()`, `window().get.consoleErrors()`, `window().maximize()`, `window().minimize()`, `window().fullscreen()` - Window and tab management

### Usage Example

```javascript
// These are terminal operations - they execute actions
await browser.element('submit').click()
await browser.textbox('username').write('john')
await browser.element('div').isVisible()
await browser.element('file').upload('/path/to/file.txt')
await browser.element('menu').get.text()
await browser.element('input').clear()
await browser.element('menu').get.attribute('class')
await browser.element('image').get.screenshot()
await browser.window().close()
await browser.new()
await browser.element('button').doubleClick()
await browser.element('context-menu').rightClick()
await browser.element('element').multipleClick(3)
await browser.element('link').clickWithModifier({ ctrl: true })
await browser.element('input').overwrite('new text')
await browser.reset()
await browser.alert().accept()
await browser.alert().dismiss()
await browser.alert('Confirm').accept()
await browser.window().switch()
await browser.tab().switch()
await browser.window().get.title()
await browser.window().get.url()
await browser.window().get.consoleErrors()
```

## Method Chaining

The fluent API allows for method chaining where intermediate operations can be combined with terminal operations:

```javascript
// Chain intermediate operations followed by a terminal operation
await browser.element('submit').above().button('cancel').click()
await browser.element('menu').within().link('home').click()
await browser.element('item').atIndex(2).isVisible()
```

## Stack Management

The WebBrowser maintains an internal stack to build up element selection criteria. When a terminal operation is called, the stack is processed and then cleared to prevent state pollution between operations.
