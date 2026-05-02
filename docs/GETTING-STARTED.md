# Getting Started

Learn WebBrowser automation by building real-world examples. Complete setup to productive tests in 15 minutes.

## Installation

```bash
npm install @nodebug/selenium
```

## Quick Setup (2 minutes)

### 1. Create Browser Configuration

Create `.config/selenium.json` in your project root:

```json
{
  "browser": "chrome",
  "headless": false,
  "timeout": 30
}
```

For other configuration options, see [CONFIGURATION.md](CONFIGURATION.md).

### 2. Your First Script

Create `example.js`:

```javascript
import WebBrowser from '@nodebug/selenium'

async function main() {
  const browser = new WebBrowser()

  try {
    // Start browser
    await browser.start()

    // Navigate
    await browser.goto('https://example.com')

    // Find and interact with element
    await browser.button('More Information').click()

    // Verify result
    await browser.heading('More Information').should.be.visible()

    console.log('✅ Test passed!')
  } finally {
    await browser.close()
  }
}

main()
```

Run it:

```bash
node example.js
```

---

## Real-World Examples

### Example 1: Login Form

A typical login scenario:

```javascript
import WebBrowser from '@nodebug/selenium'

async function loginTest() {
  const browser = new WebBrowser()

  try {
    await browser.start()
    await browser.goto('https://example.com/login')

    // Fill form fields
    await browser.textbox('Email Address').write('user@example.com')
    await browser.textbox('Password').write('myPassword123')

    // Check remember me checkbox
    await browser.checkbox('Remember me').check()

    // Submit form
    await browser.button('Sign In').click()

    // Wait for successful login
    await browser.heading('Welcome').should.be.visible()

    console.log('✅ Login successful')
  } finally {
    await browser.close()
  }
}

loginTest()
```

### Example 2: Fill Multi-Step Form

Register for a service:

```javascript
async function registrationTest() {
  const browser = new WebBrowser()

  try {
    await browser.start()
    await browser.goto('https://example.com/register')

    // Step 1: Personal Information
    await browser.textbox('First Name').write('John')
    await browser.textbox('Last Name').write('Doe')
    await browser.textbox('Email').write('john@example.com')

    // Step 2: Choose Options
    await browser.radio('Basic Plan').set()
    await browser.checkbox('Subscribe to newsletter').check()

    // Step 3: Select from Dropdown
    await browser.dropdown('Country').option('United States').select()
    await browser.dropdown('State').option('California').select()

    // Accept terms and submit
    await browser.checkbox('I accept the terms').check()
    await browser.button('Create Account').click()

    // Verify success
    await browser.element('Account created successfully').should.be.visible()

    console.log('✅ Registration complete')
  } finally {
    await browser.close()
  }
}

registrationTest()
```

### Example 3: Table Interactions

Find and click in specific rows:

```javascript
async function tableTest() {
  const browser = new WebBrowser()

  try {
    await browser.start()
    await browser.goto('https://example.com/users')

    // Click edit button for specific user
    await browser.button('Edit').within.row('John Smith').click()

    // Verify edit form opened
    await browser.textbox('Name').should.be.visible()

    // Edit and save
    await browser.textbox('Name').write(' Jr.')
    await browser.button('Save').click()

    // Verify user was updated
    await browser.row('John Smith Jr.').should.be.visible()

    console.log('✅ User updated')
  } finally {
    await browser.close()
  }
}

tableTest()
```

### Example 4: Modal Dialog

Interact with popup windows:

```javascript
async function modalTest() {
  const browser = new WebBrowser()

  try {
    await browser.start()
    await browser.goto('https://example.com/dashboard')

    // Click button that opens modal
    await browser.button('Add Item').click()

    // Fill form inside modal
    await browser
      .textbox('Item Name')
      .within.dialog('Add Item')
      .write('Coffee Maker')
    await browser.textbox('Price').within.dialog('Add Item').write('49.99')

    // Click save in modal
    await browser.button('Save').within.dialog('Add Item').click()

    // Verify modal closed and item added
    await browser.dialog('Add Item').should.not.be.visible()
    await browser.element('Coffee Maker').should.be.visible()

    console.log('✅ Item added')
  } finally {
    await browser.close()
  }
}

modalTest()
```

