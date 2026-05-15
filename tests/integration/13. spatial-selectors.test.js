import WebBrowser from '../../index.js';

describe('WebBrowser Spatial Selectors Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should find element below another element', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // The textbox "Text Input Field" is below the heading "Automation Practice"
    await browser
      .textbox('Text Input Field')
      .below.heading('Automation Practice')
      .should.be.visible();
  });

  test('should find element above another element', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // The heading "Automation Practice" is above the textbox "Text Input Field"
    await browser
      .heading('Automation Practice')
      .above.textbox('Text Input Field')
      .should.be.visible();
  });

  test('should find element to the left of another element', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // The label "Text Input Field:" is to the left of the textbox
    await browser
      .element('Text Input Field:')
      .toLeftOf.textbox('Text Input Field')
      .should.be.visible();
  });

  test('should find element to the right of another element', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // The textbox is to the right of its label
    await browser
      .textbox('Text Input Field')
      .toRightOf.element('Text Input Field:')
      .should.be.visible();
  });

  test('should find element within another element', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // The textbox is within the body (or we can use a more specific container)
    await browser
      .textbox('Text Input Field')
      .within.element('body')
      .should.be.visible();
  });

  test('should find element near another element', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // The label "Read-Only Text Field:" is near the textbox with value "The Color is Green" (same row)
    await browser
      .element('Read-Only Text Field:')
      .near.textbox('The Color is Green')
      .should.be.visible();
  });

  test('should chain multiple spatial references', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // Find an element that is below the heading and to the right of its label
    await browser
      .textbox('Text Input Field')
      .below.heading('Automation Practice')
      .toRightOf.element('Text Input Field:')
      .should.be.visible();
  });

  test('should work with exact matching in spatial context', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // Test exact matching combined with spatial selectors
    // Using the label "Text Input Field:" which is to the left of the textbox
    await browser
      .exact.element('Text Input Field:')
      .toLeftOf.textbox('Text Input Field')
      .should.be.visible();
  });

  test('should find element exactly above another element with alignment', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // The heading "Automation Practice" is exactly above the textbox "Text Input Field"
    // exactly checks horizontal alignment (left/right edges within 5px)
    await browser
      .heading('Automation Practice')
      .exactly.above.textbox('Text Input Field')
      .should.be.visible();
  });

  test('should find element exactly below another element with alignment', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // The textbox "Text Input Field" is exactly below the heading "Automation Practice"
    // exactly checks horizontal alignment (left/right edges within 5px)
    await browser
      .textbox('Text Input Field')
      .exactly.below.heading('Automation Practice')
      .should.be.visible();
  });

  test('should find element exactly to the left of another element with alignment', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // The label "Text Input Field:" is exactly to the left of the textbox
    // exactly checks vertical alignment (top/bottom edges within 5px)
    await browser
      .element('Text Input Field:')
      .exactly.toLeftOf.textbox('Text Input Field')
      .should.be.visible();
  });

  test('should find element exactly to the right of another element with alignment', async () => {
    await browser.goto('https://seleniumbase.io/demo_page');
    // The textbox is exactly to the right of its label
    // exactly checks vertical alignment (top/bottom edges within 5px)
    await browser
      .textbox('Text Input Field')
      .exactly.toRightOf.element('Text Input Field:')
      .should.be.visible();
  });
});