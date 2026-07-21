import WebBrowser from '../../index.js';

describe('Element State Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/element-state.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should assert element is not visible', async () => {
    await browser.element('NonExistentElement').should.not.be.visible();
  });

  test('should check enabled/disabled state', async () => {
    const isDisabled = await browser.button('Click Me').is.disabled();
    expect(typeof isDisabled).toBe('boolean');
    
    const isEnabled = await browser.button('Click Me').is.enabled();
    expect(typeof isEnabled).toBe('boolean');
    
    await browser.button('Click Me').should.be.enabled();
  });

  test('should return false for is.enabled() on non-existent element (no early throw)', async () => {
    // BUG: is.enabled() currently throws after ~1s (handleError re-throws) instead of
    // retrying until timeout and resolving to false. This test documents the bug and
    // will pass once visibility-delegate.js is fixed.
    await expect(browser.element('NonExistentElement').is.enabled()).resolves.toBe(false);
  });

  test('should return false for is.disabled() on non-existent element (no early throw)', async () => {
    // BUG: is.disabled() currently throws after ~1s (handleError re-throws) instead of
    // retrying until timeout and resolving to false. This test documents the bug and
    // will pass once visibility-delegate.js is fixed.
    await expect(browser.element('NonExistentElement').is.disabled()).resolves.toBe(false);
  });

  test('should retry until timeout for is.enabled() on late-appearing element', async () => {
    // Inject a button into the DOM after a 2s delay to prove is.enabled() retries
    // until the full timeout rather than throwing after the first ~1s attempt.
    await browser.driver.executeScript(`
      const container = document.getElementById('dynamic-container');
      container.innerHTML = '';
      setTimeout(() => {
        const btn = document.createElement('button');
        btn.id = 'late-button';
        btn.textContent = 'Late Button';
        container.appendChild(btn);
      }, 2000);
    `);

    // BUG: currently is.enabled() throws after ~1s because the first _finder(1000)
    // attempt rejects and the error escapes the retry loop. Once fixed, it should
    // resolve to true within the 5000ms timeout after the element appears.
    const isEnabled = await browser.button('Late Button').is.enabled(5000);
    expect(isEnabled).toBe(true);
  });

  test('should retry until timeout for is.disabled() on late-appearing disabled element', async () => {
    // Inject a disabled button into the DOM after a 2s delay to prove is.disabled()
    // retries until the full timeout rather than throwing after the first ~1s attempt.
    await browser.driver.executeScript(`
      const container = document.getElementById('dynamic-container');
      container.innerHTML = '';
      setTimeout(() => {
        const btn = document.createElement('button');
        btn.id = 'late-disabled-button';
        btn.textContent = 'Late Disabled Button';
        btn.disabled = true;
        container.appendChild(btn);
      }, 2000);
    `);

    // BUG: currently is.disabled() throws after the first _finder(1000) attempt
    // rejects and the error escapes the retry loop. Once fixed, it should resolve
    // to true within the 5000ms timeout after the element appears.
    const isDisabled = await browser.button('Late Disabled Button').is.disabled(5000);
    expect(isDisabled).toBe(true);
  });

  test('should retry until element appears after a few seconds (enabled element)', async () => {
    // The element does not exist on screen initially and is injected after a 3s
    // delay. This proves is.enabled()/is.disabled() must keep retrying until the
    // element appears, then return the correct complementary booleans.
    await browser.driver.executeScript(`
      const container = document.getElementById('dynamic-container');
      container.innerHTML = '';
      setTimeout(() => {
        const btn = document.createElement('button');
        btn.id = 'late-enabled-button';
        btn.textContent = 'Late Enabled Button';
        container.appendChild(btn);
      }, 3000);
    `);

    // BUG: currently is.enabled() throws after the first _finder(1000) attempt
    // rejects and the error escapes the retry loop, so it never sees the element
    // appear at 3s. Once fixed, it should resolve within the 5000ms timeout.
    const isEnabled = await browser.button('Late Enabled Button').is.enabled(5000);
    expect(isEnabled).toBe(true);

    // And the complementary check should resolve to false (element is enabled).
    const isDisabled = await browser.button('Late Enabled Button').is.disabled(5000);
    expect(isDisabled).toBe(false);
  });

  test('should respect custom timeout for is.enabled() on non-existent element (no early throw)', async () => {
    // BUG: is.enabled() currently throws instead of retrying until the custom
    // timeout and resolving to false. This test documents the bug and will pass
    // once visibility-delegate.js is fixed.
    const start = Date.now();
    await expect(browser.element('NonExistentElement').is.enabled(2000)).resolves.toBe(false);
    // Once fixed, it should wait up to the custom timeout rather than throwing early.
    expect(Date.now() - start).toBeGreaterThan(800);
  });

  test('should respect custom timeout for is.disabled() on non-existent element (no early throw)', async () => {
    // BUG: is.disabled() currently throws instead of retrying until the custom
    // timeout and resolving to false. This test documents the bug and will pass
    // once visibility-delegate.js is fixed.
    const start = Date.now();
    await expect(browser.element('NonExistentElement').is.disabled(2000)).resolves.toBe(false);
    // Once fixed, it should wait up to the custom timeout rather than throwing early.
    expect(Date.now() - start).toBeGreaterThan(800);
  });

  test('should resolve false for is.enabled() with short timeout on non-existent element (no early throw)', async () => {
    // Mirrors the removed unit-test scenario: a very short custom timeout (100ms)
    // on a non-existent element should resolve to false, not throw.
    // BUG: is.enabled() currently throws instead of resolving to false. This test
    // documents the bug and will pass once visibility-delegate.js is fixed.
    await expect(browser.element('NonExistentElement').is.enabled(100)).resolves.toBe(false);
  });

  test('should resolve false for is.disabled() with short timeout on non-existent element (no early throw)', async () => {
    // Mirrors the removed unit-test scenario: a very short custom timeout (100ms)
    // on a non-existent element should resolve to false, not throw.
    // BUG: is.disabled() currently throws instead of resolving to false. This test
    // documents the bug and will pass once visibility-delegate.js is fixed.
    await expect(browser.element('NonExistentElement').is.disabled(100)).resolves.toBe(false);
  });

  test('should check checkbox not checked state', async () => {
    const isNotChecked = await browser.checkbox('CheckBox').is.not.checked();
    expect(typeof isNotChecked).toBe('boolean');
    
    await browser.checkbox('CheckBox').should.not.be.checked();
  });

  test('should check pre-checked checkbox state', async () => {
    const isChecked = await browser.checkbox('Pre-Check Box').is.checked();
    expect(typeof isChecked).toBe('boolean');
    expect(isChecked).toBe(true);
    
    await browser.checkbox('Pre-Check Box').should.be.checked();
  });

  test('should assert radio button set/not set', async () => {
    await browser.radio('RadioButton 1').should.be.set();
    await browser.radio('RadioButton 2').should.not.be.set();
  });

  test('should scroll element to top', async () => {
    // First scroll to bottom to verify scroll works
    await browser.element('scrollable-div').scroll.to.bottom();
    
    // Then scroll back to top
    const result = await browser.element('scrollable-div').scroll.to.top();
    expect(result).toBe(true);
  });

  test('should scroll element into view', async () => {
    const result = await browser.element('scrollable-div').scroll.into.view();
    expect(result).toBe(true);
  });

  test('should scroll window to bottom', async () => {
    const result = await browser.scroll.to.bottom();
    expect(result).toBe(true);
  });

  test('should scroll window to top', async () => {
    const result = await browser.scroll.to.top();
    expect(result).toBe(true);
  });

  test('should scroll window to left', async () => {
    const result = await browser.scroll.to.left();
    expect(result).toBe(true);
  });

  test('should scroll window to right', async () => {
    const result = await browser.scroll.to.right();
    expect(result).toBe(true);
  });
});
