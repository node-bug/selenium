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

    await browser.goto('file:///Users/thomasdsilva/Projects/selenium/tests/fixtures/spatial-test.html');

    await browser
            .element('Top Right Corner')
            .toRightOf.element('Left Edge')
            .should.be.visible();

    await browser
            .element('Top Right Corner')
            .exactly.toRightOf.element('Left Edge')
            .should.be.visible();

    await browser.close();
}

test()