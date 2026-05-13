import WebBrowser from '../../index.js';

describe('Element Selection Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto('https://seleniumbase.io/demo_page');
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should select elements using type-specific selectors', async () => {
    // Testing a variety of selectors from the API reference
    // Elements verified against https://seleniumbase.io/demo_page
    
    await browser.button('Click Me').should.be.visible();
    await browser.textbox('Text Input Field').should.be.visible();
    await browser.checkbox('CheckBox').should.be.visible();
    await browser.radio('RadioButton 1').should.be.visible();
    await browser.dropdown('Set to 25%').should.be.visible();
  });

  test('should find a single element using find()', async () => {
    const element = await browser.element('Text Input Field').find();
    expect(element).toBeDefined();
  });

  test('should find multiple elements using findAll()', async () => {
    const elements = await browser.element('input').findAll();
    expect(Array.isArray(elements)).toBe(true);
    expect(elements.length).toBeGreaterThan(0);
  });

  test('should select link elements', async () => {
    await browser.link('seleniumbase.com').should.be.visible();
    await browser.link('SeleniumBase on GitHub').should.be.visible();
  });

  test('should select textarea elements', async () => {
    // Note: textarea elements are matched by the 'textbox' type in this library
    await browser.textbox('Textarea').should.be.visible();
  });
});
