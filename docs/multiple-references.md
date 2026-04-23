# Multiple References

Using `or()` to target elements with different possible names. See [Core Concepts](CONCEPTS.md#multiple-references) for explanation.

## Quick Example

```javascript
// Click either "Checkout" or "Submit" button
await browser.button('Checkout').or().button('Submit').click()

// Check if either button is visible
const visible = await browser
  .button('Save')
  .or()
  .button('Apply')
  .isVisible()
```

## Use Cases

Use `or()` when elements might have different names depending on context or version:

```javascript
// Form might use different labels
await browser.textbox('Email').or().textbox('email_address').write('user@example.com')

// Checkbox might be "Remember Me" or "Remember"
await browser.checkbox('Remember Me').or().checkbox('Remember').check()

// Link might be "Home" or "Main"
await browser.link('Home').or().link('Main').click()

// Save button might be "Save" or "Apply" or "Submit"
await browser.button('Save').or().button('Apply').or().button('Submit').click()
```

## Element Selection Priority

When using `or()`, the first matching element in the command order is selected:

```javascript
// If both exist, "Save" button is clicked (listed first)
await browser.button('Save').or().button('Apply').click()

// If neither exists, first element displayed on screen is selected
await browser.button('NonExistent1').or().button('NonExistent2').click()
```

## Best Practices

1. **List most common first** - Put the most likely element name first
2. **Keep alternatives reasonable** - Don't chain too many `or()` calls (usually 2-3 max)
3. **Use sparingly** - Prefer specific selectors when possible
4. **Document reasons** - Add comments explaining why alternatives are needed

```javascript
// Good: Two reasonable alternatives
await browser.button('Next').or().button('Continue').click()

// Avoid: Too many alternatives (hard to maintain)
await browser.button('A').or().button('B').or().button('C').or().button('D').click()
```

## See Also

- [Core Concepts - Multiple References](CONCEPTS.md#multiple-references) - Detailed explanation
- [Locator Strategy](locator-strategy.md) - How elements are matched
- [Element Types](element-types.md) - Type-specific selectors

