/**
 * Simple example showing how to launch and close a browser
 * using the repository's WebBrowser class
 */

// Import the WebBrowser class
import WebBrowser from './index.js';

async function launchAndCloseBrowser() {
  console.log('Starting browser automation example...');
  
  // Create a new browser instance
  const browser = new WebBrowser();
  
  try {
    // Launch the browser
    console.log('Launching browser...');
    await browser.start();
    console.log('Browser launched successfully!');
    
    // Get browser information
    const browserName = await browser.name();
    console.log(`Browser type: ${browserName}`);
    
    // Wait a bit to show the browser is running
    console.log('Browser is running. Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Close the browser
    console.log('Closing browser...');
    await browser.close();
    console.log('Browser closed successfully!');
    
    console.log('Example completed successfully!');
    
  } catch (error) {
    console.error('Error during browser automation:', error);
    // Ensure browser is closed even if there's an error
    try {
      await browser.close();
    } catch (closeError) {
      console.error('Error closing browser:', closeError);
    }
    throw error;
  }
}

// Run the example
launchAndCloseBrowser().catch(console.error);