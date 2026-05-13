import WebBrowser from '../../index.js';

describe('Table Operations Integration Tests', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto('https://practicetestautomation.com/practice-test-table/');
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should find the table element', async () => {
    const table = await browser.table('ID Course Name Language Level Enrollments Link').find();
    expect(table).toBeTruthy();
  });

  test('should count the number of rows in the table', async () => {
    const rows = await browser.table('ID Course Name Language Level Enrollments Link').within.row().findAll();
    expect(rows.length).toBe(7); // 1 header + 6 data rows
  });

  test('should count the number of columns in the table', async () => {
    const headerRow = await browser.table('ID Course Name Language Level Enrollments Link').within.row('ID Course Name Language Level Enrollments Link').find();
    const columns = await headerRow.column().findAll();
    expect(columns.length).toBe(6);
  });

  test('should get text from a specific cell', async () => {
    const cellText = await browser.table('ID Course Name Language Level Enrollments Link').within.row('1517620').column('ID').get.text();
    expect(cellText).toBe('1517620');
  });

  test('should get text from a cell by column index and row index', async () => {
    const cellText = await browser.table('ID Course Name Language Level Enrollments Link').within.row('1693880').column('Language').get.text();
    expect(cellText).toBe('Java');
  });

  test('should get text from a cell in the header', async () => {
    const headerText = await browser.table('ID Course Name Language Level Enrollments Link').within.row('ID Course Name Language Level Enrollments Link').column('Course Name').get.text();
    expect(headerText).toBe('Course Name');
  });

  test('should click on a cell', async () => {
    await browser.table('ID Course Name Language Level Enrollments Link').within.row('1517620').column('ID').click();
    expect(true).toBe(true);
  });

  test('should get all cell texts in a row', async () => {
    const rowCells = await browser.table('ID Course Name Language Level Enrollments Link').within.row('1517620').column().findAll();
    const texts = await Promise.all(rowCells.map(async (cell) => await cell.get.text()));
    expect(texts).toEqual(['1517620', 'Selenium Framework', 'Java', 'Advanced', '2667', 'View']);
  });

  test('should get all cell texts in a column', async () => {
    const idColumn = await browser.table('ID Course Name Language Level Enrollments Link').within.column('ID').findAll();
    const texts = await Promise.all(idColumn.map(async (cell) => await cell.get.text()));
    expect(texts).toEqual(['ID', '1517620', '1693880', '1743612', '1904956', '2854476', '3970682', '4536644', '4824578', '5393658']);
  });
});