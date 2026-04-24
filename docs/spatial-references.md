# Spatial References

Locate elements by describing their position relative to other elements—the way humans naturally think about UI layout.

## Understanding Human-Like Language

The library interprets spatial descriptions just as you'd speak them:

| Human Language                     | Library Code                 | What It Means                            |
| ---------------------------------- | ---------------------------- | ---------------------------------------- |
| "The button below delete"          | `.below().element('Delete')` | Find element positioned below the anchor |
| "The field next to the name label" | `.toRightOf().label('Name')` | Find element to the right of the anchor  |
| "The button inside the dialog"     | `.within().dialog('Form')`   | Find element contained within the anchor |
| "The link above the footer"        | `.above().element('Footer')` | Find element positioned above the anchor |
| "The text to the left of the icon" | `.toLeftOf().image('icon')`  | Find element to the left of the anchor   |

## Quick Examples

```javascript
// Below an element
await browser.button('Delete').below().element('Actions').click()

// Above an element
await browser.textbox('Name').above().label('Name').write('John')

// To the left/right
await browser.element('Target').toLeftOf().element('Other').click()
await browser.element('Target').toRightOf().element('Other').click()

// Within another element
await browser.button('Save').within().dialog('Form').click()

// Near an element
await browser.element('Item').near().element('Anchor').click()

// Combine multiple spatial references
await browser
  .button('Delete')
  .below()
  .element('Section')
  .toRightOf()
  .element('Label')
  .click()
```

## Positioning Keywords

### below() / above()

Element's vertical position relative to anchor.

```javascript
await browser.button('Delete').below().element('Actions').click()
await browser.textbox('City').above().label('State').write('TX')
```

### toLeftOf() / toRightOf()

Element's horizontal position relative to anchor.

```javascript
await browser.element('Save').toLeftOf().element('Cancel').click()
await browser.element('Cancel').toRightOf().element('Save').click()
```

### within()

Element is contained within another element (contextual selection).

```javascript
// Click button within dialog
await browser.button('Submit').within().dialog('Confirm').click()

// Click row in table
await browser.row('User1').within().table('Users').click()
```

### near()

Element is in proximity to another element.

```javascript
await browser.element('Item').near().element('Anchor').click()
```

## Precision with exactly()

Use `exactly()` for precise positioning (not approximate).

```javascript
// Approximate positioning
await browser.textbox('Name').below().element('Label').write('John')

// Precise positioning
await browser.textbox('Name').exactly().below().element('Label').write('John')

// Multiple anchors with mixed precision
await browser
  .button('Delete')
  .below()
  .element('Section')
  .exactly()
  .toRightOf()
  .element('Label')
  .click()
```

## Combining References

Chain multiple spatial references for precise targeting:

```javascript
// Below Section AND to the right of Label
await browser
  .button('Delete')
  .below()
  .element('Section')
  .toRightOf()
  .element('Label')
  .click()

// Within dialog AND above submit button
await browser
  .textbox('Email')
  .within()
  .dialog('Form')
  .above()
  .button('Submit')
  .write('user@example.com')
```

## Real-World Examples

### Login Form

When you see: "The password field is below the email field"

```javascript
await browser.textbox('Password').below().textbox('Email').write('mypassword')
```

### Data Table

When you see: "Delete the button in the row with 'User123'"

```javascript
await browser.button('Delete').within().row('User123').click()
```

### Modal Dialog

When you see: "The save button inside the user details dialog"

```javascript
await browser.button('Save').within().dialog('User Details').click()
```

### Complex Layout

When you see: "The cancel button to the left of the submit button in the footer"

```javascript
await browser
  .button('Cancel')
  .toLeftOf()
  .button('Submit')
  .within()
  .element('Footer')
  .click()
```

## See Also

- [Core Concepts - Spatial References](CONCEPTS.md#spatial-references) - Detailed explanation
- [API Reference - Positioning](API-REFERENCE.md#positioning--filtering) - All positioning methods
- [Multiple References](multiple-references.md) - Using `or()` for alternatives
