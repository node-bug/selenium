/**
 * Demo script to demonstrate using the WebBrowser repository
 * to navigate to a page and enter text into a field
 */

import WebBrowser from './index.js';

async function demo() {
  console.log('Starting demo script...');
  
  // Create a new browser instance
  const browser = new WebBrowser();
  
  try {
    // Start a new browser session
    console.log('Starting browser session...');
    await browser.start();
    
    // Navigate to the demo page
    console.log('Navigating to https://seleniumbase.io/demo_page...');
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Wait for page to load
    console.log('Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Enter text into the text input field 'myTextInput'
    console.log('Entering "Hello World" into text input field...');
    await browser.element('myTextInput').write('Hello World');
    
    console.log('Demo completed successfully!');
    
    // Optionally, we can verify the text was entered
    console.log('Verifying text was entered...');
    const text = await browser.element('myTextInput').get.text();
    console.log(`Text in field: "${text}"`);
    
  } catch (error) {
    console.error('Error during demo:', error);
  } finally {
    // Close the browser session
    console.log('Closing browser session...');
    await browser.close();
  }
}

/**
 * Comprehensive demo script showing various features of the WebBrowser repository
 */

async function comprehensiveDemo() {
  console.log('Starting comprehensive demo script...');
  
  // Create a new browser instance
  const browser = new WebBrowser();
  
  try {
    // Start a new browser session
    console.log('Starting browser session...');
    await browser.start();
    
    // Navigate to the demo page
    console.log('Navigating to https://seleniumbase.io/demo_page...');
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Wait for page to load
    console.log('Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Demo 1: Enter text into text input field
    console.log('\n=== Demo 1: Text Input ===');
    await browser.element('myTextInput').write('Hello World');
    const text1 = await browser.element('myTextInput').get.text();
    console.log(`Text entered: "${text1}"`);
    
    // Demo 2: Using textbox method
    console.log('\n=== Demo 2: Textbox Method ===');
    await browser.textbox('myTextInput').write('Hello from textbox method');
    const text2 = await browser.textbox('myTextInput').get.text();
    console.log(`Text entered: "${text2}"`);
    
    // Demo 3: Find element and get its properties
    console.log('\n=== Demo 3: Finding Elements ===');
    const element = await browser.element('myTextInput').find();
    console.log(`Found element with tag: ${element.tagName}`);
    
    // Demo 4: Get attribute value
    console.log('\n=== Demo 4: Get Attribute ===');
    const value = await browser.element('myTextInput').get.attribute('value');
    console.log(`Value attribute: "${value}"`);
    
    // Demo 5: Find all matching elements
    console.log('\n=== Demo 5: Find All Elements ===');
    const allInputs = await browser.element('input').findAll();
    console.log(`Found ${allInputs.length} input elements`);
    
    // Demo 6: Clear text from input
    console.log('\n=== Demo 6: Clear Text ===');
    await browser.element('myTextInput').clear();
    const clearedText = await browser.element('myTextInput').get.text();
    console.log(`Text after clearing: "${clearedText}"`);
    
    // Demo 7: Refresh the page
    console.log('\n=== Demo 7: Refresh Page ===');
    await browser.refresh();
    console.log('Page refreshed');
    
    // Demo 8: Navigate back in history
    console.log('\n=== Demo 8: Go Back ===');
    await browser.goBack();
    console.log('Navigated back');
    
    // Demo 9: Navigate forward in history
    console.log('\n=== Demo 9: Go Forward ===');
    await browser.goForward();
    console.log('Navigated forward');
    
    console.log('\n=== All demos completed successfully! ===');
    
  } catch (error) {
    console.error('Error during demo:', error);
  } finally {
    // Close the browser session
    console.log('\nClosing browser session...');
    await browser.close();
  }
}

/**
 * Advanced demo showing navigation methods after text entry
 */
async function advancedDemo() {
  console.log('\n=== Advanced Demo: Navigation After Text Entry ===');
  
  // Create a new browser instance
  const browser = new WebBrowser();
  
  try {
    // Start a new browser session
    console.log('Starting browser session...');
    await browser.start();
    
    // Navigate to the demo page
    console.log('Navigating to https://seleniumbase.io/demo_page...');
    await browser.goto('https://seleniumbase.io/demo_page');
    
    // Wait for page to load
    console.log('Waiting for page to load...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Enter text into the text input field 'myTextInput'
    console.log('Entering "Hello World" into text input field...');
    await browser.element('myTextInput').write('Hello World');
    
    // Verify text was entered
    const text = await browser.element('myTextInpu').get.text();
    console.log(`Text entered: "${text}"`);
    
    // Show that we can navigate away and come back
    console.log('\nNavigating to a different page...');
    await browser.goto('https://www.google.com');
    
    console.log('\nGoing back to the demo page...');
    await browser.goBack();
    
    // Verify text is still there after navigation
    const textAfterNavigation = await browser.element('myTextInput').get.text();
    console.log(`Text after navigation: "${textAfterNavigation}"`);
    
    console.log('\nAdvanced demo completed successfully!');
    
  } catch (error) {
    console.error('Error during advanced demo:', error);
  } finally {
    // Close the browser session
    console.log('\nClosing browser session...');
    await browser.close();
  }
}

// Run the comprehensive demo
comprehensiveDemo();

// Run the advanced demo
advancedDemo();

// Run the demo
demo();