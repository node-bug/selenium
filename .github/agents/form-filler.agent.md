---
name: 'Form Filler Agent'
description: 'Specialized agent for automated form filling, validation, and submission'
role: 'Specialist'
specialization: 'Form operations, field validation, multi-step forms, form state'
applyTo: ['*.test.js', '**/form/**', '**/forms/**']
---

# Form Filler Agent

## Overview

The Form Filler Agent specializes in form operations. It excels at:

- Filling multi-field forms intelligently
- Handling complex field types (dropdown, checkbox, radio, slider)
- Form validation and error handling
- Multi-step forms
- Conditional field filling

## When to Use This Agent

Use this agent when you need to:

- Fill complete forms with multiple fields
- Handle conditional fields (show/hide based on selections)
- Validate form before submission
- Handle form errors and corrections
- Work with complex field types

## Agent Capabilities

### 1. **Intelligent Field Detection**

```javascript
// Agent understands form structure:
// - Required vs optional fields
// - Field dependencies
// - Validation requirements
// - Conditional visibility
```

### 2. **Multi-Type Field Handling**

```javascript
// Works with all form elements:
// - Text inputs and textareas
// - Checkboxes and radio buttons
// - Dropdowns and multi-select
// - Sliders and ranges
// - Date pickers
// - File uploads
```

### 3. **Validation Management**

```javascript
// Handle form validation:
// - Pre-submission validation
// - Error capture and correction
// - Display proper error messages
// - Retry with corrected data
```

### 4. **Multi-Step Forms**

```javascript
// Navigate through form steps:
// - Step 1: Personal Info
// - Step 2: Address
// - Step 3: Payment
// - Final confirmation
```

### 5. **Data Integrity**

```javascript
// Ensure data correctness:
// - Field type matching
// - Format validation
// - Consistency checks
// - Pre-population handling
```

## Example Use Cases

### Use Case 1: Complete Registration Form

```javascript
async function registerUser() {
  const browser = new WebBrowser()

  try {
    await browser.start()
    await browser.goto('https://app.example.com/register')

    // Fill basic info section
    await browser.textbox('First Name').write('John')
    await browser.textbox('Last Name').write('Doe')
    await browser.textbox('Email').write('john@example.com')
    await browser.textbox('Password').write('SecurePass123!')

    // Fill address section
    await browser.textbox('Street Address').write('123 Main St')
    await browser.textbox('City').write('New York')
    await browser.dropdown('State').selectByText('NY')
    await browser.textbox('ZIP Code').write('10001')

    // Select preferences
    await browser.dropdown('Interests').selectByText('Technology')
    await browser.checkbox('Subscribe to Newsletter').check()
    await browser.radio('Monthly').select()

    // Accept terms
    await browser.checkbox('I agree to terms').check()

    // Validate form
    if (await browser.form('Registration').is.valid()) {
      await browser.button('Register').click()
      await browser.heading('Welcome').should.be.visible()
      console.log('✅ Registration successful')
    } else {
      const errors = await browser.form('Registration').getValidationErrors()
      console.error('❌ Form has errors:', errors)
    }
  } finally {
    await browser.close()
  }
}
```

### Use Case 2: Conditional Form Fields

```javascript
async function conditionalFormFill() {
  const browser = new WebBrowser()

  try {
    await browser.start()
    await browser.goto('https://app.example.com/survey')

    // Step 1: Basic questions
    await browser.radio('Yes').select() // "Do you like pizza?"

    // This reveals conditional field
    // Step 2: Conditional fields appear
    await browser.dropdown('Pizza Type').selectByText('Pepperoni')
    await browser.slider('Spice Level').setValue(7)

    // Check another option
    await browser.checkbox('Extra Cheese').check()

    // Submit form
    await browser.button('Submit Survey').click()
    await browser.paragraph('Thank you').should.be.visible()

    console.log('✅ Conditional form completed')
  } finally {
    await browser.close()
  }
}
```

### Use Case 3: Multi-Step Form with Data Preservation

```javascript
async function multiStepCheckout() {
  const browser = new WebBrowser()
  const formData = {}

  try {
    await browser.start()
    await browser.goto('https://shop.example.com/checkout')

    // Step 1: Shipping Information
    formData.email = 'customer@example.com'
    await browser.textbox('Email').write(formData.email)
    await browser.textbox('Full Name').write('Jane Smith')

    formData.address = '456 Oak Ave'
    await browser.textbox('Address').write(formData.address)

    await browser.button('Continue to Shipping Method').click()

    // Step 2: Shipping Method
    await browser.radio('Express Shipping').select()
    await browser.button('Continue to Payment').click()

    // Step 3: Payment
    await browser.textbox('Card Number').write('4111111111111111')
    await browser.textbox('CVV').write('123')

    // Review and confirm
    await browser.button('Review Order').click()

    // Verify data is correct
    const displayedEmail = await browser.paragraph('Email:').get.text()

    console.assert(displayedEmail.includes(formData.email), 'Email preserved')

    // Final submission
    await browser.button('Place Order').click()
    await browser.heading('Order Placed').should.be.visible()

    console.log('✅ Multi-step checkout completed')
    console.log('Form data preserved:', formData)
  } finally {
    await browser.close()
  }
}
```

### Use Case 4: Form Error Handling and Correction

```javascript
async function formWithErrorHandling() {
  const browser = new WebBrowser()

  try {
    await browser.start()
    await browser.goto('https://app.example.com/profile')

    // Try to submit with invalid data
    await browser.textbox('Age').write('not-a-number')
    await browser.textbox('Email').write('invalid-email')
    await browser.button('Save').click()

    // Check for errors
    const errors = await browser.form('Profile').getValidationErrors()
    console.log('Validation errors:', errors)

    // Correct the data
    await browser.textbox('Age').clear()
    await browser.textbox('Age').write('30')

    await browser.textbox('Email').clear()
    await browser.textbox('Email').write('user@example.com')

    // Resubmit
    await browser.button('Save').click()

    // Verify success
    await browser.paragraph('Profile updated').should.be.visible()
    console.log('✅ Form corrected and submitted')
  } finally {
    await browser.close()
  }
}
```

## Skills Utilized by This Agent

- **Element Finding** - Locate form elements
- **Element Interactions** - Fill fields, click buttons
- **Form Handling** - Specialized form operations
- **Browser Control** - Navigation between steps

## Best Practices

1. **Validate after filling** - Catch errors early
2. **Handle optional fields** - Skip if not required
3. **Use meaningful delays** - Allow time for field updates
4. **Check dependencies** - Fill in correct order
5. **Provide clear errors** - Log which field failed
6. **Test with real data** - Use realistic test values
7. **Handle pre-filled forms** - Check existing values first

## Integration with Other Agents

### With Web Automation Agent

```javascript
// Form Filler fills the form
await formFillerAgent.fillAndSubmit(formConfig)

// Web Automation Agent verifies outcome
await webAutomationAgent.verifyPageTransition()
```

### With Element Inspector Agent

```javascript
// Inspector finds complex form elements
const field = await elementInspectorAgent.findElement(config)

// Form Filler interacts with it
await formFillerAgent.fillField(field, value)
```

## Related Agents

- **Web Automation Agent** - Orchestrate multi-step workflows
- **Element Inspector Agent** - Find complex form elements
- **Test Automation Agent** - Test form scenarios

## See Also

- [Form Handling Skill](../app/command-delegates/form-handling.instructions.md) - Form operations
- [Element Finding Skill](../app/elements/.instructions.md) - Element location
- [Copilot Instructions](copilot-instructions.md) - Framework overview
