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
    const jsAlertButton = await browser.driver.findElement(
      browser.driver.By.xpath("//button[text()='Click for JS Alert']")
    )
    await jsAlertButton.click()
    
    // Wait for alert to appear
    await browser.sleep(1000)
    
    // Accept the alert
    await browser.alert().accept()
    console.log('JS Alert accepted')

    // Test JS Confirm
    console.log('\n--- Testing JS Confirm ---')
    await browser.sleep(1000)
    
    // Click the JS Confirm button
    const jsConfirmButton = await browser.driver.findElement(
      browser.driver.By.xpath("//button[text()='Click for JS Confirm']")
    )
    await jsConfirmButton.click()
    
    // Wait for confirm dialog to appear
    await browser.sleep(1000)
    
    // Accept the confirm dialog
    await browser.alert().accept()
    console.log('JS Confirm accepted')

    // Test JS Prompt
    console.log('\n--- Testing JS Prompt ---')
    await browser.sleep(1000)
    
    // Click the JS Prompt button
    const jsPromptButton = await browser.driver.findElement(
      browser.driver.By.xpath("//button[text()='Click for JS Prompt']")
    )
    await jsPromptButton.click()
    
    // Wait for prompt dialog to appear
    await browser.sleep(1000)
    
    // Send text to the prompt and accept
    await browser.alert('Test prompt message').text()
    await browser.alert().accept()
    console.log('JS Prompt accepted with message')

    // Get console errors
    const errors = await browser.consoleErrors()
    console.log(`\nConsole errors found: ${errors.length}`)

    // Close the browser
    await browser.close()
    console.log('\nExample completed successfully!')
    
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