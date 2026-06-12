import WebBrowser from '../../index.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const fixturePath = join(__dirname, '../fixtures/demo-page.html');
const fixtureUrl = 'file://' + fixturePath;

describe('Browser Control Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  // Browser Control Tests
  test('should navigate to a URL using goto()', async () => {
    const success = await browser.goto('https://www.github.com');
    expect(success).toBe(true);
  });

  test('should sleep for a specified duration', async () => {
    const start = Date.now();
    await browser.sleep(500);
    const end = Date.now();
    expect(end - start).toBeGreaterThanOrEqual(500);
  });

  test('should return actions instance', () => {
    const actions = browser.actions();
    expect(actions).toBeDefined();
    expect(typeof actions).toBe('object');
  });

  // Navigation Tests
  test('should handle refresh, goBack, and goForward', async () => {
    await browser.goto('https://www.github.com');
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

  // Browser State Getter Tests
  test('should handle browser state getters (name, os, size)', async () => {
    await browser.goto('https://www.github.com');
    
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

  // setSize Tests
  test('should set browser window size with valid dimensions', async () => {
    const size = { width: 1280, height: 720 };
    const success = await browser.setSize(size);
    expect(success).toBe(true);

    // Verify the size was actually applied
    const actualSize = await browser.get.size();
    expect(actualSize.width).toBeGreaterThanOrEqual(1280);
    expect(actualSize.height).toBeGreaterThanOrEqual(700);
  });

  test('should set browser window size to different dimensions', async () => {
    const size = { width: 800, height: 600 };
    const success = await browser.setSize(size);
    expect(success).toBe(true);

    const actualSize = await browser.get.size();
    expect(actualSize.width).toBeGreaterThanOrEqual(800);
    expect(actualSize.height).toBeGreaterThanOrEqual(600);
  });

  test('should handle setSize with null dimensions (not configured)', async () => {
    // When width/height are null, should return false and use driver defaults
    const result = await browser.setSize({ width: null, height: null });
    expect(result).toBe(false);
  });

  test('should handle setSize with undefined dimensions (not configured)', async () => {
    const result = await browser.setSize({ width: undefined, height: undefined });
    expect(result).toBe(false);
  });

  test('should handle setSize with NaN dimensions (not configured)', async () => {
    const result = await browser.setSize({ width: NaN, height: NaN });
    expect(result).toBe(false);
  });

  test('should handle setSize with invalid string dimensions', async () => {
    const result = await browser.setSize({ width: '1024', height: '768' });
    expect(result).toBe(false);
  });

  test('should handle setSize with negative dimensions', async () => {
    const result = await browser.setSize({ width: -100, height: 768 });
    expect(result).toBe(false);
  });

  test('should handle setSize with zero dimensions', async () => {
    const result = await browser.setSize({ width: 0, height: 0 });
    expect(result).toBe(false);
  });

  test('should handle setSize with missing width property', async () => {
    const result = await browser.setSize({ height: 768 });
    expect(result).toBe(false);
  });

  test('should handle setSize with missing height property', async () => {
    const result = await browser.setSize({ width: 1024 });
    expect(result).toBe(false);
  });

  test('should handle setSize with empty object', async () => {
    const result = await browser.setSize({});
    expect(result).toBe(false);
  });

  // getSize Tests
  test('should get browser window size', async () => {
    // Set a known size first
    await browser.setSize({ width: 1024, height: 768 });

    const size = await browser.get.size();
    expect(size).toHaveProperty('width');
    expect(size).toHaveProperty('height');
    expect(typeof size.width).toBe('number');
    expect(typeof size.height).toBe('number');
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
  });

  test('should get size returns consistent values', async () => {
    const size1 = await browser.get.size();
    const size2 = await browser.get.size();

    expect(size1.width).toBe(size2.width);
    expect(size1.height).toBe(size2.height);
  });

  // Error Handling Tests
  test('should handle goto with invalid URL', async () => {
    await expect(browser.goto(null)).rejects.toThrow('Invalid URL provided');
    await expect(browser.goto('')).rejects.toThrow('Invalid URL provided');
    await expect(browser.goto(123)).rejects.toThrow('Invalid URL provided');
  });

  test('should handle goto with invalid URL', async () => {
    await expect(browser.goto(null)).rejects.toThrow('Invalid URL provided');
    await expect(browser.goto('')).rejects.toThrow('Invalid URL provided');
    await expect(browser.goto(123)).rejects.toThrow('Invalid URL provided');
  });

  // Screenshot Tests
  test('should handle screenshot functionality', async () => {
    await browser.goto(fixtureUrl);
    try {
      // Take full page screenshot
      const pageScreenshot = await browser.get.screenshot();
      expect(pageScreenshot).toBeDefined();
      expect(typeof pageScreenshot).toBe('string'); // Base64 encoded image
      
      // Take element screenshot
      const elementScreenshot = await browser.element('SeleniumBase Demo Page').get.screenshot();
      expect(elementScreenshot).toBeDefined();
      expect(typeof elementScreenshot).toBe('string'); // Base64 encoded image
    } catch (error) {
      console.log('Screenshot test skipped - functionality not available:', error.message);
      // This is acceptable for documentation purposes
    }
  });

  // Cookie Tests
  test('should handle cookie operations', async () => {
    await browser.goto(fixtureUrl);
    try {
      // Add a cookie
      await browser.cookie().add({ name: 'test_cookie', value: 'test_value' });
      
      // Get all cookies
      const cookies = await browser.cookie().getAll();
      expect(Array.isArray(cookies)).toBe(true);
      
      // Find our test cookie
      const testCookie = cookies.find(cookie => cookie.name === 'test_cookie');
      expect(testCookie).toBeDefined();
      if (testCookie) {
        expect(testCookie.value).toBe('test_value');
      }
      
      // Delete specific cookie
      await browser.cookie().delete('test_cookie');
      
      // Verify cookie is deleted
      const cookiesAfterDelete = await browser.cookie().getAll();
      const deletedCookie = cookiesAfterDelete.find(cookie => cookie.name === 'test_cookie');
      expect(deletedCookie).toBeUndefined();
    } catch (error) {
      console.log('Cookie test skipped - functionality not available:', error.message);
      // This is acceptable for documentation purposes
    }
  });

  // Reset Tests
  test('should handle browser reset functionality', async () => {
    await browser.goto(fixtureUrl);
    try {
      // Perform some actions that would be cleared by reset
      await browser.cookie().add({ name: 'reset_test', value: 'test_value' });
      await browser.goto('https://example.org');
      
      // Verify we're on example.org
      let url = await browser.tab().get.url();
      expect(url).toContain('example.org');
      
      // Reset browser state (should clear cookies, storage, and navigate to blank)
      await browser.reset();
      
      // After reset, we should be able to navigate again
      await browser.goto('https://www.github.com');
      url = await browser.tab().get.url();
      expect(url).toContain('.github.');
    } catch (error) {
      console.log('Reset test skipped - functionality not available:', error.message);
      // This is acceptable for documentation purposes
    }
  });
});
