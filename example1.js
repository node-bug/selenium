/**
 * Comprehensive consolidated example demonstrating all WebBrowser features
 * This example covers browser information, window management, navigation,
 * console errors, and browser state management
 */

 
import WebBrowser from './index.js';

async function runConsolidatedExample() {
  console.log('Starting consolidated browser automation example...\n');

  const browser = new WebBrowser();

  try {
    // ============================================
    // 1. Browser Session Initialization
    // ============================================
    console.log('=== Browser Session Initialization ===');
    await browser.start();
    console.log('✓ Browser session started');

    // Get browser information
    const browserName = await browser.name();
    const osName = await browser.os();
    console.log(`✓ Browser: ${browserName}`);
    console.log(`✓ OS: ${osName}`);

    // ============================================
    // 2. Window Management
    // ============================================
    console.log('\n=== Window Management ===');

    // Set initial window size
    await browser.setSize({ width: 1280, height: 800 });
    const size = await browser.getSize();
    console.log(`✓ Initial window size: ${size.width}x${size.height}`);

    // Navigate to a URL
    await browser.goto('https://www.google.com');
    const currentUrl = await browser.window.get.url();
    const pageTitle = await browser.window.get.title();
    console.log(`✓ Navigated to: ${currentUrl}`);
    console.log(`✓ Page title: ${pageTitle}`);

    // Wait for page to load
    await browser.sleep(1000);

    // Demonstrate window maximize
    console.log('\n--- Maximizing window ---');
    await browser.window.maximize();
    console.log('✓ Window maximized');
    await browser.sleep(1000);

    // Demonstrate window minimize
    console.log('\n--- Minimizing window ---');
    await browser.window.minimize();
    console.log('✓ Window minimized');
    await browser.sleep(1000);

    // Restore window
    console.log('\n--- Restoring window ---');
    await browser.setSize({ width: 1280, height: 800 });
    console.log('✓ Window restored to 1280x800');

    // Demonstrate fullscreen
    console.log('\n--- Switching to fullscreen ---');
    await browser.window.fullscreen();
    console.log('✓ Window in fullscreen mode');
    await browser.sleep(1000);

    // Restore window size
    console.log('\n--- Restoring window size ---');
    await browser.setSize({ width: 1280, height: 800 });
    console.log('✓ Window restored to 1280x800');

    // ============================================
    // 3. Navigation Features
    // ============================================
    console.log('\n=== Navigation Features ===');

    // Navigate to Wikipedia
    await browser.goto('https://www.wikipedia.org');
    console.log(`✓ Navigated to Wikipedia`);
    await browser.sleep(1000);

    // Go back
    await browser.goBack();
    console.log('✓ Navigated back to Google');
    await browser.sleep(1000);

    // Go forward
    await browser.goForward();
    console.log('✓ Navigated forward to Wikipedia');
    await browser.sleep(1000);

    // Refresh page
    await browser.refresh();
    console.log('✓ Page refreshed');
    await browser.sleep(1000);

    // ============================================
    // 4. Sleep Functionality
    // ============================================
    console.log('\n=== Sleep Functionality ===');
    console.log('Waiting 2000ms...');
    await browser.sleep(2000);
    console.log('✓ Wait completed');

    // ============================================
    // 5. Console Errors
    // ============================================
    console.log('\n=== Console Errors ===');
    const errors = await browser.consoleErrors();
    if (errors.length > 0) {
      console.log(`✓ Found ${errors.length} console error(s)`);
      errors.forEach((error, index) => {
        console.log(`  Error ${index + 1}: ${error.message}`);
      });
    } else {
      console.log('✓ No console errors found');
    }

    // ============================================
    // 6. Browser State Management
    // ============================================
    console.log('\n=== Browser State Management ===');

    // Demonstrate browser reset
    console.log('--- Resetting browser state ---');
    await browser.reset();
    console.log('✓ Browser state reset (cookies, storage cleared)');

    // Navigate to a new URL
    await browser.goto('https://example.com');
    console.log(`✓ Navigated to example.com`);

    // Get current state
    const finalUrl = await browser.window.get.url();
    const finalTitle = await browser.window.get.title();
    console.log(`✓ Final URL: ${finalUrl}`);
    console.log(`✓ Final title: ${finalTitle}`);

    // ============================================
    // 7. Final Verification
    // ============================================
    console.log('\n=== Final Verification ===');
    const finalSize = await browser.getSize();
    console.log(`✓ Final window size: ${finalSize.width}x${finalSize.height}`);

    // Close the browser
    await browser.close();
    console.log('✓ Browser closed successfully');

  } catch (error) {
    console.error('\n✗ Error during consolidated example:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run the example
runConsolidatedExample().catch(console.error);

 