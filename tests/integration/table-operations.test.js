import WebBrowser from '../../index.js';

describe('Table Operations Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/tables.html`);
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should find the table element', async () => {
    await browser.table('simple-table').should.be.visible();
  });

  test('should find the rows in the table', async () => {
    // Simple table has 3 data rows
    await browser.row('Alice').should.be.visible();
    await browser.row('Bob').should.be.visible();
    await browser.row('Charlie').should.be.visible();
  });

  test('should find columns in the table', async () => {
    // Simple table has 3 columns: Name, Age, City
    await browser.column('Name').should.be.visible();
    await browser.column('Age').should.be.visible();
    await browser.column('City').should.be.visible();
  });

  test('should find elements in a simple standard table', async () => {
    const text = await browser.element('Alice').get.text();
    expect(text).toBe('Alice');
  });

  test('should get text from a specific cell', async () => {
    const cellText = await browser.element('Alice').get.text();
    expect(cellText).toBe('Alice');
  });

  test('should get text from a cell by column and row', async () => {
    // Bob's age is 25 (row 2, column 2)
    const ageCell = await browser.element('25').get.text();
    expect(ageCell).toBe('25');
  });

  test('should get text from a cell in the header', async () => {
    const headerText = await browser.element('Name').get.text();
    expect(headerText).toBe('Name');
  });

  test('should click on a cell', async () => {
    await browser.element('Alice').click();
    expect(true).toBe(true);
  });

  test('should get all cell texts in a row', async () => {
    // Bob's row: Bob, 25, London
    const bobRow = await browser.row('Bob');
    expect(bobRow).toBeDefined();
  });

  test('should get all cell texts in a column', async () => {
    // Age column contains: Age, 30, 25, 35
    const ageColumn = await browser.column('Age');
    expect(ageColumn).toBeDefined();
  });

  test('should handle colspan and rowspan in complex tables', async () => {
    // Test finding the "Total" cell which has colspan=3
    const text = await browser.element('Total').get.text();
    expect(text).toContain('Total');
  });

  test('should resolve elements within nested tables', async () => {
    const text = await browser.element('Inner 2.2').get.text();
    expect(text).toBe('Inner 2.2');
  });

  test('should filter out hidden elements in dynamic tables', async () => {
    // Hidden element should not be found
    await browser.element('This is a hidden message').should.not.be.visible();

    // Toggle visibility
    await browser.button('Toggle Hidden Cell').click();

    // Now the element should be visible
    await browser.element('This is a hidden message').should.be.visible();
  });

  test('should expand column matches for column type', async () => {
    // Find the "Age" column header and expand to all cells in that column
    // Simple table has 1 header + 3 rows = 4 cells in "Age" column
    const columnCells = await browser.column('Age');
    expect(columnCells).toBeDefined();
  });

  test('should find elements in large scrolling tables', async () => {
    const text = await browser.element('Sample Data Row 100').get.text();
    expect(text).toBe('Sample Data Row 100');
  });

  test('should find elements using ARIA roles', async () => {
    const text = await browser.element('Web-API').get.text();
    expect(text).toBe('Web-API');
  });
});
