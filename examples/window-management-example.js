/**
 * Window Management Example
 * 
 * This example demonstrates various window management features
 * of the @nodebug/selenium library.
 * 
 * @example
 * node examples/window-management-example.js
 */

import WebBrowser from '../index.js'

const browser = new WebBrowser()

async function runExample() {
  try {
    console.log('Starting Window Management example...')
    
    // Start the browser
    await browser.start()
    console.log('Browser started')

    // Navigate to a test page
    await browser.goto('https://www.google.com')
    console.log('Navigated to Google')

    // Get current window size
    const currentSize = await browser.get.size()
    console.log(`Current window size: ${currentSize.width}x${currentSize.height}`)

    // Set window size
    await browser.setSize({ width: 1200, height: 800 })
    console.log('Window size set to 1200x800')

    // Get new window size
    const newSize = await browser.get.size()
    console.log(`New window size: ${newSize.width}x${newSize.height}`)

    // Maximize window
    await browser.window().maximize()
    console.log('Window maximized')

    // Minimize window (if supported)
    await browser.window().minimize()
    console.log('Window minimized')

    // Restore window
    await browser.window().maximize()
    console.log('Window restored')

    // Get browser name and OS
    const browserName = await browser.get.name()
    const osName = await browser.get.os()
    console.log(`Browser: ${browserName}, OS: ${osName}`)

    // Get current URL
    const currentUrl = await browser.window().get.url()
    console.log(`Current URL: ${currentUrl}`)

    // Get page title
    const title = await browser.window().get.title()
    console.log(`Page title: ${title}`)

    // Get console errors
    const errors = await browser.consoleErrors()
    console.log(`Console errors found: ${errors.length}`)

    // Close the browser
    await browser.close()
    console.log('\nWindow Management example completed successfully!')
    
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