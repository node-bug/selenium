import { describe, beforeAll, afterAll, test, expect, vi } from 'vitest';
import WebBrowser from '../../index.js';

/**
 * Integration tests for the `_isNotVisible` "wait until gone" semantics.
 *
 * DESIGN (app/command-delegates/visibility-delegate.js, `_isNotVisible`):
 *   while (Date.now() < endTime) {
 *     try {
 *       await browser._finder(1000);
 *       notVisible = false; // element present/visible
 *     } catch {
 *       notVisible = true;   // element absent -> definitive answer
 *       break;              // stop polling, return true fast
 *     }
 *   }
 *
 * So `is.not.visible()` is a *"wait until the element is gone"* operation:
 *   - Element ABSENT  -> `_finder` throws -> `notVisible = true`, `break` -> returns `true` fast.
 *   - Element PRESENT -> `_finder` succeeds -> `notVisible = false`, NO break -> busy-loops
 *     until the timeout, then returns `false`.
 *
 * These tests spy on `browser._finder` to count invocations and measure elapsed
 * time, confirming the absent-element path breaks immediately (no busy-loop) while
 * the present-element path polls to the timeout.
 */
describe('VisibilityDelegate._isNotVisible (wait until gone)', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/element-state.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('absent element: is.not.visible() returns true and breaks immediately (no busy-loop)', async () => {
    // Spy on the real finder so we can count how many times the loop re-invokes it.
    const finderSpy = vi.spyOn(browser, '_finder');

    const start = Date.now();
    const result = await browser.element('NonExistentElement').is.not.visible(3000);
    const elapsed = Date.now() - start;

    // The element is absent, so "is not visible" must be true.
    expect(result).toBe(true);

    // FIXED behavior: _finder is called exactly once (throws, loop breaks).
    // A busy-loop would call it hundreds of times until the timeout.
    expect(finderSpy.mock.calls.length).toBeLessThanOrEqual(3);

    // FIXED behavior: returns almost immediately. A busy-loop would spin for 3000ms.
    expect(elapsed).toBeLessThan(2000);

    finderSpy.mockRestore();
  });

  test('absent element: should.not.be.visible() resolves quickly (no busy-loop)', async () => {
    const finderSpy = vi.spyOn(browser, '_finder');

    const start = Date.now();
    // The element is absent, so the assertion "should NOT be visible" must resolve.
    await expect(browser.element('NonExistentElement').should.not.be.visible(3000)).resolves.toBeUndefined();
    const elapsed = Date.now() - start;

    // FIXED: single _finder call (throws, loop breaks). BUGGY: busy-loop until timeout.
    expect(finderSpy.mock.calls.length).toBeLessThanOrEqual(3);
    expect(elapsed).toBeLessThan(2000);

    finderSpy.mockRestore();
  });

  test('present element: is.not.visible() returns false after polling to the timeout', async () => {
    // The element IS visible, so "is not visible" must be false. With the
    // "wait until gone" design, the loop keeps polling (the element may disappear
    // later) until the timeout and only then returns false.
    const finderSpy = vi.spyOn(browser, '_finder');

    const start = Date.now();
    const result = await browser.button('Click Me').is.not.visible(3000);
    const elapsed = Date.now() - start;

    expect(result).toBe(false);

    // The present-element path polls to the timeout rather than breaking early.
    expect(elapsed).toBeGreaterThanOrEqual(2500);

    // Many finder attempts are expected while busy-polling a present element.
    expect(finderSpy.mock.calls.length).toBeGreaterThan(3);

    finderSpy.mockRestore();
  });

  test('present element: should.not.be.visible() rejects after polling to the timeout', async () => {
    const finderSpy = vi.spyOn(browser, '_finder');

    const start = Date.now();
    // The element is visible, so the assertion "should NOT be visible" must reject.
    await expect(browser.button('Click Me').should.not.be.visible(3000)).rejects.toThrow();
    const elapsed = Date.now() - start;

    // The present-element path polls to the timeout before rejecting.
    expect(elapsed).toBeGreaterThanOrEqual(2500);
    expect(finderSpy.mock.calls.length).toBeGreaterThan(3);

    finderSpy.mockRestore();
  });

  test('late-appearing element: is.not.visible() returns false once found (polls to timeout)', async () => {
    // Inject a button into the DOM after a 1.5s delay. Once the element appears,
    // is.not.visible() sets notVisible=false and keeps polling until the timeout
    // (it waits for the element to possibly disappear), then returns false.
    await browser.driver.executeScript(`
      const container = document.getElementById('dynamic-container');
      container.innerHTML = '';
      setTimeout(() => {
        const btn = document.createElement('button');
        btn.id = 'late-button';
        btn.textContent = 'Late Button';
        container.appendChild(btn);
      }, 1500);
    `);

    const start = Date.now();
    const result = await browser.button('Late Button').is.not.visible(4000);
    const elapsed = Date.now() - start;

    expect(result).toBe(false);

    // The element appears at ~1.5s, then the loop polls to the 4s timeout.
    expect(elapsed).toBeGreaterThanOrEqual(3500);
  });
});
