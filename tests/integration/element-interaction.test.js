import WebBrowser from '../../index.js';

describe('Element Interaction Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto('https://seleniumbase.io/demo_page');
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should perform advanced click operations', async () => {
    await browser.element('Some Text').tripleClick();
    await browser.element('Some Element').middleClick();
    await browser.element('Some Button').longPress(500);
    await browser.element('Some Button').multipleClick(3);
  });

  test('should handle keyboard input methods', async () => {
    const input = 'Text Input Field';
    await browser.textbox(input).clear();

    await browser.textbox(input).write('Hello ');
    await browser.textbox(input).overwrite('World');
    await browser.textbox(input).type('!');

    const text = await browser.textbox(input).get.text();
    expect(text).toContain('World!');
  });

  test('should handle arrow key presses', async () => {
    await browser.left();
    await browser.right();
    await browser.up();
    await browser.down();
  });

  test('should handle file upload', async () => {
    await browser.file('Choose File').upload('/tmp/test.txt');
  });

  test('should handle switch on/off', async () => {
    await browser.goto('https://www.w3schools.com/howto/tryitdemo/howto_try_toggle_switches.htm');
    const switchElement = browser.switch('Toggle switch 1');
    
    await switchElement.on();
    expect(await switchElement.should.be.on()).toBe(true);
    
    await switchElement.off();
    expect(await switchElement.should.be.off()).toBe(true);
  });
});
