import WebBrowser from '../../index.js';

describe('WebBrowser Keyboard and Advanced Interaction Tests', () => {
  let browser;

  beforeEach(async () => {
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
  });

  afterEach(async () => {
    await browser.close();
  });

  test('should perform keyboard navigation', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    await browser.element('Text Input Field').focus();
    await browser.press('Enter');
  });

  test('should perform advanced click patterns', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    await browser.element('Text Input Field').tripleClick();
    await browser.element('Click Me (Green)').multipleClick(3);
  });

  test('should navigate using arrow keys', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    await browser.element('Text Input Field').focus();
    await browser.left();
    await browser.right();
    await browser.up();
    await browser.down();
  });

  test('should use modifier keys with actions', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // Ctrl + Click on a link
    await browser.ctrl.element('seleniumbase.com').click();
    // Shift + Click on a link
    await browser.shift.element('seleniumbase.com').click();
    // Meta (Cmd/Win) + Click on a link
    await browser.meta.element('seleniumbase.com').click();
  });

  test('should use spatial locators (below, toRightOf, within)', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // Element below another element
    await browser.element('The Color is Green').below.element('Textarea:').click();
    // Element to the right of another element
    await browser.element('SeleniumBase on GitHub').toRightOf.element('seleniumbase.com').click();
    expect(await browser.window().get.url()).toContain('https://github.com/seleniumbase/SeleniumBase');
    await browser.goBack();
    // Click the first checkbox directly (the "CheckBox:" checkbox)
    await browser.checkbox(1).check();
    await browser.checkbox(1).should.be.checked();
  });

  test('should handle switch elements', async () => {
    // Use the local fixture file which has proper switch elements
    const path = await import('path');
    const { fileURLToPath } = await import('url');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const FIXTURES_DIR = path.resolve(__dirname, '..', 'fixtures');
    const fileUrl = (filename) => `file://${path.join(FIXTURES_DIR, filename)}`;

    await browser.goto(fileUrl('switches.html'));

    // Test button-style switch (role="switch")
    await browser.switch('Environmental Controls').on();
    expect(await browser.switch('Environmental Controls').is.on()).toBe(true);

    await browser.switch('Environmental Controls').off();
    expect(await browser.switch('Environmental Controls').is.off()).toBe(true);

    // Test label-wrapped checkbox switch
    await browser.switch('Accessibility Preferences').on();
    expect(await browser.switch('Accessibility Preferences').is.on()).toBe(true);

    await browser.switch('Accessibility Preferences').off();
    expect(await browser.switch('Accessibility Preferences').is.off()).toBe(true);
  });

  test('should handle character-by-character typing', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    await browser.textbox('Text Input Field').clear();
    await browser.textbox('Text Input Field').type('Hello');
    
    const value = await browser.textbox('Text Input Field').get.value();
    expect(value).toBe('Hello');
  });

  test('should handle long press on elements', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // Long press on a button (assuming it triggers some action or just doesn't throw)
    await browser.element('Click Me (Green)').longPress(1000); // 1 second
    // If we reach here without error, the test passes
  });
});