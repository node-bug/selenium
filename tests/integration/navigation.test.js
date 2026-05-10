import WebBrowser from '../../index.js';

describe('WebBrowser Navigation Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should navigate to the demo page and verify heading', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    await browser.heading('SeleniumBase Demo Page').should.be.visible();
  });

  test('should interact with a link', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    await browser.element('seleniumbase.com').click();
    // Verify we navigated away from the demo page
    const url = await browser.tab().get.url();
    expect(url).toContain('seleniumbase.com');
  });
});