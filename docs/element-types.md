# Element Types

This document explains how element types are used to differentiate elements that have the same name on the screen.

## Element Selection by Type

When locating elements, the library uses element types to precisely identify elements, following a human-like approach to element identification.

### Types Allow Differentiation

Types allow us to differentiate elements that have the same name on the screen. For example, if there is both a button and an input placeholder named "Search" on the page and you want to click the button, the way to specify it would be `click button "Search"`.

### Supported Types

1. **label**
   - Example: `await browser.label('Email').write('user@example.com')`
   - Example: `await browser.label('male').click()`
   - Example: `await browser.label('male').isVisible()`

2. **button**
   - Example: `await browser.button('Submit').click()`
   - Example: `await browser.button('male').get.attribute('some attribute to check)`

3. **link**
   - Example: `await browser.link('Go to home page').click()`
   - Example: `await browser.link('male').click()`

4. **textbox** (or "edit" or "field" or "input" or "search" or "email")
   - Example: `await browser.textbox('Enter your email').write('user@example.com')`
   - Example: `await browser.textbox('Email').get.value()`
   - Example: `await browser.textbox('Search').clear()`
   - Example: `await browser.textbox('Password').overwrite('newemail@exmaple.com)`

5. **dropdown** (or "select")
   - Example: `await browser.dropdown('Country').select('United States')`
   - Example: `await browser.select('Country').select('United States')`
   - Example: `await browser.dropdown('Country').get.value()`

6. **checkbox** (or "switch")
   - Example: `await browser.checkbox('Subscribe').check()`
   - Example: `await browser.checkbox('Subscribe').click()`
   - Example: `await browser.switch('Remember me').check()`
   - Example: `await browser.switch('Remember me').isChecked()`

7. **radio button** (or "radio")
   - Example: `await browser.radio('male').check()`
   - Example: `await browser.radiobutton('male').check()`
   - Example: `await browser.radio('male').isVisible()`
   - Example: `await browser.radio('male').click()`

8. **file input** (or "input file" or "edit file" or "input type file") - specifically an input of type file
   - Example: `await browser.file('Upload your resume').upload('/path/to/resume.pdf')`
   - Example: `await browser.inputfile('Upload file').upload('/path/to/file.txt')`

9. **tab**
   - Example: `await browser.tab('Tab Title').click()`
   - Example: `await browser.tab('Tab Title').isVisible()`

10. **toolbar**
    - Example: `await browser.toolbar('Main Toolbar').click()`
    - Example: `await browser.toolbar('Main Toolbar').isVisible()`

11. **image** (or "img")
    - Example: `await browser.image('Company Logo').click()`
    - Example: `await browser.image('Company Logo').isVisible()`

12. **dialog**
    - Example: `await browser.dialog('Confirmation').click()`
    - Example: `await browser.dialog('Confirmation').isVisible()`

13. **navigation**
    - Example: `await browser.navigation('Main Navigation').click()`
    - Example: `await browser.navigation('Main Navigation').isVisible()`

14. **heading**
    - Example: `await browser.heading('Page Title').click()`
    - Example: `await browser.heading('Page Title').isVisible()`

15. **slider**
    - Example: `await browser.slider('Volume').set(50)`
    - Example: `await browser.slider('Volume').get.value()`

16. **combobox**
    - Example: `await browser.combobox('Country').select('United States')`
    - Example: `await browser.combobox('Country').get.value()`

17. **list**
    - Example: `await browser.list('Shopping List').click()`
    - Example: `await browser.list('Shopping List').isVisible()`

18. **listitem**
    - Example: `await browser.listitem('Item 1').click()`
    - Example: `await browser.listitem('Item 1').isVisible()`

19. **menu**
    - Example: `await browser.menu('File').click()`
    - Example: `await browser.menu('File').isVisible()`

20. **menuitem**
    - Example: `await browser.menuitem('Save').click()`
    - Example: `await browser.menuitem('Save').isVisible()`

21. **alert**
    - Example: `await browser.alert('Error').click()`
    - Example: `await browser.alert('Error').isVisible()`

22. **row**
    - Example: `await browser.row('Data Row 1').click()`
    - Example: `await browser.row('Data Row 1').isVisible()`

23. **column**
    - Example: `await browser.column('Name Column').click()`
    - Example: `await browser.column('Name Column').isVisible()`

## Usage Examples

When elements share the same name or label, specifying the type helps to target the correct element:

- Example: `await browser.element('Search').click()`
- Example: `await browser.button('Search').click()`

- Example: `await browser.element('Email').write('user@example.com')`
- Example: `await browser.input('Email').write('user@example.com')`

- Example: `await browser.element('Country').select('United States')`
- Example: `await browser.dropdown('Country').select('United States')`

- Example: `await browser.element('Subscribe').check()`
- Example: `await browser.checkbox('Subscribe').check()`

This approach makes the library more intuitive and reliable for developers, as it mimics how a human would naturally identify elements on a web page.

## Element Indexes

Element indexes are allowed for when multiple instances of the same element are on the page. The `atIndex()` method can be used with any element type to target a specific instance.

### Usage

```javascript
// Click the 3rd element with the text "Search"
await browser.element('Search').atIndex(2).click()

// Get the value of the 2nd textbox named "Email"
await browser.element('Email').atIndex(1).get.value()

// Check the 1st checkbox named "Subscribe"
await browser.element('Subscribe').atIndex(0).check()

// Select the 4th dropdown named "Country"
await browser.element('Country').atIndex(3).select('United States')
```

### Indexing Behavior

- Indexes are zero-based (0, 1, 2, ...)
- When no index is specified, the first matching element is used
- If an index is out of range, the operation will fail gracefully
- The `atIndex()` method can be chained with any element type method

## Filtered Indexes

Filtered indexes are a combination of indexes and types. They allow you to specify both an element type and an index to target a specific instance of that element type.

### Usage

```javascript
// Find the second input/edit named "address"
await browser.textbox('address').atIndex(2).find()

// Find the third dropdown named "Country"
await browser.dropdown('Country').atIndex(2).select('United States')

// Find the first checkbox named "Subscribe"
await browser.checkbox('Subscribe').atIndex(0).check()
```

### Behavior

- Filtered indexes combine the specificity of element types with the positioning of indexes
- The index is applied after the element type is determined
- This allows for precise targeting of elements when multiple instances of the same type exist
- The `atIndex()` method works with all element types and can be chained with any element method

### Examples

```javascript
// Find the 2nd textbox named "Email"
await browser.textbox('Email').atIndex(2).get.value()

// Find the 3rd button named "Submit"
await browser.button('Submit').atIndex(3).click()

// Find the 1st radio button named "male"
await browser.radio('male').atIndex(0).check()

// Find the 2nd file input named "Upload"
await browser.file('Upload').atIndex(2).upload('/path/to/file.txt')
```
