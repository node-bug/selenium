/**
 * Tab Management Example
 * 
 * This example demonstrates various tab management features
 * of the @nodebug/selenium library.
 * 
 * @example
 * node examples/tab-management-example.js
 */

import WebBrowser from '../index.js'

const browser = new WebBrowser()

async function runExample() {
  try {
    console.log('Starting Tab Management example...')
    
    // Start the browser
    await browser.start()
    console.log('Browser started')

    // Navigate to a test page
    await browser.goto('https://www.google.com')
    console.log('Navigated to Google')

    // Open a new tab
    await browser.tab().new()
    console.log('New tab opened')

    // Navigate to another page in the new tab
    await browser.goto('https://www.github.com')
    console.log('Navigated to GitHub')

    // Get current tab URL
    const currentUrl = await browser.tab().get.url()
    console.log(`Current tab URL: ${currentUrl}`)

    // Get current tab title
    const currentTitle = await browser.tab().get.title()
    console.log(`Current tab title: ${currentTitle}`)

    // Switch to the first tab
    await browser.tab(0).switch()
    console.log('Switched to first tab')

    // Get URL of first tab
    const firstTabUrl = await browser.tab().get.url()
    console.log(`First tab URL: ${firstTabUrl}`)

    // Switch back to the second tab
    await browser.tab(1).switch()
    console.log('Switched to second tab')

    // Get URL of second tab
    const secondTabUrl = await browser.tab().get.url()
    console.log(`Second tab URL: ${secondTabUrl}`)

    // Close the second tab
    await browser.tab(1).close()
    console.log('Second tab closed')

    // Get console errors
    const errors = await browser.consoleErrors()
    console.log(`Console errors found: ${errors.length}`)

    // Close the browser
    await browser.close()
    console.log('\nTab Management example completed successfully!')
    
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