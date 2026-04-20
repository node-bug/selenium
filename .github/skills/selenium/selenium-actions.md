# Skill: @nodebug/selenium Action API

## Click Delegate

- **Multi-Click**: `.doubleClick()`, `.tripleClick()`, `.clickMultiple(n)`.
- **Mouse Buttons**: `.rightClick()`, `.middleClick()`.
- **Press/Hover**: `.longPress(ms)` (default 1000ms), `.hover()`.
- **Modifiers**: `.clickWithModifier({ ctrl: true, shift: true, alt: true, meta: true })`.

## Input Delegate

- **`.write(text)`**: Standard entry.
- **`.overwrite(text)`**: Clears existing text before typing.
- **`.clear()`**: Removes all text from a field.
- **`.focus()`**: Sets focus on an element.

## Browser & Tab Management

- **Navigation**: `goto(url)`, `refresh()`, `goBack()`, `goForward()`.
- **Tabs**: `browser.tab().new()`, `browser.tab(index).switch()`, `browser.tab().close()`.
- **Windows**: `browser.window().maximize()`, `browser.window().fullscreen()`, `browser.window().new()`.
- **Alerts**: `browser.alert().accept()`, `browser.alert().dismiss()`.
- **Window/Tab Properties**: `browser.window().get.url()`, `browser.window('title').get.url()`, `browser.tab().get.url()`, `browser.tab('title').get.url()`.

## Visibility States

- **Waiters**: `isDisplayed(timeout)`, `isNotDisplayed(timeout)`.
- **State**: `isVisible()`, `isDisabled()`, `isChecked()`.
- **Visuals**: `scroll()`, `hide()` (sets opacity 0), `unhide()`.
- **Element State**: `isUnchecked()`, `isNotChecked()`.

## Element Manipulation

- **Check/Uncheck**: `check()`, `uncheck()`
- **Upload**: `upload(filePath)`
- **Drag & Drop**: `drag()`, `onto(target)`, `drop()`
- **Get Properties**: `get.text()`, `get.value()`, `get.attribute(name)`, `get.url()`, `get.title()`
