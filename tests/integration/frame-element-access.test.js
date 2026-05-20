import WebBrowser from '../../index.js';

describe('Frame Element Access Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  // ============================================================
  // SECTION 1: IFRAME WITH SHADOW DOM (using shadow-dom.html)
  // ============================================================

  describe('Iframe with Shadow DOM', () => {
    beforeEach(async () => {
      await browser.goto(`file://${process.cwd()}/tests/fixtures/shadow-dom.html`);
      // Wait for dynamic shadow DOM to be created (500ms delay in the fixture)
      await new Promise(resolve => setTimeout(resolve, 1000));
    });

    test('should find regular elements inside an iframe', async () => {
      await browser.button('Regular Frame Button').should.be.visible();
    });

    test('should find shadow DOM elements inside an iframe', async () => {
      await browser.button('Shadow Frame Button').should.be.visible();
    });

    test('should find shadow DOM inputs inside an iframe', async () => {
      await browser.textbox('Shadow Input in Frame').should.be.visible();
    });

    test('should find shadow DOM checkboxes inside an iframe', async () => {
      await browser.checkbox('Frame shadow checkbox').should.be.visible();
    });

    test('should find nested shadow DOM elements inside an iframe', async () => {
      await browser.button('Frame Outer Button').should.be.visible();
      await browser.button('Frame Inner Button').should.be.visible();
    });

    test('should find input in the innermost shadow root inside an iframe', async () => {
      await browser.textbox('Frame inner input').should.be.visible();
    });
  });

  // ============================================================
  // SECTION 2: CROSS-ORIGIN IFRAME ELEMENT ACCESS
  // ============================================================

  describe('Cross-Origin Iframe Element Access', () => {
    beforeEach(async () => {
      await browser.goto(`file://${process.cwd()}/tests/fixtures/iframe-cross-origin.html`);
    });

    test('should find elements in the main document', async () => {
      await browser.button('Main Button').should.be.visible();
      await browser.textbox('Main input').should.be.visible();
    });

    test('should find elements inside a same-origin iframe (srcdoc)', async () => {
      await browser.button('Same-Origin Button').should.be.visible();
      await browser.textbox('Same-origin input').should.be.visible();
      await browser.checkbox('Same-Origin Checkbox').should.be.visible();
    });

    test('should find elements inside a same-origin iframe (data URL)', async () => {
      await browser.button('Data URL Button').should.be.visible();
    });

    test('should interact with elements in the main document', async () => {
      await browser.textbox('Main input').write('cross-origin test');
      const value = await browser.textbox('Main input').get.value();
      expect(value).toBe('cross-origin test');
    });

    test('should interact with elements inside a same-origin iframe', async () => {
      await browser.textbox('Same-origin input').write('same-origin test');
      const value = await browser.textbox('Same-origin input').get.value();
      expect(value).toBe('same-origin test');
    });
  });
});