import WebBrowser from '../../index.js';

describe('WebBrowser Keyboard and Advanced Interaction Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
  });

  afterAll(async () => {
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
    await browser.element('The Color is Green').below.element('Textarea:').click();
    await browser.element('SeleniumBase on GitHub').toRightOf.element('seleniumbase.com').click();
    expect(await browser.window().get.url()).toContain('https://github.com/seleniumbase/SeleniumBase');
    await browser.goBack()
    await browser.element('checkBox1').within.element('CheckBox:').click();
    await browser.checkbox('checkBox1').should.be.checked()
  });

  test('should handle switch elements', async () => {
    await browser.goto('https://www.w3schools.com/howto/tryitdemo/howto_try_toggle_switches.htm');
    
    // Test switch functionality with real toggle switches
    // Turn switch on
    await browser.switch('Toggle switch 1').on();
    expect(await browser.switch('Toggle switch 1').is.on()).toBe(true);
    
    // Turn switch off
    await browser.switch('Toggle switch 1').off();
    expect(await browser.switch('Toggle switch 1').is.off()).toBe(true);
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