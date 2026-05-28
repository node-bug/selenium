import WebBrowser from './index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

async function runDemo() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const fixturePath = join(__dirname, 'tests/fixtures/drag-drop.html');
  const fixtureUrl = 'file://' + fixturePath;

  const browser = new WebBrowser();

  try {
    // Start the browser
    await browser.start();
    console.log('Browser started successfully');

    // Navigate to the demo page
    await browser.goto(fixtureUrl);
    console.log('Navigated to demo page');

    // Wait a moment to see the result
    await new Promise(resolve => setTimeout(resolve, 1000));

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Close the browser
    await browser.close();
    console.log('Browser closed');
  }
}

runDemo();

// async function demo2() {
//   const __filename = fileURLToPath(import.meta.url);
//   const __dirname = dirname(__filename);
//   const fixturePath = join(__dirname, 'tests/fixtures/interactive-elements.html');
//   const fixtureUrl = 'file://' + fixturePath;
//
//   const browser = new WebBrowser();
//   await browser.start();
//   console.log('Browser started successfully');
//
//   // Navigate to the demo page
//   await browser.goto(fixtureUrl);
//   console.log('Navigated to demo page');
//
//   // await browser
//   //   .textbox('Below heading')
//   //   .below.element('spatial-heading')
//   //   .should.be.visible();
//
//   try{
//     await browser.button('Hidden Button').click()
//   } catch (err){
//     console.log(err.message)
//   }
//
//   await browser.close();
//   console.log('Browser closed');
// }

// demo2()