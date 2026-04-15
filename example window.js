/**
 * Example demonstrating window management features
 * using the repository's WebBrowser class
 * This example showcases isDisplayed and switch functions
 */

/* eslint-disable */
import WebBrowser from './index.js';

async function runWindowManagementExample() {
  console.log('Starting window management example...\n');

  const browser = new WebBrowser();

  try {
    // Start the browser session
    await browser.start();
    const browserName = await browser.name();
    const osName = await browser.os();
    await browser.setSize({ width: 1280, height: 800 });
    await browser.goto('https://www.google.com');
    const currentUrl = await browser.window.get.url();
    const pageTitle = await browser.window.get.title();
    await browser.sleep(1000);

    let isDisplayed = await browser.window.title('Google').isDisplayed();
    console.log(`✓ Current window is displayed: ${isDisplayed}`);

    isDisplayed = await browser.window.title('Wikipedia').isDisplayed();
    console.log(`✓ Current window is displayed: ${isDisplayed}`);

    try {
      await browser.window.title('Wikipedia').switch();
    } catch (error) {
      console.log(`✗ Error checking window display: ${error.message}`);
    }

    try {
      await browser.window.title('Google').switch();
    } catch (error) {
      console.log(`✗ Error switching window: ${error.message}`);
    }

    await browser.window.new();
    await browser.goto('https://www.wikipedia.org');
    const newWindowUrl = await browser.window.get.url();

    isDisplayed = await browser.window.title('Wikipedia').isDisplayed();
    console.log(`✓ Current window is displayed: ${isDisplayed}`);

    isDisplayed = await browser.window.title('Google').isDisplayed();
    console.log(`✓ Current window is displayed: ${isDisplayed}`);

    try {
      await browser.window.title('Google').switch();
      await browser.sleep(1000);
    } catch (error) {
      console.log(`✗ Error switching window: ${error.message}`);
    }

    try {
      await browser.window.title('Wikipedia').switch();
      await browser.sleep(1000);
    } catch (error) {
      console.log(`✗ Error checking window display: ${error.message}`);
    }

    try {
      await browser.window.title('Google').switch();
      await browser.sleep(1000);
    } catch (error) {
      console.log(`✗ Error checking window display: ${error.message}`);
    }

    const wikipediaUrl = await browser.window.get.url();
    await browser.window.close();

    try {
      await browser.window.title('Google').switch();
      await browser.sleep(1000);
    } catch (error) {
      console.log(`✗ Error checking window display: ${error.message}`);
    }

    isDisplayed = await browser.window.title('Google').isDisplayed();
    console.log(`✓ Current window is displayed: ${isDisplayed}`);

    await browser.close();
  } catch (error) {
    console.error('\n✗ Error during window management example:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run the example
runWindowManagementExample().catch(console.error);

/* eslint-enable */