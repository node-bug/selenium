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
    // Note: These depend on the demo page having these elements. 
    // We use try-catch or generic elements if specific ones aren't guaranteed.
    
      await browser.button('Submit').should.be.visible();
      await browser.textbox('Text Input Field').should.be.visible();
      await browser.checkbox('Check this').should.be.visible();
      await browser.radio('Radio 1').should.be.visible();
      await browser.dropdown('Dropdown').should.be.visible();
    
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
});
