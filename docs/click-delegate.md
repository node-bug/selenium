# Click Interactions

Various click operations and hover functionality. See [API Reference](API-REFERENCE.md#element-interaction) for complete method signatures.

## Quick Examples

```javascript
// Standard click
await browser.button('Submit').click()

// Click at coordinates
await browser.element('menu').click(10, 20)

// Various click types
await browser.element('text').doubleClick()
await browser.element('menu').rightClick()
await browser.element('target').middleClick()
await browser.element('word').tripleClick()

// Long press
await browser.element('button').longPress() // 1 second
await browser.element('button').longPress(2000) // 2 seconds

// Multiple clicks
await browser.element('button').multipleClick(3) // 3 clicks

// Click with modifiers (option object)
await browser.link('Delete').clickWithModifier({ ctrl: true })
await browser.element('item').clickWithModifier({ shift: true, alt: true })

// Click with modifiers (chaining)
await browser.ctrl.link('Open').click()
await browser.shift.alt.element('item').click()
await browser.ctrl.element('canvas').click(10, 20)

// Hover
await browser.element('menu').hover()
```

## Click Operations

### Standard Click

```javascript
await browser.button('Submit').click()
```

**Modifier Support**: `click()` also supports modifier keys via chaining. Modifiers are automatically released after the click:

```javascript
await browser.button('link').ctrl.click() // Ctrl+click
await browser.element('item').shift.alt.click() // Shift+Alt+click
```

### Coordinate Click

Click at specific pixel coordinates:

```javascript
await browser.element('menu').click(100, 200)
```

### Double Click

```javascript
await browser.element('text').doubleClick()
```

### Right Click (Context Menu)

```javascript
await browser.element('context-menu').rightClick()
```

### Middle Click

```javascript
await browser.element('target').middleClick()
```

### Triple Click

Selects all text:

```javascript
await browser.element('text').tripleClick()
```

### Long Press / Hold

```javascript
await browser.element('button').longPress() // 1000ms default
await browser.element('button').longPress(3000) // 3000ms
```

### Multiple Clicks

```javascript
await browser.element('button').multipleClick(5) // Click 5 times
```

### Hover

Move mouse over element to trigger hover states:

```javascript
await browser.element('menu').hover()
await browser.button('dropdown').hover()
```

## Full API Reference

See [Click Operations API](API-REFERENCE.md#element-interaction)
