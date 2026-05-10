import WebBrowser from '../../index.js';

describe('WebBrowser Navigation Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should navigate to a URL and refresh the page', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    const titleBefore = await browser.get.title();
    await browser.refresh();
    const titleAfter = await browser.get.title();
    expect(titleBefore).toBe(titleAfter);
  });

  test('should navigate back and forward in history', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    await browser.goto('https://www.google.com');
    
    await browser.goBack();
    expect(await browser.get.url()).toContain('seleniumbase.io');
    
    await browser.goForward();
    expect(await browser.get.url()).toContain('google.com');
  });

  test('should reset browser state', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // Set a dummy cookie or local storage item if possible, 
    // but since we are in a high-level wrapper, we test the navigation to about:blank
    await browser.reset();
    expect(await browser.get.url()).toBe('about:blank');
  });
});
