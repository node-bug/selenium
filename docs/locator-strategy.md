# Locator Strategy

The library locates elements like humans do:

1. **By what they say** (text, placeholder, label) - the primary identifier
2. **By where they are** (position relative to other elements) - spatial context
3. **By what they are** (type, attributes) - semantic meaning

See [Core Concepts - Element Locator Strategy](CONCEPTS.md#element-locator-strategy-human-like-prioritization) for a complete explanation.

## Text-Based Locating (Primary)

Elements are located by searching attributes in this order:

1. **Text** - Element's visible text content
2. **Placeholder** - `placeholder` attribute
3. **Value** - `value` attribute
4. **Test IDs** - `data-tid`, `data-testid`, `data-test-id`, `id`, `resource-id`, `data-id`
5. **Name** - `name` attribute
6. **ARIA Label** - `aria-label` attribute
7. **CSS Class** - `class` attribute
8. **ML Classification** - Machine learning-based label detection
9. **Tooltip** - `title`, `hint`, `tooltip` attributes
10. **Image Attributes** - `alt` and `src` attributes

### Example Matches

```javascript
// Matches by text (priority 1)
await browser.button('Submit').click()

// Matches by placeholder (priority 2)
await browser.textbox('Enter your email').write('...')

// Matches by value (priority 3)
await browser.textbox('john@example.com').write('...')

// Matches by data-testid (priority 4)
await browser.element('auth-submit').click()

// Matches by name (priority 5)
await browser.element('country').click()

// Matches by aria-label (priority 6)
await browser.link('Go to home').click()

// Matches by class (priority 7)
await browser.element('btn-primary').click()

// Matches by title (priority 9)
await browser.file('Upload Resume').upload('resume.pdf')

// Matches by alt text (priority 10)
await browser.image('Logo').click()
```

## Position-Based Locating (Spatial Context)

When multiple elements exist with the same text, use spatial references to narrow down:

```javascript
// \"The password field below the email field\"
await browser.textbox('Password').below().textbox('Email').write('secret')

// \"The submit button to the right of the cancel button\"
await browser.button('Submit').toRightOf().button('Cancel').click()

// \"The delete button inside the confirmation dialog\"
await browser.button('Delete').within().dialog('Confirm').click()
```

Supported positions: `above()`, `below()`, `toLeftOf()`, `toRightOf()`, `within()`, `near()`

Learn more: [Spatial References](spatial-references.md)

By default, partial text matches. Use `exact()` for exact matching:

```javascript
await browser.exact().element('Test').click() // Won't match 'Testing'
```

## Form Label Association

For form elements (input, checkbox, radio, select), the library searches associated `<label>` elements:

```html
<label for="email">Email:</label> <input id="email" type="text" />
```

```javascript
await browser.textbox('Email').write('...') // Matches the label
```

## See Also

- [Core Concepts](CONCEPTS.md#element-locator-strategy-human-like-prioritization) - Detailed explanation
- [Element Types](element-types.md) - Type-specific selectors
- [API Reference](API-REFERENCE.md#element-selection) - Element selection methods
