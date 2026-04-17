/**
 * Spatial Positioning Example
 * 
 * This example demonstrates spatial/relative element positioning
 * features of the @nodebug/selenium library, including finding
 * elements above, below, to the left, to the right, within,
 * and near other elements.
 * 
 * @example
 * node examples/spatial-positioning-example.js
 */

import WebBrowser from '../index.js'

const browser = new WebBrowser()

async function runExample() {
  try {
    console.log('Starting Spatial Positioning example...')
    
    // Start the browser
    await browser.start()
    console.log('Browser started')

    // Navigate to a page with positioned elements
    await browser.goto('https://seleniumbase.io/demo_page')
    console.log('Navigated to demo page')

    // Test element above
    console.log('\n--- Testing Element Above ---')
    await browser.element('target-element').above().find()
    console.log('Found element above target')

    // Test element below
    console.log('\n--- Testing Element Below ---')
    await browser.element('target-element').below().find()
    console.log('Found element below target')

    // Test element to the left
    console.log('\n--- Testing Element to Left ---')
    await browser.element('target-element').toLeftOf().find()
    console.log('Found element to the left of target')

    // Test element to the right
    console.log('\n--- Testing Element to Right ---')
    await browser.element('target-element').toRightOf().find()
    console.log('Found element to the right of target')

    // Test element within
    console.log('\n--- Testing Element Within ---')
    await browser.element('container').within().element('inner-element').find()
    console.log('Found element within container')

    // Test element near
    console.log('\n--- Testing Element Near ---')
    await browser.element('target-element').near().find()
    console.log('Found element near target')

    // Test exact matching
    console.log('\n--- Testing Exact Matching ---')
    await browser.element('exact text').exact().find()
    console.log('Found element with exact text match')

    // Test hidden elements
    console.log('\n--- Testing Hidden Elements ---')
    await browser.element('hidden-element').hidden().find()
    console.log('Found hidden element')

    // Test OR condition
    console.log('\n--- Testing OR Condition ---')
    await browser.element('text1').or().element('text2').find()
    console.log('Found element using OR condition')

    // Test at index
    console.log('\n--- Testing At Index ---')
    await browser.element('item').atIndex(2).find()
    console.log('Found second occurrence of element')

    // Get console errors
    const errors = await browser.consoleErrors()
    console.log(`\nConsole errors found: ${errors.length}`)

    // Close the browser
    await browser.close()
    console.log('\nSpatial Positioning example completed successfully!')
    
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
runExample()
