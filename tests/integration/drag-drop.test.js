import WebBrowser from '../../index.js';

describe('Drag and Drop Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/drag-drop.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should perform basic drag and drop', async () => {
    await browser.drag.element('Drag Me!').onto.element('Drop Here').drop();
    
    const status = await browser.element('basic-status').get.text();
    expect(status).toBe('Status: Success!');
    
    // Note: drop-target also matches the multi-target handler, so text becomes "Dropped dragged!"
    const target = await browser.element('drop-target').get.text();
    expect(target).toBe('Dropped dragged!');
  });

  test('should reorder items in a sortable list', async () => {
    // Drag Item 1 onto Item 3 to reorder
    await browser.drag.element('Item 1').onto.element('Item 3').drop();
    
    const items = await browser.element('sortable-item').findAll();
    const texts = await Promise.all(items.map(i => i.getText()));
    
    // Verify Item 1 is no longer at the top
    expect(texts[0]).not.toBe('☰ Item 1');
  });

  test('should drag items to different target zones', async () => {
    await browser.drag.element('Item A').onto.element('Zone 2').drop();
    
    const status = await browser.element('multi-status').get.text();
    expect(status).toContain('A dropped in target-zone-2');
    
    const zone2 = await browser.element('target-zone-2').get.text();
    expect(zone2).toBe('Dropped A!');
  });

  test('should handle file drag and drop (simulated)', async () => {
    const { By } = await import('selenium-webdriver');
    
    // Simulate a drop event using executeScript since we can't drag real files
    const fileZone = await browser.driver.findElement(By.id('file-drop-zone'));
    await browser.driver.executeScript(`
      const dataTransfer = new DataTransfer();
      const file = new File(["content"], "test-file.txt", { type: "text/plain" });
      dataTransfer.items.add(file);
      
      const event = new DragEvent('drop', {
        bubbles: true,
        cancelable: true,
        dataTransfer: dataTransfer
      });
      arguments[0].dispatchEvent(event);
    `, fileZone);
    
    const fileList = await browser.driver.findElement(By.id('file-list'));
    const text = await fileList.getText();
    expect(text).toContain('File: test-file.txt');
  });

  test('should perform jQuery UI drag and drop', async () => {
    await browser.drag.element('jQuery Drag!').onto.element('jQuery Drop Here').drop();
    
    const status = await browser.element('jquery-status').get.text();
    expect(status).toBe('Status: Success!');
    
    const target = await browser.element('jquery-drop-target').get.text();
    expect(target).toBe('Dropped!');
  });
});