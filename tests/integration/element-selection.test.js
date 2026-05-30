import WebBrowser from '../../index.js';

describe('Element Selection Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should select elements using type-specific selectors', async () => {
    // Testing a variety of selectors using local fixtures
    
    await browser.button('Submit Form').should.be.visible();
    await browser.textbox('Single-line Text').should.be.visible();
    await browser.checkbox('Subscribe to newsletter').should.be.visible();
    await browser.radio('Credit Card').should.be.visible();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/dropdowns.html`);
    await browser.dropdown('Apple').should.be.visible();
  });

  test('should find a single element using find()', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
    const element = await browser.element('Single-line Text').find();
    expect(element).toBeDefined();
  });

  test('should find multiple elements using findAll()', async () => {
    const elements = await browser.element('input').findAll();
    expect(Array.isArray(elements)).toBe(true);
    expect(elements.length).toBeGreaterThan(0);
  });

  test('should select link elements', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/interactive-elements.html`);
    await browser.link('Enabled Link').should.be.visible();
  });

  test('should select textarea elements', async () => {
    await browser.goto(`file://${process.cwd()}/tests/fixtures/forms.html`);
    // Note: textarea elements are matched by the 'textbox' type in this library
    await browser.textbox('Multi-line Text (Textarea)').should.be.visible();
  });
});
