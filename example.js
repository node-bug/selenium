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
    let isDisplayed

    // Start the browser session
    await browser.start();
    const browserName = await browser.name();
    const osName = await browser.os();
    // await browser.setSize({ width: 1280, height: 800 });
    await browser.goto('https://www.google.com');
    // const currentUrl = await browser.tab().get.url();
    // const pageTitle = await browser.tab().get.title();
    // await browser.sleep(1000);

    // isDisplayed = await browser.tab('Google').isDisplayed();
    // console.log(`✓ Current tab is displayed: ${isDisplayed}`);

    // isDisplayed = await browser.tab('Wikipedia').isDisplayed();
    // console.log(`✓ Current tab is displayed: ${isDisplayed}`);

    // try {
    //   await browser.tab('Wikipedia').switch();
    // } catch (error) {
    //   console.log(`✗ Error checking tab display: ${error.message}`);
    // }

    // try {
    //   await browser.tab('Google').switch();
    // } catch (error) {
    //   console.log(`✗ Error switching tab: ${error.message}`);
    // }

    // await browser.tab().new();
    // await browser.goto('https://www.wikipedia.org');
    // const newWindowUrl = await browser.tab().get.url();

    // isDisplayed = await browser.tab('Wikipedia').isDisplayed();
    // console.log(`✓ Current tab is displayed: ${isDisplayed}`);

    // isDisplayed = await browser.tab('Google').isDisplayed();
    // console.log(`✓ Current tab is displayed: ${isDisplayed}`);

    // try {
    //   await browser.tab('Google').switch();
    //   await browser.sleep(1000);
    // } catch (error) {
    //   console.log(`✗ Error switching tab: ${error.message}`);
    // }

    // try {
    //   await browser.tab('Wikipedia').switch();
    //   await browser.sleep(1000);
    // } catch (error) {
    //   console.log(`✗ Error checking tab display: ${error.message}`);
    // }

    // try {
    //   await browser.tab('Google').switch();
    //   await browser.sleep(1000);
    // } catch (error) {
    //   console.log(`✗ Error checking tab display: ${error.message}`);
    // }

    // const wikipediaUrl = await browser.tab().get.url();
    // await browser.tab().close();

    // try {
    //   await browser.tab('Google').switch();
    //   await browser.sleep(1000);
    // } catch (error) {
    //   console.log(`✗ Error checking tab display: ${error.message}`);
    // }

    // isDisplayed = await browser.tab('Google').isDisplayed();
    // console.log(`✓ Current tab is displayed: ${isDisplayed}`);

    await browser.tab().new();
    await browser.goto('https://www.wikipedia.org');
    isDisplayed = await browser.tab(0).isDisplayed();
    isDisplayed = await browser.tab("test").isDisplayed();
    console.log(`✓ Current tab is displayed: ${isDisplayed}`);

    let switched = await browser.tab(0).switch();
    console.log(`✓ Switched to tab index 0: ${switched}`);

    let url = await browser.tab().get.url();
    console.log(`✓ Current URL after switching to index 0: ${url}`);

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