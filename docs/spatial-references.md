# Spatial References

Locate elements by position relative to other elements (anchor elements). See [Core Concepts](CONCEPTS.md#spatial-references) for detailed explanation.

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
await browser.button('Delete')
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
await browser.button('Delete')
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
await browser.button('Delete')
  .below()
  .element('Section')
  .toRightOf()
  .element('Label')
  .click()

// Within dialog AND above submit button
await browser.textbox('Email')
  .within()
  .dialog('Form')
  .above()
  .button('Submit')
  .write('user@example.com')
```

## See Also

- [Core Concepts - Spatial References](CONCEPTS.md#spatial-references) - Detailed explanation
- [API Reference - Positioning](API-REFERENCE.md#positioning--filtering) - All positioning methods
- [Multiple References](multiple-references.md) - Using `or()` for alternatives

  .element('sectionTwo')
  .below()
  .element('Actions')
  .toRightOf('rowName')
  .click()
```

## Spatial Positioners

The library provides several spatial positioners that can be used to target elements:

### within()

Targets an element located inside another element.

```javascript
browser.element('menu').within().element('item').click()
```

This is useful for finding elements within specific containers, like:

- Finding a button inside a specific section
- Finding an item within a dropdown menu
- Finding elements within a table row

### near()

Targets an element based on proximity.

```javascript
browser.element('target').near().element('other').click()
```

This finds elements that are close to the anchor element, useful when exact positioning isn't critical.

## Combining Spatial and Contextual References

You can combine spatial references with contextual references for more precise element targeting:

```javascript
browser
  .element('menu')
  .within()
  .element('item')
  .below()
  .element('other')
  .click()
```

This approach allows for complex element selection that mimics how a human would identify elements on a web page, making your automation scripts more intuitive and easier to write.
