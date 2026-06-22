import WebBrowser from '../../index.js';

/**
 * Tests for the `onscreen` selector modifier.
 *
 * The onscreen filter restricts results to elements whose bounding box
 * intersects the current viewport, mirroring the `hidden` modifier
 * for visibility filtering.
 *
 * Uses the existing demo-page.html fixture. By pinning the viewport to a
 * small size (400x400), the page content overflows naturally:
 *   - "Click Me (Green)" near the top is always in-viewport
 *   - "Submit Form" near the bottom is always out-of-viewport
 */
describe('WebBrowser Onscreen Modifier', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    // Pin a small viewport so the demo page is taller than the visible area
    await browser.setSize({ width: 400, height: 400 });
    await browser.goto(`file://${process.cwd()}/tests/fixtures/demo-page.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    // Reset scroll position before every test so viewport state is deterministic
    await browser.scroll.to.top();
    await browser.sleep(150);
  });

  test('finds on-screen button by default', async () => {
    const btn = await browser.button('Click Me (Green)').find();
    expect(btn).toBeDefined();
    expect(btn.inViewport).toBe(true);
  });

  test('finds off-screen button by default (no onscreen filter applied)', async () => {
    // The Submit Form button is near the bottom of the page; it still resolves
    // because the default search ignores viewport position.
    const btn = await browser.button('Submit Form').find();
    expect(btn).toBeDefined();
    expect(btn.inViewport).toBe(false);
  });

  test('does not return off-screen elements when onscreen modifier is set', async () => {
    await expect(
      browser.onscreen.button('Submit Form').find()
    ).rejects.toThrow();
  });

  test('finds onscreen element that is currently in viewport', async () => {
    const btn = await browser.onscreen.button('Click Me (Green)').find();
    expect(btn).toBeDefined();
    expect(btn.inViewport).toBe(true);
  });

  test('onscreen modifier can be chained with generic element() type', async () => {
    const el = await browser.onscreen.element('Click Me (Green)').find();
    expect(el).toBeDefined();
  });

  test('onscreen modifier can be combined with exact flag', async () => {
    const btn = await browser.onscreen.exact.button('Click Me (Green)').find();
    expect(btn).toBeDefined();
  });

  test('onscreen modifier respects scroll position', async () => {
    // At the top: Submit Form is filtered out
    await expect(
      browser.onscreen.button('Submit Form').find()
    ).rejects.toThrow();

    // Scroll to the bottom so Submit Form enters the viewport
    await browser.scroll.to.bottom();
    await browser.sleep(150);

    const btn = await browser.onscreen.button('Submit Form').find();
    expect(btn).toBeDefined();
    expect(btn.inViewport).toBe(true);
  });
});