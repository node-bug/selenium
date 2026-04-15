/**
 * Example demonstrating tab management features
 * using the repository's WebBrowser class
 * This example showcases isDisplayed and switch functions
 */

/* eslint-disable */
import WebBrowser from './index.js';

async function runTabManagementExample() {
  console.log('Starting tab management example...\n');

  const browser = new WebBrowser();

  try {
    // Start the browser session
    await browser.start();
    const browserName = await browser.name();
    const osName = await browser.os();
    await browser.setSize({ width: 1280, height: 800 });
    await browser.goto('https://www.google.com');
    const currentUrl = await browser.tab.get.url();
    const pageTitle = await browser.tab.get.title();
    await browser.sleep(1000);

    let isDisplayed = await browser.tab.title('Google').isDisplayed();
    console.log(`✓ Current tab is displayed: ${isDisplayed}`);

    isDisplayed = await browser.tab.title('Wikipedia').isDisplayed();
    console.log(`✓ Current tab is displayed: ${isDisplayed}`);

    try {
      await browser.tab.title('Wikipedia').switch();
    } catch (error) {
      console.log(`✗ Error checking tab display: ${error.message}`);
    }

    try {
      await browser.tab.title('Google').switch();
    } catch (error) {
      console.log(`✗ Error switching tab: ${error.message}`);
    }

    await browser.tab.new();
    await browser.goto('https://www.wikipedia.org');
    const newWindowUrl = await browser.tab.get.url();

    isDisplayed = await browser.tab.title('Wikipedia').isDisplayed();
    console.log(`✓ Current tab is displayed: ${isDisplayed}`);

    isDisplayed = await browser.tab.title('Google').isDisplayed();
    console.log(`✓ Current tab is displayed: ${isDisplayed}`);

    try {
      await browser.tab.title('Google').switch();
      await browser.sleep(1000);
    } catch (error) {
      console.log(`✗ Error switching tab: ${error.message}`);
    }

    try {
      await browser.tab.title('Wikipedia').switch();
      await browser.sleep(1000);
    } catch (error) {
      console.log(`✗ Error checking tab display: ${error.message}`);
    }

    try {
      await browser.tab.title('Google').switch();
      await browser.sleep(1000);
    } catch (error) {
      console.log(`✗ Error checking tab display: ${error.message}`);
    }

    const wikipediaUrl = await browser.tab.get.url();
    await browser.tab.close();

    try {
      await browser.tab.title('Google').switch();
      await browser.sleep(1000);
    } catch (error) {
      console.log(`✗ Error checking tab display: ${error.message}`);
    }

    isDisplayed = await browser.tab.title('Google').isDisplayed();
    console.log(`✓ Current tab is displayed: ${isDisplayed}`);

    await browser.close();
  } catch (error) {
    console.error('\n✗ Error during tab management example:', error.message);
    console.error(error.stack);
    throw error;
  }
}

// Run the example
runTabManagementExample().catch(console.error);

/* eslint-enable */