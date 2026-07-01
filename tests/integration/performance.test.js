import { log } from '@nodebug/logger';
import WebBrowser from '../../index.js';

describe('WebBrowser Performance Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should measure page load performance', async () => {
    const startTime = Date.now();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/element-state.html`);
    const endTime = Date.now();
    const loadTime = endTime - startTime;

    // Log performance metrics
    log.info(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(10000); // Should load within 10 seconds
  });

  test('should measure page refresh performance', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/element-state.html`);

    const startTime = Date.now();
    await browser.refresh();
    const endTime = Date.now();
    const refreshTime = endTime - startTime;

    log.info(`Page refresh time: ${refreshTime}ms`);
    expect(refreshTime).toBeLessThan(10000);
  });
});