/**
 * Drag and Drop Example
 * 
 * This example demonstrates drag and drop functionality
 * using the @nodebug/selenium library.
 * 
 * @example
 * node examples/drag-and-drop-example.js
 */

import WebBrowser from '../index.js'

const browser = new WebBrowser()

async function runExample() {
  try {
    console.log('Starting Drag and Drop example...')
    
    // Start the browser
    await browser.start()
    console.log('Browser started')

    // Navigate to a page with draggable elements
    await browser.goto('https://seleniumbase.io/demo_page')
    console.log('Navigated to demo page')

    // Test basic drag and drop
    console.log('\n--- Testing Basic Drag and Drop ---')
    
    // Perform drag and drop using the fluent API
    await browser.element('draggable').drag().onto().element('droppable').drop()
    console.log('Drag and drop completed')

    // Test with different elements
    console.log('\n--- Testing Another Drag and Drop ---')
    await browser.element('drag-item-2').drag().onto().element('drop-target-2').drop()
    console.log('Second drag and drop completed')

    // Get console errors
    const errors = await browser.consoleErrors()
    console.log(`\nConsole errors found: ${errors.length}`)

    // Close the browser
    await browser.close()
    console.log('\nDrag and Drop example completed successfully!')
    
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