### Example 5: Multiple Tabs

Working with multiple browser tabs:

```javascript
async function multiTabTest() {
  const browser = new WebBrowser()

  try {
    await browser.start()
    await browser.goto('https://example.com')

    // Open new tab (automatically switches to it)
    await browser.tab().new()
    await browser.goto('https://google.com')

    // Verify we're on Google (we're already on the new tab)
    const url = await browser.tab().get.url()
    console.log('Tab 1 URL:', url)

    // Switch back to first tab
    await browser.tab(0).switch()

    // Get first tab URL
    const homeUrl = await browser.tab(0).get.url()
    console.log('Tab 0 URL:', homeUrl)

    // Close current tab
    await browser.tab(1).close()

    console.log('✅ Multi-tab test complete')
  } finally {
    await browser.close()
  }
}

multiTabTest()
```

### Example 6: Conditional Logic

Make decisions based on element state:

```javascript
async function conditionalTest() {
  const browser = new WebBrowser()

  try {
    await browser.start()
    await browser.goto('https://example.com/account')

    // Check if user is premium
    const isPremium = await browser.element('Premium Badge').is.visible()

    if (isPremium) {
      console.log('User has premium account')
      await browser.button('Download Report').click()
    } else {
      console.log('User has free account')
      await browser.button('Upgrade Now').click()
    }

    console.log('✅ Conditional logic executed')
  } finally {
    await browser.close()
  }
}

conditionalTest()
```

---

## How Element Selection Works

WebBrowser finds elements like humans do - by what they say, where they are, or their type:

### 1. By Text (Most Common)

```javascript
// Finds button with text "Click Me"
await browser.button('Click Me').click()

// Finds textbox with placeholder "Enter email"
await browser.textbox('Enter email').write('...')
```

### 2. By Type & Text

```javascript
// Distinguishes between link and button with same text
await browser.link('Download').click()
await browser.button('Download').click()
```

### 3. By Position (Spatial References)

```javascript
// Find password field below email field
await browser.textbox('Password').below.textbox('Email').write('...')

// Find button to the right of label
await browser.button('Save').toRightOf.text('Auto-save').click()

// Find link inside modal
await browser.link('Close').within.dialog('Confirm').click()
```

Learn more: [SELECTORS.md](SELECTORS.md)

---

## Understanding Operations

WebBrowser has two types of operations:

### Intermediate Operations

**Build the selector (no action yet):**

```javascript
browser
  .button('Delete') // Select element
  .below // Add position filter
  .element('Actions') // Add anchor
```

### Terminal Operations

**Execute the action:**

```javascript
.click()              // Click the element
.write('text')        // Type text
.should.be.visible()  // Assert visible
.get.text()           // Get text content
```

**Full example with chaining:**

```javascript
await browser.button('Delete').below.element('Actions').click() // Terminal - executes everything above
```

