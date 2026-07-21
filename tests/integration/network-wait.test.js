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

  describe('Regex Pattern Matching (Bug: waitForRequest mis-detects flagged regexes)', () => {
    test('should match request by plain string pattern', async () => {
      // Control: a plain string pattern works today.
      await browser.button('Make API Request').click();

      const result = await browser.network.wait.for.request('data:', 10000);
      expect(result).toBe(true);
    });

    test('should match request by regex without flags', async () => {
      // Control: a regex WITHOUT flags (/API/) is detected correctly even with
      // the current string-inspection logic, because its toString() is '/API/'
      // (starts and ends with '/'). This proves only *flagged* regexes break.
      await browser.button('Make API Request').click();

      const result = await browser.network.wait.for.request(/API/, 10000);
      expect(result).toBe(true);
    });

    test('should match request by regex with flags (BUG)', async () => {
      // Bug-confirming: a regex WITH flags (/api/i) is mis-detected. Its
      // toString() is '/api/i', which starts with '/' but ends with 'i', so the
      // current code treats it as the literal substring '/api/i' and never
      // matches the uppercase 'API' URL. This test FAILS with the current code.
      await browser.button('Make API Request').click();

      const result = await browser.network.wait.for.request(/api/i, 10000);
      expect(result).toBe(true);
    });
  });
});