/**
 * JavaScript Alerts Example
 * 
 * This example demonstrates how to interact with JavaScript alerts
 * on the-internet.herokuapp.com/javascript_alerts page.
 * 
 * @example
 * node examples/javascript-alerts-example.js
 */

import WebBrowser from '../index.js'

const browser = new WebBrowser()

async function runExample() {
  try {
    console.log('Starting JavaScript Alerts example...')
    
    // Start the browser
    await browser.start()
    console.log('Browser started')

    // Navigate to the JavaScript alerts page
    await browser.goto('http://the-internet.herokuapp.com/javascript_alerts')
    console.log('Navigated to JavaScript alerts page')
    
    // Get page title to verify we're on the right page
    const title = await browser.window().get.title()
    console.log(`Page title: ${title}`)

    // Test JS Alert
    console.log('\n--- Testing JS Alert ---')
    await browser.window().get.url()
    await browser.sleep(1000)
    // Click the JS Alert button
    await browser.element('Click for JS Alert').click()
    await browser.sleep(1000) 
    // Accept the alert
    await browser.alert().accept()
    console.log('JS Alert accepted')

    // Test JS Confirm
    console.log('\n--- Testing JS Confirm ---')
    await browser.sleep(1000)
    // Click the JS Confirm button
    await browser.element('Click for JS Confirm').click()
    await browser.sleep(1000)
    // Accept the confirm dialog
    await browser.alert().dismiss()
    console.log('JS Confirm dismissed')

    // Click the JS Prompt button
    await browser.element('Click for JS Prompt').click()
    await browser.sleep(1000)
    // Send text to the prompt and accept
    await browser.alert().write('Hello World')
    await browser.alert().dismiss()
    await browser.element('You entered: Hello World').isNotDisplayed()
    console.log('JS Prompt dismissed without message')

        // Click the JS Prompt button
    await browser.element('Click for JS Prompt').click()
    await browser.sleep(1000)
    // Send text to the prompt and accept
    await browser.alert().write('Hello World')
    await browser.alert().accept()
    await browser.element('You entered: Hello World').isDisplayed()
    console.log('JS Prompt accepted with message')


    await browser.element('Click for JS Prompt').click()
    await browser.sleep(1000)
    // Send text to the prompt and accept
    await browser.alert().write('Hello Again')
    await browser.alert().accept()
    await browser.element('You entered: Hello Again').isDisplayed()
    console.log('JS Prompt accepted with message')

    // Get console errors
    const errors = await browser.consoleErrors()
    console.log(`\nConsole errors found: ${errors.length}`)

    // Close the browser
    await browser.close()
    console.log('\nJavaScript Alerts example completed successfully!')
    
  } catch (error) {
    console.error('Error:', error.message)
    console.error(error.stack)
    
    try {
      // Try to close the browser if it's still open
      await browser.close()
    } catch (closeError) {
      console.error('Error closing browser:', closeError.message)
    }
  }
}

// Run the example
runExample()