import WebBrowser from '../../index.js';

describe('WebBrowser Drag and Drop Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should handle drag and drop operations', async () => {
    // Using a page that supports drag and drop
    await browser.goto('https://the-internet.herokuapp.com/drag_and_drop');

    // Perform drag and drop using the fluent API
    await browser.drag.element('A').onto.element('B').drop();

    // Re-query elements after the swap to avoid stale element references
    // The library matches by id attribute, so 'column-a' finds id="column-a"
    const textA = await browser.element('column-a').get.text();
    const textB = await browser.element('column-b').get.text();

    expect(textA).toBe('B');
    expect(textB).toBe('A');
  });

  test('should check checkbox and drag item to dropzone 2 on selenium demo page', async () => {
    // Navigate to the selenium demo page
    await browser.goto('https://seleniumbase.io/demo_page');

    // Check checkbox1 (ID is 'checkBox1')
    await browser.checkbox('checkBox1').check();

    // Drag selenium draggable item into dropzone 2
    // Based on browser analysis: draggable ID is 'logo', dropzone ID is 'drop2'
    await browser.drag.element('logo').onto.element('drop2').drop();

    // Verification (assuming the dropzone text changes or contains the item)
    await browser.element('logo').within.element('drop2').should.be.visible();
  });
});