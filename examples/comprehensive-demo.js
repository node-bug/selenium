/**
 * Comprehensive demo script showing various features of the @nodebug/selenium library
 * This demonstrates interaction with the SeleniumBase demo page
 */

import WebBrowser from '../index.js';

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
    
    // Demo 1: Text Input and Textarea
    console.log('\n=== Demo 1: Text Input and Textarea ===');
    await browser.element('myTextInput').write('Hello World');
    const text1 = await browser.element('myTextInput').get.text();
    console.log(`Text entered in input: "${text1}"`);
    
    await browser.element('myTextarea').write('This is a textarea test\nWith multiple lines');
    const text2 = await browser.element('myTextarea').get.text();
    console.log(`Text entered in textarea: "${text2}"`);
    
    // Demo 2: Button Interaction
    console.log('\n=== Demo 2: Button Interaction ===');
    await browser.button('Click Me (Green)').click();
    console.log('Clicked the green button');
    
    // Demo 3: Checkbox and Radio Button
    console.log('\n=== Demo 3: Checkbox and Radio Button ===');
    await browser.checkbox('myCheckbox').check();
    console.log('Checked checkbox');
    
    await browser.checkbox('myCheckbox').uncheck();
    console.log('Unchecked checkbox');
    
    // Demo 4: Dropdown Selection
    console.log('\n=== Demo 4: Dropdown Selection ===');
    await browser.element('mySelect').select('Set to 75%');
    console.log('Selected "Set to 75%" from dropdown');
    
    // Demo 5: Slider Control
    console.log('\n=== Demo 5: Slider Control ===');
    await browser.element('mySlider').set(75);
    console.log('Set slider to 75');
    
    // Demo 6: Image and Link Interaction
    console.log('\n=== Demo 6: Image and Link Interaction ===');
    await browser.image('myImage').click();
    console.log('Clicked on image');
    
    await browser.link('seleniumbase.com').click();
    console.log('Clicked on link');
    
    // Demo 7: Element Visibility and State Checks
    console.log('\n=== Demo 7: Element Visibility and State Checks ===');
    const isVisible = await browser.element('myTextInput').isVisible();
    console.log(`Text input is visible: ${isVisible}`);
    
    const isDisplayed = await browser.element('myTextInput').isDisplayed();
    console.log(`Text input is displayed: ${isDisplayed}`);
    
    // Demo 8: Element Positioning and Spatial Navigation
    console.log('\n=== Demo 8: Element Positioning ===');
    const element = await browser.element('myTextInput').find();
    console.log(`Found element with tag: ${element.tagName}`);
    
    // Demo 9: Attribute and Text Retrieval
    console.log('\n=== Demo 9: Attribute and Text Retrieval ===');
    const value = await browser.element('myTextInput').get.attribute('value');
    console.log(`Value attribute: "${value}"`);
    
    const placeholder = await browser.element('myTextInput').get.attribute('placeholder');
    console.log(`Placeholder attribute: "${placeholder}"`);
    
    // Demo 10: Form Reset and Clear
    console.log('\n=== Demo 10: Form Reset and Clear ===');
    await browser.element('myTextInput').clear();
    console.log('Cleared text input');
    
    // Demo 11: Hover Effect
    console.log('\n=== Demo 11: Hover Effect ===');
    await browser.element('hoverDropdown').hover();
    console.log('Hovered over dropdown');
    
    // Demo 12: Window and Tab Management
    console.log('\n=== Demo 12: Window Management ===');
    const windowInfo = await browser.window().getInfo();
    console.log(`Window info: ${JSON.stringify(windowInfo)}`);
    
    // Demo 13: Navigation History
    console.log('\n=== Demo 13: Navigation History ===');
    await browser.refresh();
    console.log('Refreshed page');
    
    console.log('\n=== All demos completed successfully! ===');
    
  } catch (error) {
    console.error('Error during demo:', error);
    throw error;
  } finally {
    // Close the browser session
    console.log('Closing browser session...');
    await browser.close();
  }
}

// Run the demo
comprehensiveDemo().then(() => {
  console.log('Comprehensive demo completed successfully!');
}).catch((error) => {
  console.error('Comprehensive demo failed:', error);
  process.exit(1);
});