# Locator Strategy

This document explains how element locators are prioritized for both desktop and mobile web browser testing, following a human-like approach to element identification.

## Element Selection Priority

When locating elements, the library prioritizes visible text and attributes in the following order, processing elements as a human would:

1. **Text** - Text content of the element
   - Example: `await browser.button('Submit').click()`
   - Example: `await browser.checkbox('male').check()`

2. **Placeholder** - Placeholder attribute
   - Example: `await browser.textbox('Enter your email').write('user@example.com')`

3. **Value** - Value attribute
   - Example: `await browser.textbox('john.doe@example.com').get.attribute(value)`

4. **data-tid/data-testid/data-test-id/Id/resource-id/data-id** - Test identifiers
   - Example: `await browser.checkbox('remember-me').check()`

5. **Name** - Name attribute
   - Example: `await browser.element('country').click()`

6. **aria-label** - ARIA label attribute
   - Example: `await browser.link('Go to home page').click()`

7. **CSS Class** - CSS class attribute
   - Example: `await browser.button('save-button').click()`

8. **Label from ML classification** - Machine learning classification of element labels
   - Example: `await browser.radio('male gender').check()`

9. **Hint/Title/Tooltip** - Title or tooltip attributes
   - Example: `await browser.file('Upload your resume').upload('/path/to/resume.pdf')`

10. **Alt/Src** - Alt or src attributes for images
    - Example: `await browser.image('Company Logo').click()`

## Special Handling for Form Elements

For inputs, edits, dropdowns, selects, and other form elements, the library will also search for corresponding labels to improve element identification accuracy.

- Example: When finding a textbox, the library will look for a label element associated with that input to improve accuracy.
- Example: `await browser.checkbox('male').check()`

## Desktop vs Mobile Testing

The same locator strategy applies to both desktop and mobile web browser testing. The human-like approach ensures consistent element identification across different platforms and devices.

This approach makes the library more intuitive and reliable for developers, as it mimics how a human would naturally identify elements on a web page.

## Supported Attributes

The following list contains the supported attributes that tests can interact with. Attributes are searched for without the need to refer to them in the script. The command `browser.element("test element").isDisplayed()` will search through elements with the following attributes:

- `placeholder`
- `value`
- `data-test-id`
- `data-testid`
- `id`
- `resource-id`
- `name`
- `aria-label`
- `class`
- `hint`
- `title`
- `tooltip`
- `alt`
- `src`
- `role`