Learn more: [CONCEPTS.md#operations-intermediate-vs-terminal](CONCEPTS.md#operations-intermediate-vs-terminal)

---

## Checking Element State

### Two Ways to Check State

**Option 1: Conditional (returns boolean)**

```javascript
const isVisible = await browser.element('Item').is.visible()

if (isVisible) {
  console.log('Item found!')
}
```

**Option 2: Assertion (throws error if false)**

```javascript
await browser.element('Item').should.be.visible()
// Test stops here if element not visible
```

### Common State Checks

```javascript
// Visibility
await browser.element('Item').is.visible()
await browser.element('Item').is.not.visible()

// Enabled/Disabled
await browser.button('Submit').is.enabled()
await browser.button('Submit').is.disabled()

// Checked/Unchecked
await browser.checkbox('Agree').is.checked()
await browser.checkbox('Agree').is.not.checked()
```

Learn more: [FORMS.md](FORMS.md)

---

## Common Element Types

WebBrowser supports 20+ element types for semantic selection:

| Type       | Usage                              |
| ---------- | ---------------------------------- |
| `button`   | `browser.button('Click')`          |
| `textbox`  | `browser.textbox('Email')`         |
| `checkbox` | `browser.checkbox('Agree')`        |
| `radio`    | `browser.radio('Option')`          |
| `link`     | `browser.link('Home')`             |
| `dropdown` | `browser.dropdown('Country')`      |
| `heading`  | `browser.heading('Title')`         |
| `dialog`   | `browser.dialog('Modal')`          |
| `row`      | `browser.row('John Doe')`          |
| `element`  | `browser.element('Any')` (generic) |

See [SELECTORS.md#element-types](SELECTORS.md#element-types) for complete list.

---

## Best Practices

### ✅ Do

- **Use semantic types:** `button()`, `textbox()` instead of generic `element()`
- **Target by visible text:** Match what users see
- **Use spatial context:** `.within.dialog()`, `.below.element()` when needed
- **Check state before acting:** Verify element exists before clicking
- **Chain operations:** Build readable fluent chains
- **Use `should.*` in tests:** Throw error on assertion failure

### ❌ Don't

- **Don't use XPath or CSS selectors:** Not supported - use text-based matching
- **Don't use generic `element()` for everything:** Use semantic types
- **Don't assume elements exist:** Always check visibility first
- **Don't over-use `or`:** Multiple alternatives are last resort

---

## Troubleshooting

**"Element not found" error?**

- Check if element text matches exactly (or use partial match)
- Try using spatial context: `.below.element()`, `.within.dialog()`
- See [SELECTORS.md](SELECTORS.md)

**"Timeout waiting for element"?**

- Increase timeout in config: `"timeout": 30`
- Or use explicit wait: `should.be.visible(60000)`
- Check if element is inside modal: `.within.dialog()`

**Browser not starting?**

- Check Chrome/Firefox is installed
- Verify config in `.config/selenium.json`
- See [CONFIGURATION.md](CONFIGURATION.md)

---

## Next Steps

1. **Learn fundamentals:** Read [CONCEPTS.md](CONCEPTS.md)
2. **Master element finding:** Study [SELECTORS.md](SELECTORS.md)
3. **Build your tests:** Use [INTERACTIONS.md](INTERACTIONS.md) + [FORMS.md](FORMS.md)
4. **Reference:** Check [API-REFERENCE.md](API-REFERENCE.md)
5. **Configure:** See [CONFIGURATION.md](CONFIGURATION.md)

## Documentation Map

| Document                             | Purpose                |
| ------------------------------------ | ---------------------- |
| [CONCEPTS.md](CONCEPTS.md)           | How it works           |
| [SELECTORS.md](SELECTORS.md)         | Finding elements       |
| [INTERACTIONS.md](INTERACTIONS.md)   | Clicking, typing, etc. |
| [FORMS.md](FORMS.md)                 | Form elements          |
| [BROWSER.md](BROWSER.md)             | Navigation, windows    |
| [ADVANCED.md](ADVANCED.md)           | Advanced patterns      |
| [API-REFERENCE.md](API-REFERENCE.md) | All methods            |
| [CONFIGURATION.md](CONFIGURATION.md) | Setup options          |

```json
{
  "browser": "chrome",
  "headless": true,
  "timeout": 30,
  "downloadsPath": "./downloads"
}
```

See [Configuration](CONFIGURATION.md) for all options.

## Need Help?

- Check [API Reference](API-REFERENCE.md) for method signatures
- Review example patterns in relevant guide (Selectors, Interactions, Forms, etc.)
- See [Core Concepts](CONCEPTS.md) for architectural understanding
