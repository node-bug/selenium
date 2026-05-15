import WebBrowser from './index.js';

async function test() {
    let browser;
    browser = new WebBrowser();
    // We use a default config or environment variables for headless mode in CI
    await browser.start();

    // await browser.goto('file:///Users/thomasdsilva/Projects/selenium/tests/fixtures/shadow-dom.html');

    // await browser.goto('file:///Users/thomasdsilva/Projects/selenium/tests/fixtures/switches.html');
    // Debug: Find all switches and log details
    // const switches = await browser.switch().findAll();
    // console.log(`Found ${switches.length} switches`);

    // await browser.goto('https://seleniumbase.io/demo_page');
    // await browser.checkbox('checkBox6').check();

        await browser.goto('file:///Users/thomasdsilva/Projects/selenium/tests/fixtures/alerts.html');

    await browser.element('Click for JS Prompt').click();
    await browser.alert('I am a JS prompt').is.visible();
    await browser.alert().write('Hello World');
    await browser.alert().accept();
    // Verify the result text
    await browser.exact.element('result').get.text();
    // expect(resultText).toContain('You entered: Hello World');

    await browser.close();
}

test()