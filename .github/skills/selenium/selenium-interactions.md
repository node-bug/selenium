# Skill: @nodebug/selenium Interactions

Handle clicks, inputs, and relative positioning.

## Click Operations

- Standard: `.click()`, `.doubleClick()`, `.rightClick()`
- Advanced: `.longPress(ms)`, `.tripleClick()`, `.clickMultiple(times)`
- Modifiers: `.clickWithModifier({ ctrl: true, shift: true })`

## Input Operations

- Standard: `.write(text)`, `.overwrite(text)`, `.clear()`, `.focus()`
- File Upload: `.upload(filePath)`

## Spatial (Relative) Positioning

Locate elements relative to "Anchor" elements:

- **Left/Right**: `.toLeftOf()`, `.toRightOf()`
- **Above/Below**: `.above()`, `.below()`
- **Precision**: Use `.exactly()` before a spatial command to force strict alignment.
  _Example:_ `browser.button('Delete').exactly().below().element('Actions')`
- **Containment**: Use `.within()` to search inside a specific container/section.
- **Proximity**: `.near()` for elements that are just "close by".
- **Diagonal**: `.onRightOf().above()`, `.onLeftOf().below()`.

## Visibility & Wait States

- `await browser.element('id').isDisplayed(timeout)`: Wait for visibility.
- `await browser.element('id').isNotDisplayed()`: Wait for disappearance.
- `await browser.element('id').scroll()`: Scroll into view (defaults to top).
- `await browser.element('id').hide()` / `.unhide()`: Toggle opacity via JS.
- `await browser.element('id').isVisible()`: Check if element is visible.
- `await browser.element('id').isDisabled()`: Check if element is disabled.
- `await browser.element('id').isChecked()`: Check if element is checked.
- `await browser.element('id').isUnchecked()`: Check if element is unchecked.

## Element State Operations

- `await browser.element('id').check()`: Check a checkbox or radio button.
- `await browser.element('id').uncheck()`: Uncheck a checkbox or radio button.
- `await browser.element('id').get.text()`: Get element text.
- `await browser.element('id').get.value()`: Get element value.
- `await browser.element('id').get.attribute('class')`: Get element attribute.
- `await browser.window().get.url()`: Get current window URL.
- `await browser.window('title').get.url()`: Get specific window URL.
- `await browser.tab().get.url()`: Get current tab URL.
- `await browser.tab('title').get.url()`: Get specific tab URL.
- `await browser.window().get.title()`: Get current window title.
- `await browser.window('title').get.title()`: Get specific window title.
