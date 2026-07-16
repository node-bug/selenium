import WebBrowser from '../../index.js';

/**
 * Late-appearing element tests (state checks that retry).
 *
 * After the `_finder` fix in index.js, `_finder` genuinely retries until the
 * timeout for any not-found element, so the whole API consistently waits for
 * late-appearing elements. The `is.*` boolean checks (`is.visible`,
 * `is.not.visible`, `is.enabled`, `is.disabled`) catch the final timeout and
 * return `false` for a never-found element.
 *
 * These tests inject elements into `#dynamic-container` (in element-state.html)
 * via `executeScript` + `setTimeout`, then assert that the `is.*` checks wait
 * until the element's state settles (appears, or becomes invisible) rather than
 * resolving early.
 */
describe('Late-Appearing Elements (retry-capable state checks)', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/element-state.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  /**
   * Injects HTML into #dynamic-container after `delay` ms.
   *
   * @param {number} delay - Milliseconds to wait before injecting the element
   * @param {string} html - Inner HTML to set on the container
   */
  async function injectAfter(delay, html) {
    await browser.driver.executeScript(`
      const container = document.getElementById('dynamic-container');
      container.innerHTML = '';
      setTimeout(() => {
        container.innerHTML = ${JSON.stringify(html)};
      }, ${delay});
    `);
  }

  test('should resolve is.not.visible() true when an element disappears after a few seconds', async () => {
    // The element starts present/visible, then is removed from the DOM after a 3s
    // delay. is.not.visible() must keep retrying until the element is gone and
    // then resolve true (rather than resolving early on the first check).
    await browser.driver.executeScript(`
      const container = document.getElementById('dynamic-container');
      container.innerHTML = '<span id="late-hide">Late Hide</span>';
      setTimeout(() => {
        const el = document.getElementById('late-hide');
        if (el) el.remove();
      }, 3000);
    `);

    // Initially the element is present, so is.not.visible() should be false.
    const notVisibleEarly = await browser.element('Late Hide').is.not.visible(1000);
    expect(notVisibleEarly).toBe(false);

    // After it is removed from the DOM, is.not.visible() must keep retrying until
    // the element is no longer found and resolve true.
    const notVisibleLate = await browser.element('Late Hide').is.not.visible(5000);
    expect(notVisibleLate).toBe(true);
  });

  test('should resolve is.enabled() true for an enabled element that appears after a delay', async () => {
    await injectAfter(2000, '<button id="late-enabled2">Late Enabled2</button>');

    const isEnabled = await browser.button('Late Enabled2').is.enabled(5000);
    expect(isEnabled).toBe(true);
  });

  test('should resolve is.enabled() true when an element becomes enabled after a few seconds', async () => {
    // The element is present but DISABLED initially, then becomes ENABLED after a
    // 3s delay (the disabled attribute is removed). is.enabled() must keep polling
    // the element's state until it becomes enabled and then resolve true.
    await browser.driver.executeScript(`
      const container = document.getElementById('dynamic-container');
      container.innerHTML = '<button id="late-enable" disabled>Late Enable</button>';
      setTimeout(() => {
        const el = document.getElementById('late-enable');
        if (el) el.removeAttribute('disabled');
      }, 3000);
    `);

    // Initially the element is disabled, so is.enabled() should be false.
    const enabledEarly = await browser.button('Late Enable').is.enabled(1000);
    expect(enabledEarly).toBe(false);

    // After it becomes enabled, is.enabled() must keep polling until the state
    // changes and resolve true.
    const enabledLate = await browser.button('Late Enable').is.enabled(5000);
    expect(enabledLate).toBe(true);
  });

  test('should resolve is.disabled() true when an element becomes disabled after a few seconds', async () => {
    // The element is present and ENABLED initially, then becomes DISABLED after a
    // 3s delay (the disabled attribute is added). is.disabled() must keep polling
    // the element's state until it becomes disabled and then resolve true.
    await browser.driver.executeScript(`
      const container = document.getElementById('dynamic-container');
      container.innerHTML = '<button id="late-disable">Late Disable</button>';
      setTimeout(() => {
        const el = document.getElementById('late-disable');
        if (el) el.setAttribute('disabled', '');
      }, 3000);
    `);

    // Initially the element is enabled, so is.disabled() should be false.
    const disabledEarly = await browser.button('Late Disable').is.disabled(1000);
    expect(disabledEarly).toBe(false);

    // After it becomes disabled, is.disabled() must keep polling until the state
    // changes and resolve true.
    const disabledLate = await browser.button('Late Disable').is.disabled(5000);
    expect(disabledLate).toBe(true);
  });

  test('should resolve is.disabled() true for a disabled element that appears after a delay', async () => {
    await injectAfter(2000, '<button id="late-disabled2" disabled>Late Disabled2</button>');

    const isDisabled = await browser.button('Late Disabled2').is.disabled(5000);
    expect(isDisabled).toBe(true);
  });

  test('should resolve is.enabled() false for a disabled element that appears after a delay', async () => {
    await injectAfter(2000, '<button id="late-disabled3" disabled>Late Disabled3</button>');

    const isEnabled = await browser.button('Late Disabled3').is.enabled(5000);
    expect(isEnabled).toBe(false);
  });

  test('should resolve is.disabled() false for an enabled element that appears after a delay', async () => {
    await injectAfter(2000, '<button id="late-enabled3">Late Enabled3</button>');

    const isDisabled = await browser.button('Late Enabled3').is.disabled(5000);
    expect(isDisabled).toBe(false);
  });

  test('should resolve is.enabled() true for a nested element that appears after a delay', async () => {
    await injectAfter(2000, `
      <div id="late-parent">
        <div id="late-child">Late Child</div>
      </div>
    `);

    const isEnabled = await browser.element('Late Child').is.enabled(5000);
    expect(isEnabled).toBe(true);
  });

  test('should resolve is.enabled() true for a late textbox', async () => {
    await injectAfter(2000, '<input id="late-textbox" type="text" value="Late Textbox">');

    const isEnabled = await browser.textbox('Late Textbox').is.enabled(5000);
    expect(isEnabled).toBe(true);
  });

  test('should resolve is.enabled() true for a late checkbox', async () => {
    await injectAfter(2000, `
      <div id="late-checkbox-wrap">
        <input id="late-checkbox" type="checkbox">
        <label for="late-checkbox">Late Checkbox</label>
      </div>
    `);

    const isEnabled = await browser.checkbox('Late Checkbox').is.enabled(5000);
    expect(isEnabled).toBe(true);
  });

  test('should resolve is.enabled() true for a late dropdown', async () => {
    await injectAfter(2000, `
      <select id="late-select">
        <option value="a">Late Select</option>
      </select>
    `);

    const isEnabled = await browser.dropdown('Late Select').is.enabled(5000);
    expect(isEnabled).toBe(true);
  });

  test('should resolve is.enabled() true for a late link', async () => {
    await injectAfter(2000, '<a id="late-link" href="#">Late Link</a>');

    const isEnabled = await browser.link('Late Link').is.enabled(5000);
    expect(isEnabled).toBe(true);
  });

  test('should resolve is.enabled() true for a late heading', async () => {
    await injectAfter(2000, '<h3 id="late-heading">Late Heading</h3>');

    const isEnabled = await browser.heading('Late Heading').is.enabled(5000);
    expect(isEnabled).toBe(true);
  });

  test('should resolve is.enabled() true for an element appearing after a long (4s) delay', async () => {
    await injectAfter(4000, '<button id="late-long">Late Long</button>');

    const isEnabled = await browser.button('Late Long').is.enabled(5000);
    expect(isEnabled).toBe(true);
  });
});
