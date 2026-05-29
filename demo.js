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

    // Add a tag first
    await browser.drag.element('Item 1').onto.element('Item 3').drop();
    await browser.element('Item 2').above.element('Item 1').should.be.visible()
    await browser.element('Item 2').above.element('Item 3').should.be.visible()
    await browser.element('some element').above.element('skills-container').should.be.visible()
    await browser.element('some element').within.element('skills-container').is.visible()
    await browser.element('×').within.element('Python').within.element('skills-container').should.be.visible()
    await browser.element('×').within.element('Python').within.element('skills-container').click()
    await browser.element('Python').within.element('skills-container').should.not.be.visible()

    // Validate: get all elements within skills container and check if JavaScript is visible
    await browser.element('×').within.element('JavaScript').within.element('skills-container').is.visible()
    await browser.element('×').within.element('JavaScript').within.element('skills-container').click()
    console.log('\n--- Validating JavaScript element in skills container ---');

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
