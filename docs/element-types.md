# Element Types

Semantic element type selectors for precise element targeting. See [API Reference](API-REFERENCE.md#element-selection) for complete method list.

## Quick Reference

| Type | Can also be used for | Usage |
| ------------ | ------------------------------------------- | |
| `button` | - | `browser.button('Submit').click()` |
| `textbox` | `input`, `field`, `edit`, `email`, `search` | `browser.textbox('Email').write('...')` |
| `checkbox` | - | `browser.checkbox('Subscribe').check()` |
| `switch` | - | `browser.switch('Subscribe').on()` |
| `radio` | `radiobutton` | `browser.radio('Male').check()` |
| `dropdown` | `select`, `combobox` | `browser.dropdown('Country').select('US')` |
| `link` | - | `browser.link('Home').click()` |
| `image` | `img` | `browser.image('Logo').click()` |
| `file` | `inputfile` | `browser.file('Upload').upload('file.txt')` |
| `label` | - | `browser.label('Name').click()` |
| `toolbar` | - | `browser.toolbar('Tools').click()` |
| `dialog` | - | `browser.dialog('Confirm').click()` |
| `navigation` | - | `browser.navigation('Menu').click()` |
| `heading` | - | `browser.heading('Title').click()` |
| `slider` | - | `browser.slider('Volume').set(50)` |
| `list` | - | `browser.list('Items').click()` |
| `listitem` | - | `browser.listitem('Item1').click()` |
| `menu` | - | `browser.menu('File').click()` |
| `menuitem` | - | `browser.menuitem('Save').click()` |
| `alert` | - | `browser.alert('Error').click()` |
| `row` | - | `browser.row('Row1').click()` |
| `column` | - | `browser.column('Column1').click()` |
| `element` | - | `browser.element('Any').click()` (generic) |

## When to Use Each Type

### Use Type-Specific Selectors

When you want to target a specific element type:

```javascript
// Click button specifically (not link with same text)
await browser.button('Next').click()

// Input textbox specifically
await browser.textbox('Email').write('user@example.com')

// Select checkbox specifically (not radio with same text)
await browser.checkbox('Remember').check()
```

### Use Generic element()

When type doesn't matter or is unknown:

```javascript
await browser.element('Text').click()
```

## Element Index

When multiple elements of same type share the same name, use `atIndex()`:

```javascript
// First textbox named 'Email'
await browser.textbox('Email').atIndex(0).write('...')

// Third button named 'Delete'
await browser.button('Delete').atIndex(2).click()
```

## See Also

- [Core Concepts](CONCEPTS.md#element-types) - Element type overview
- [Locator Strategy](locator-strategy.md) - How elements are matched
- [API Reference](API-REFERENCE.md#element-selection) - All element selectors
