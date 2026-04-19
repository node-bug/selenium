# Spatial and Relative Element References

This document explains how to select elements based on their position in relation to other elements, also known as "spatial" or "relative" positioning.

## Understanding Spatial References

Spatial references let you locate elements based on where they appear in relation to other elements on the page. The element you're referencing is called the "anchor" element.

For example, you can refer to elements in certain sections like:

```javascript
click button "Delete" below "Actions"
```

This means: "Click the button labeled 'Delete' that appears below the element labeled 'Actions'."

## Anchor Elements

An anchor element is the reference point you use to locate other elements. You can use any element as an anchor, such as:

- Text labels
- Buttons
- Sections
- Tables
- Any visible element on the page

## Supported Relative Locations

The following relative locations are supported for positioning elements:

### to the left of

```javascript
browser.element('target').toLeftOf().element('other').click()
```

### to the right of

```javascript
browser.element('target').toRightOf().element('other').click()
```

### above

```javascript
browser.element('target').exactly().above().element('other').click()
```

### below

```javascript
browser.element('target').below().element('other').click()
```

### on the right top of

```javascript
browser.element('target').onRightOf().above().element('other').click()
```

### on the left top of

```javascript
browser.element('target').onLeftOf().exactly().above().element('other').click()
```

### on the right bottom of

```javascript
browser.element('target').onRightOf().below().element('other').click()
```

### on the left bottom of

```javascript
browser.element('target').exactly().onLeftOf().below().element('other').click()
```

### near

```javascript
browser.element('target').near().element('other').click()
```

## Visual Reference

To help understand these positions, imagine a grid where elements can be located relative to each other:

```
    [Above]
[Left] [Target] [Right]
    [Below]
```

The "target" element is the one you're trying to find, and "other" is the anchor element.

## Combining Multiple References

You can combine multiple spatial references to locate elements more precisely:

- Example: `click on button "Delete" below "Section Name" to the right of "label"`

```javascript
browser
  .button('Delete')
  .below()
  .element('Section Name')
  .toRightOf()
  .element('label')
  .click()
```

This means: "Click the 'Delete' button that is both below the 'Section Name' element AND to the right of the 'label' element."

## Overlap and Precision

### exactly keyword

The **exactly** keyword forces precise positioning rather than approximate positioning.

For example:
`enter "some text" into "Name" exactly below "Section"`

```javascript
browser.textbox('Name').exactly().below().element('Section').write('some text')
```

- Example: `enter "firstname" into "Username" below "Type" and exactly on the right of "Description"`

```javascript
browser
  .textbox('Username')
  .below()
  .element('Type')
  .exactly()
  .toRightOf()
  .element('Description')
  .write('firstname')
```

This is NOT equivalent to:

```javascript
browser
  .textbox('Username')
  .exactly()
  .below()
  .element('Type')
  .toRightOf()
  .element('Description')
  .write('firstname')
browser
  .textbox('Username')
  .below()
  .element('Type')
  .toRightOf()
  .element('Description')
  .write('firstname')
```

If you want "exactly" for both anchors:

- Example: `enter "firstname" into "Username" exactly below "Type" and exactly on the right of "Description"`

```javascript
browser
  .textbox('Username')
  .exactly()
  .below()
  .element('Type')
  .exactly()
  .toRightOf()
  .element('Description')
  .write('firstname')
```

## Tips for Using Multiple References

1. **Order matters**: The first reference is typically interpreted more loosely
2. **Use exactly when precision is needed**: Apply the exactly keyword to the reference that requires precise positioning
3. **Combine with other spatial references**: You can mix different positioning types in a single reference

## Selecting Elements in the Context of Other Elements

You can also select elements within the context of other elements. This is particularly useful when working with tables, lists, or sections where you need to narrow down your search.

For example, you can pinpoint a row in a table and ask to click a button in the context of that row:

```javascript
click on "Delete" within the context of table "actions" at row containing "id1" and column "Actions"
```

You can also combine spatial references with contextual references:

- Example: `click on "Delete" within the context of "sectionTwo" below "Actions" and to the right of "rowName"`

```javascript
browser
  .button('Delete')
  .within()
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
