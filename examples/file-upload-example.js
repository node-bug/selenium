/**
 * File Upload Example
 * 
 * This example demonstrates file upload functionality
 * using the @nodebug/selenium library.
 * 
 * @example
 * node examples/file-upload-example.js
 */

import WebBrowser from '../index.js'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const browser = new WebBrowser()

async function runExample() {
  try {
    console.log('Starting File Upload example...')
    
    // Start the browser
    await browser.start()
    console.log('Browser started')

    // Navigate to a page with file upload
    await browser.goto('https://seleniumbase.io/demo_page')
    console.log('Navigated to demo page')

    // Test file upload
    console.log('\n--- Testing File Upload ---')
    
    // Create a test file
    const testFilePath = resolve(__dirname, 'test-upload.txt')
    const fs = await import('fs')
    
    // Write test content to file
    fs.writeFileSync(testFilePath, 'This is a test file for upload demonstration.')
    console.log(`Created test file at: ${testFilePath}`)

    // Upload the file
    await browser.element('fileUpload').upload(testFilePath)
    console.log('File uploaded successfully')

    // Verify upload
    const fileInputValue = await browser.element('fileUpload').attribute('value')
    console.log(`File input value: ${fileInputValue}`)

    // Clean up - delete the test file
    fs.unlinkSync(testFilePath)
    console.log('Test file cleaned up')

    // Get console errors
    const errors = await browser.consoleErrors()
    console.log(`\nConsole errors found: ${errors.length}`)

    // Close the browser
    await browser.close()
    console.log('\nFile Upload example completed successfully!')
    
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
