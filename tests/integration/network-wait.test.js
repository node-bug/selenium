import { beforeAll, afterAll, beforeEach, describe, test, expect } from 'vitest';
import WebBrowser from '../../index.js';

describe('Network Wait Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    // Fresh page and fresh monitoring for each test
    await browser.goto(`file://${process.cwd()}/tests/fixtures/network-test.html`);
    await browser.network.inject();
  });

  describe('AJAX (XHR) Waiting', () => {
    test('should wait for XHR requests to complete', async () => {
      // Click the XHR button to start a request
      await browser.button('Make XHR Request').click();

      // Wait for AJAX requests to complete
      const result = await browser.network.wait.for.ajax(10000);
      expect(result).toBe(true);
    });
  });

  describe('Fetch Waiting', () => {
    test('should wait for fetch requests to complete', async () => {
      // Click the fetch button to start a request
      await browser.button('Make Fetch Request').click();

      // Wait for fetch requests to complete
      const result = await browser.network.wait.for.fetch(10000);
      expect(result).toBe(true);
    });
  });

  describe('All Network Requests Waiting', () => {
    test('should wait for all network requests to complete', async () => {
      // Click the both button to start both XHR and fetch requests
      await browser.button('Make Both Requests').click();

      // Wait for all network requests to complete
      const result = await browser.network.wait.for.all(10000);
      expect(result).toBe(true);
    });
  });

  describe('Specific Request Waiting', () => {
    test('should wait for specific request by URL pattern', async () => {
      // Click the XHR button to start a request
      await browser.button('Make XHR Request').click();

      // Wait for specific request (blob: URLs are used in the fixture)
      const result = await browser.network.wait.for.request('blob:', 10000);
      expect(result).toBe(true);
    });
  });
});