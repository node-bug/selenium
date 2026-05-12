import WebBrowser from '../../index.js';

describe('WebBrowser Text Validation Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('has.text()', () => {
    test('should return true when element contains expected text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      const hasText = await browser.heading('Demo Page').has.text('Demo Page');
      expect(hasText).toBe(true);
    });

    test('should return false when element does not contain expected text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      const hasText = await browser.heading('Demo Page').has.text('This text does not exist');
      expect(hasText).toBe(false);
    });

    test('should return true for textbox with entered text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').write('Hello World');
      const hasText = await browser.textbox('Text Input Field').has.text('Hello World');
      expect(hasText).toBe(true);
    });

    test('should return false for textbox with different text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').write('Hello World');
      const hasText = await browser.textbox('Text Input Field').has.text('Goodbye World');
      expect(hasText).toBe(false);
    });

    test('should return true for textarea with entered text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('myTextarea').write('Test textarea content');
      const hasText = await browser.textbox('myTextarea').has.text('Test textarea content');
      expect(hasText).toBe(true);
    });
  });

  describe('should.have.text()', () => {
    test('should not throw when element contains expected text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await expect(browser.heading('Demo Page').should.have.text('Demo Page'))
        .resolves.not.toThrow();
    });

    test('should throw when element does not contain expected text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await expect(browser.heading('Demo Page').should.have.text('Nonexistent Text'))
        .rejects.toThrow('Element text');
    });

    test('should not throw for textbox with matching entered text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').write('Test Input');
      await expect(browser.textbox('Text Input Field').should.have.text('Test Input'))
        .resolves.not.toThrow();
    });

    test('should throw for textbox with non-matching text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').write('Actual Text');
      await expect(browser.textbox('Text Input Field').should.have.text('Expected Different Text'))
        .rejects.toThrow('Element text');
    });

    test('should not throw for textarea with matching text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('myTextarea').write('Multi\nLine\nText');
      await expect(browser.textbox('myTextarea').should.have.text('Multi\nLine\nText'))
        .resolves.not.toThrow();
    });
  });

  describe('should.not.have.text()', () => {
    test('should not throw when element does not contain the text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await expect(browser.heading('Demo Page').should.not.have.text('This text is not here'))
        .resolves.not.toThrow();
    });

    test('should throw when element contains the text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await expect(browser.heading('Demo Page').should.not.have.text('Demo Page'))
        .rejects.toThrow('Element text');
    });

    test('should not throw for textbox when text does not match', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').write('Some Value');
      await expect(browser.textbox('Text Input Field').should.not.have.text('Different Value'))
        .resolves.not.toThrow();
    });

    test('should throw for textbox when text matches', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').write('Exact Match');
      await expect(browser.textbox('Text Input Field').should.not.have.text('Exact Match'))
        .rejects.toThrow('Element text');
    });

    test('should not throw for empty textbox checking for non-empty text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').clear();
      await expect(browser.textbox('Text Input Field').should.not.have.text('Some Text'))
        .resolves.not.toThrow();
    });
  });

  describe('does.not.have.text()', () => {
    test('should return true when element does not contain the text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      const doesNotHaveText = await browser.heading('Demo Page').does.not.have.text('Missing Text');
      expect(doesNotHaveText).toBe(true);
    });

    test('should return false when element contains the text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      const doesNotHaveText = await browser.heading('Demo Page').does.not.have.text('Demo Page');
      expect(doesNotHaveText).toBe(false);
    });

    test('should return true for textbox with different text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').write('Actual Content');
      const doesNotHaveText = await browser.textbox('Text Input Field').does.not.have.text('Expected Content');
      expect(doesNotHaveText).toBe(true);
    });

    test('should return false for textbox with matching text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').write('Same Text');
      const doesNotHaveText = await browser.textbox('Text Input Field').does.not.have.text('Same Text');
      expect(doesNotHaveText).toBe(false);
    });

    test('should return true for empty textbox checking for non-empty text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').clear();
      const doesNotHaveText = await browser.textbox('Text Input Field').does.not.have.text('Non Empty');
      expect(doesNotHaveText).toBe(true);
    });

    test('should return false for empty textbox checking for empty text', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').clear();
      const doesNotHaveText = await browser.textbox('Text Input Field').does.not.have.text('');
      expect(doesNotHaveText).toBe(false);
    });
  });

  describe('combined text validation scenarios', () => {
    test('should validate text changes after clearing and re-entering', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      // Enter initial text
      await browser.textbox('Text Input Field').write('First Value');
      expect(await browser.textbox('Text Input Field').has.text('First Value')).toBe(true);
      expect(await browser.textbox('Text Input Field').does.not.have.text('Second Value')).toBe(true);
      
      // Clear and enter new text
      await browser.textbox('Text Input Field').clear();
      await browser.textbox('Text Input Field').write('Second Value');
      expect(await browser.textbox('Text Input Field').has.text('Second Value')).toBe(true);
      expect(await browser.textbox('Text Input Field').does.not.have.text('First Value')).toBe(true);
    });

    test('should validate text in multiple textboxes', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').write('Box 1 Content');
      await browser.textbox('myTextarea').write('Box 2 Content');
      
      expect(await browser.textbox('Text Input Field').has.text('Box 1 Content')).toBe(true);
      expect(await browser.textbox('myTextarea').has.text('Box 2 Content')).toBe(true);
      expect(await browser.textbox('Text Input Field').does.not.have.text('Box 2 Content')).toBe(true);
      expect(await browser.textbox('myTextarea').does.not.have.text('Box 1 Content')).toBe(true);
    });

    test('should validate text using should assertions in sequence', async () => {
      await browser.goto('https://seleniumbase.io/demo_page');
      
      await browser.textbox('Text Input Field').write('Test Assertion');
      
      // Chain multiple assertions
      await browser.textbox('Text Input Field').should.have.text('Test Assertion');
      await browser.textbox('Text Input Field').should.not.have.text('Wrong Text');
    });
  });
});
