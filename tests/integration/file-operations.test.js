import WebBrowser from '../../index.js';
import fs from 'fs';
import path from 'path';

describe('WebBrowser File Operations Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should handle file upload', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/interactive-elements.html`);
    
    // Create a temporary file for testing
    const testFilePath = path.join(process.cwd(), 'test-file.txt');
    fs.writeFileSync(testFilePath, 'This is a test file for upload');
    
    // Upload file to the first file input
    await browser.file(1).upload(testFilePath);
    // Verify upload succeeded
    const fileName = await browser.file(1).get.text();
    expect(fileName).toContain('test-file.txt');
    
    // Clean up
    fs.unlinkSync(testFilePath);
  });
});