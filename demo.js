import WebBrowser from './index.js';

async function test1() {
    let browser;
    browser = new WebBrowser();

    try {
        await browser.start();
        await browser.goto(`https://docs.google.com/forms/d/e/1FAIpQLSciCcNILfeSdgUavm_GYuCFE_G8InD1YVkIWAiTU_B3-l9AkA/viewform`);
        // await browser.radio().exactly.below.element('Agree').findAll()
        // await browser.radio().exactly.toRightOf.element('Travel broadens the mind').findAll()
        await browser.radio('Agree').exactly.toRightOf.element('Travel broadens the mind').find();
        await browser.radio().exactly.below.element('Agree').and.exactly.toRightOf.element('Most travel is dangerous').findAll()
        await browser.radio('No').within.element('Would you like to see more things you can do with Google Forms?').findAll()
        console.log()


    } finally {
        await browser.close()
    }
}

test1()