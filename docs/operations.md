# Operations

See [Core Concepts - Operations](CONCEPTS.md#operations-intermediate-vs-terminal) for detailed explanation and patterns.

## Intermediate Operations

Build the selector stack without executing. Return `WebBrowser` for chaining.

**Element Selectors**
- `element()`, `button()`, `textbox()`, `checkbox()`, `switch()`,`radio()`, `link()`, `image()`, `file()`, `label()`, `toolbar()`, `tab()`, `dialog()`, `navigation()`, `heading()`, `slider()`, `combobox()`, `list()`, `listitem()`, `menu()`, `menuitem()`, `row()`, `column()`, `alert()`

**Positioning**
- `above()`, `below()`, `toLeftOf()`, `toRightOf()`, `within()`, `near()`

**Filtering**
- `atIndex()`, `exact()`, `hidden()`

**Drag & Drop**
- `drag()`, `onto()`

**Logical**
- `or()`

**Modifiers**
- `exactly()`

## Terminal Operations

Execute the stack and perform actions. Return value or reset stack.

**Click Operations**
- `click()`, `doubleClick()`, `rightClick()`, `middleClick()`, `tripleClick()`, `longPress()`, `multipleClick()`, `clickWithModifier()`, `hover()`

**Input Operations**
- `write()`, `clear()`, `overwrite()`, `focus()`

**File Operations**
- `upload()`

**Visibility Checks**
- `isVisible()`, `isDisplayed()`, `isNotDisplayed()`, `isDisabled()`

**Checkbox Operations**
- `check()`, `uncheck()`, `isChecked()`, `isUnchecked()`

**Switch Operations**
- `on()`, `off()`, `isOn()`, `isOff()`

**Element Retrieval**
- `find()`, `findAll()`

**Data Retrieval**
- `get.text()`, `get.value()`, `get.attribute()`, `get.screenshot()`

**Scroll & Visibility**
- `scroll()`, `hide()`, `unhide()`

**Drag & Drop Completion**
- `drop()`

**Browser Control**
- `close()`, `new()`, `refresh()`, `goBack()`, `goForward()`, `reset()`

**Alert Handling**
- `alert().accept()`, `alert().dismiss()`, `alert().write()`, `alert().get.text()`

**Window Management**
- `window().switch()`, `window().close()`, `window().new()`, `window().maximize()`, `window().minimize()`, `window().fullscreen()`, `window().isDisplayed()`, `window().get.title()`, `window().get.url()`, `window().get.consoleErrors()`

**Tab Management**
- `tab().switch()`, `tab().close()`, `tab().new()`, `tab().isDisplayed()`, `tab().get.title()`, `tab().get.url()`

## Pattern: Building a Chain

```javascript
// Intermediate → Intermediate → Terminal
await browser
  .button('Delete')           // Intermediate: Select button
  .below()                    // Intermediate: Position filter
  .element('Actions')         // Intermediate: Anchor reference
  .click()                    // Terminal: Execute action
```

Stack is cleared after each terminal operation.

## See Also

- [Core Concepts - Operations](CONCEPTS.md#operations-intermediate-vs-terminal) - Detailed explanation
- [API Reference](API-REFERENCE.md) - Complete method reference
- [Method Chaining Pattern](CONCEPTS.md#method-chaining-pattern) - Chaining examples

