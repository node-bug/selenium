import WebBrowser from '../../index.js';

describe('WebBrowser Alerts Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should handle JavaScript alerts', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/alerts.html`);
    await browser.element('Click for JS Alert').click();
    const isVisible = await browser.alert('I am a JS Alert').is.visible();
    expect(isVisible).toBe(true);
    await browser.alert().accept();
    // Verify the result text
    const resultText = await browser.exact.element('result').get.text();
    expect(resultText).toContain('You successfully clicked an alert');
  });

  test('should handle JavaScript confirms', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/alerts.html`);

    await browser.element('Click for JS Confirm').click();
    const isVisible = await browser.alert('I am a JS Confirm').is.visible();
    expect(isVisible).toBe(true);
    await browser.alert().accept(); // or dismiss()
    // Verify the result text
    const resultText = await browser.exact.element('result').get.text();
    expect(resultText).toContain('You clicked: Ok');

  });

  test('should handle JavaScript prompts', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/alerts.html`);

    await browser.element('Click for JS Prompt').click();
    const isVisible = await browser.alert('I am a JS prompt').is.visible();
    expect(isVisible).toBe(true);
    await browser.alert().write('Hello World');
    await browser.alert().accept();
    // Verify the result text
    const resultText = await browser.exact.element('result').get.text();
    expect(resultText).toContain('You entered: Hello World');

  });

  test('should test is.not.visible functionality', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/alerts.html`);

    const isNotVisible = await browser.alert().is.not.visible();
    expect(isNotVisible).toBe(true);

    // Now trigger an alert and test that is.not.visible returns false
    await browser.element('Click for JS Alert').click();
    const isVisible = await browser.alert().is.visible();
    expect(isVisible).toBe(true);

    const isNotVisibleAfterAlert = await browser.alert().is.not.visible();
    expect(isNotVisibleAfterAlert).toBe(false);

    // Clean up
    await browser.alert().accept();

  });

  test('should test should.be.visible and should.not.be.visible functionality', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/alerts.html`);

    // Before clicking any button, there should be no alert
    // should.not.be.visible should not throw
    await expect(browser.alert().should.not.be.visible()).resolves.not.toThrow();

    // Now trigger an alert
    await browser.element('Click for JS Alert').click();

    // should.be.visible should not throw
    await expect(browser.alert().should.be.visible()).resolves.not.toThrow();

    // should.not.be.visible should throw
    await expect(browser.alert().should.not.be.visible()).rejects.toThrow();

    // Clean up
    await browser.alert().accept();

  });

  test('should throw clear error when write() called with no alert present', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/alerts.html`);

    // No button clicked, so no alert is open. Clear any cached alert reference
    // so this.alert is undefined, reproducing the unguarded-access bug.
    browser.alert().alert = undefined;

    await expect(browser.alert().write('Hello World')).rejects.toThrow(/No alert present/);
  });

  test('should throw clear error when get.text() called with no alert present', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/alerts.html`);

    // No button clicked, so no alert is open. Clear any cached alert reference
    // so this.alert is undefined, reproducing the unguarded-access bug.
    browser.alert().alert = undefined;

    await expect(browser.alert().get.text()).rejects.toThrow(/No alert present/);
  });
});