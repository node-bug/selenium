import WebBrowser from './index.js';

const browser = new WebBrowser();

try {
  await browser.start();
  await browser.goto('https://github.com');

  // Wait a bit for page to fully render
  await browser.sleep(2000);

  // Get scroll position before
  const before = await browser.driver.executeScript('return { y: window.scrollY, height: document.body.scrollHeight };');
  console.log('Before scroll:', JSON.stringify(before));

  // First perform the scroll operation (this is what triggers ElementFinder injection)
  await browser.element('Keep track of your tasks').at.index(1).scroll.into.view();

  // Wait a moment
  await browser.sleep(500);

  // Get scroll position after
  const after = await browser.driver.executeScript('return { y: window.scrollY, height: document.body.scrollHeight };');
  console.log('After scroll:', JSON.stringify(after));

  // Find the element by text directly using DOM
  const afterInfo = await browser.driver.executeScript(`
    const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const matches = headings.filter(h => h.textContent.includes('Keep track of your tasks'));
    if (matches.length > 0) {
      const elem = matches[1] || matches[0];
      const rect = elem.getBoundingClientRect();
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      return {
        text: elem.textContent.trim(),
        tagName: elem.tagName,
        top: rect.top, left: rect.left, width: rect.width, height: rect.height,
        vh, vw,
        inViewport: rect.top >= 0 && rect.left >= 0 && rect.bottom <= vh && rect.right <= vw,
        centeredVertically: Math.abs((rect.top + rect.height/2) - vh/2) < 50,
        offsetFromTop: Math.abs(rect.top),
        offsetFromCenter: Math.abs((rect.top + rect.height/2) - vh/2),
        scrollY: window.scrollY,
        scrollX: window.scrollX,
        found: matches.length
      };
    }
    return { found: 0 };
  `);
  console.log('Element info after scroll:', JSON.stringify(afterInfo, null, 2));
} catch (err) {
  console.error('Error:', err.message);
  console.error(err.stack);
} finally {
  await browser.close();
}