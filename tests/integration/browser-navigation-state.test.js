import WebBrowser from '../../index.js';

describe('Browser Navigation and State Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should handle refresh, goBack, and goForward', async () => {
    await browser.goto('https://www.google.com');
    const initialTitle = await browser.get.title();
    
    // Test refresh
    await browser.refresh();
    const refreshTitle = await browser.get.title();
    expect(refreshTitle).toBe(initialTitle);

    // Navigate to another page to test back/forward
    await browser.goto('https://www.wikipedia.org');
    const wikiTitle = await browser.get.title();
    
    // Test goBack
    const backSuccess = await browser.goBack();
    expect(backSuccess).toBe(true);
    const backTitle = await browser.get.title();
    expect(backTitle).toBe(initialTitle);

    // Test goForward
    const forwardSuccess = await browser.goForward();
    expect(forwardSuccess).toBe(true);
    const forwardTitle = await browser.get.title();
    expect(forwardTitle).toBe(wikiTitle);
  });

  test('should handle browser state getters (name, os, size)', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    
    const name = await browser.get.name();
    expect(typeof name).toBe('string');
    expect(name.length).toBeGreaterThan(0);

    const os = await browser.get.os();
    expect(typeof os).toBe('string');
    expect(os.length).toBeGreaterThan(0);

    const size = await browser.get.size();
    expect(size).toHaveProperty('width');
    expect(size).toHaveProperty('height');
    expect(typeof size.width).toBe('number');
    expect(typeof size.height).toBe('number');
  });

  test('should handle setSize with invalid input', async () => {
    // Test with null
    const resultNull = await browser.setSize(null);
    expect(resultNull).toBe(false);

    // Test with invalid object
    const resultInvalid = await browser.setSize({ width: '1024', height: '768' });
    expect(resultInvalid).toBe(false);

    // Test with NaN
    const resultNaN = await browser.setSize({ width: NaN, height: 768 });
    expect(resultNaN).toBe(false);
  });

  test('should handle goto with invalid URL', async () => {
    await expect(browser.goto(null)).rejects.toThrow('Invalid URL provided');
    await expect(browser.goto('')).rejects.toThrow('Invalid URL provided');
    await expect(browser.goto(123)).rejects.toThrow('Invalid URL provided');
  });
});
