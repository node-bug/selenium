/**
 * Form Interaction Example
 * 
 * This example demonstrates various form interaction features
 * of the @nodebug/selenium library, including filling forms,
 * checking/unchecking checkboxes, selecting options from dropdowns,
 * and submitting forms.
 * 
 * @example
 * node examples/form-interaction-example.js
 */

import WebBrowser from '../index.js'

const browser = new WebBrowser()

async function runExample() {
  try {
    console.log('Starting Form Interaction example...')
    
    // Start the browser
    await browser.start()
    console.log('Browser started')

    // Navigate to a form page
    await browser.goto('https://seleniumbase.io/demo_page')
    console.log('Navigated to demo page')

    // Test text input
    console.log('\n--- Testing Text Input ---')
    await browser.element('myTextInput').write('Test User')
    const inputText = await browser.element('myTextInput').text()
    console.log(`Input text: ${inputText}`)

    // Test checkbox
    console.log('\n--- Testing Checkbox ---')
    await browser.element('checkBox1').check()
    console.log('Checkbox checked')
    
    // Test radio button
    console.log('\n--- Testing Radio Button ---')
    await browser.element('radioOption1').check()
    console.log('Radio button selected')

    // Test dropdown selection
    console.log('\n--- Testing Dropdown ---')
    await browser.element('mySelect').select('Option 1')
    console.log('Dropdown option selected')

    // Test button click
    console.log('\n--- Testing Button Click ---')
    await browser.element('myButton').click()
    console.log('Button clicked')

    // Test hover
    console.log('\n--- Testing Hover ---')
    await browser.element('myTextInput').hover()
    console.log('Hovered over element')

    // Test scroll
    console.log('\n--- Testing Scroll ---')
    await browser.element('myTextInput').scroll()
    console.log('Scrolled to element')

    // Test focus
    console.log('\n--- Testing Focus ---')
    await browser.element('myTextInput').focus()
    console.log('Focused on element')

    // Test clear
    console.log('\n--- Testing Clear ---')
    await browser.element('myTextInput').clear()
    const clearedText = await browser.element('myTextInput').text()
    console.log(`Cleared text: '${clearedText}'`) // Should be empty

    // Test overwrite
    console.log('\n--- Testing Overwrite ---')
    await browser.element('myTextInput').overwrite('New Value')
    const overwrittenText = await browser.element('myTextInput').text()
    console.log(`Overwritten text: ${overwrittenText}`)

    // Test element visibility
    console.log('\n--- Testing Element Visibility ---')
    const isVisible = await browser.element('myTextInput').isVisible()
    console.log(`Element is visible: ${isVisible}`)

    // Test element displayed (wait for visibility)
    console.log('\n--- Testing Element Displayed ---')
    await browser.element('myTextInput').isDisplayed()
    console.log('Element is displayed')

    // Get console errors
    const errors = await browser.consoleErrors()
    console.log(`\nConsole errors found: ${errors.length}`)

    // Close the browser
    await browser.close()
    console.log('\nForm Interaction example completed successfully!')
    
  } catch (error) {
    console.error('Error in Form Interaction example:', error)
    try {
      // Try to close the browser if it's still open
      await browser.stop()
    } catch (closeError) {
      console.error('Error closing browser:', closeError.message)
    }
    process.exit(1)
  }
}

// Run the example
runExample()
