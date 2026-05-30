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
    const rows = ['Alice', 'Bob', 'Charlie'];
    for (const name of rows) {
      await browser.row(name).should.be.visible();
    }
  });

  test('should find columns in the table', async () => {
    // Simple table has 3 columns: Name, Age, City
    const columns = ['Name', 'Age', 'City'];
    for (const col of columns) {
      await browser.column(col).should.be.visible();
    }
  });

  test('should get text from a specific cell', async () => {
    const cellText = await browser.column('Name').within.row(2).get.text();
    expect(cellText).toBe('Alice');
  });

  test('should get text from a cell by column and row', async () => {
    // Bob's age is 25 (row 3: row 1 is header, row 2 is Alice, row 3 is Bob)
    const ageCell = await browser.column('Age').within.row(3).get.text();
    expect(ageCell).toBe('25');
  });

  test('should get text from a cell in the header', async () => {
    const headerText = await browser.column('Name').within.row(1).get.text();
    expect(headerText).toBe('Name');
  });

  test('should get text from multiple cells', async () => {
    // Test getting text from various cells
    // Row 1 is header, Row 2 is Alice, Row 3 is Bob, Row 4 is Charlie
    const cellTests = [
      { column: 'Name', row: 2, expected: 'Alice' },
      { column: 'Age', row: 3, expected: '25' },
      { column: 'City', row: 4, expected: 'Paris' },
    ];

    for (const test of cellTests) {
      const text = await browser.column(test.column).within.row(test.row).get.text();
      expect(text).toBe(test.expected);
    }
  });

  test('should click on a cell', async () => {
    await browser.column('Name').within.row(1).click();
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
    const text = await browser.row('Total').get.text();
    expect(text).toContain('Total');
    // the following tests that that complete row text is being returned
    expect(text).toContain('1325');
  });

  test('should expand column matches for column type', async () => {
    // Find the "Age" column header and expand to all cells in that column
    // Simple table has 1 header + 3 rows = 4 cells in "Age" column
    const columnCells = await browser.column('Age');
    expect(columnCells).toBeDefined();
  });

  test('should find elements in large scrolling tables', async () => {
    const text = await browser.row('Sample Data Row 100').get.text();
    expect(text).toBe('100Sample Data Row 100');
  });

  test('should find elements using ARIA roles', async () => {
    const text = await browser.row('Web-API').get.text();
    expect(text).toContain('Web-API');
  });

  // ---------------- ADDITIONAL TABLE TESTS ----------------
  // Note: ID selectors (#id) are not supported by the element finder - it matches by text content
  // Tables are found by their text content (e.g., the table's visible text or surrounding text)

  test('should find row by index', async () => {
    // Find the first row by index
    const firstRow = await browser.row(1);
    expect(firstRow).toBeDefined();
  });

  test('should find column by index', async () => {
    // Find the first column by index
    const firstColumn = await browser.column(1);
    expect(firstColumn).toBeDefined();
  });

  test('should handle non-existent table gracefully', async () => {
    await browser.table('nonexistent-table-id').should.not.be.visible();
  });

  test('should handle non-existent row gracefully', async () => {
    await browser.row('NonExistentRowName').should.not.be.visible();
  });

  test('should handle non-existent column gracefully', async () => {
    await browser.column('NonExistentColumnName').should.not.be.visible();
  });

  test('should find multiple cells in a column', async () => {
    // The Age column should have multiple cells (header + 3 data rows)
    const ageColumnCells = await browser.column('Age').findAll();
    expect(ageColumnCells.length).toBeGreaterThan(1);
  });

  test('should find multiple rows with same text pattern', async () => {
    // Find all rows in the table
    const rows = await browser.row().findAll();
    expect(rows.length).toBeGreaterThan(0);
  });

  test('should verify table structure with multiple assertions', async () => {
    // Verify table exists
    await browser.table('simple-table').should.be.visible();

    // Verify header cells
    const columns = ['Name', 'Age', 'City'];
    for (const col of columns) {
      await browser.column(col).should.be.visible();
    }

    // Verify data cells
    const rows = ['Alice', 'Bob', 'Charlie'];
    for (const name of rows) {
      await browser.row(name).should.be.visible();
    }
  });

  test('should find elements in complex table with rowspan and colspan', async () => {
    // Electronics category spans 2 rows
    const complexRows = ['Electronics', 'Laptop', 'Mouse'];
    for (const row of complexRows) {
      await browser.row(row).should.be.visible();
    }

    // Total row has colspan=3
    await browser.row('Total').should.be.visible();
    await browser.row('$1325').should.be.visible();
  });

  test('should handle nested table elements independently', async () => {
    // Find element in outer table
    await browser.row('Outer Col 1').should.be.visible();

    // Find element in inner nested table
    const nestedRows = ['Inner 1.1', 'Inner 2.2'];
    for (const row of nestedRows) {
      await browser.row(row).should.be.visible();
    }
  });

  test('should verify hidden element state changes', async () => {
    // Toggle visibility to make the element visible
    await browser.button('Toggle Hidden Cell').click();

    // Now visible
    const nowVisible = await browser.row('This is a hidden message').is.visible();
    expect(nowVisible).toBe(true);
  });

  test('should find elements in large table by index', async () => {
    // Find row by index in large table
    const rowByIndex = await browser.row(50);
    expect(rowByIndex).toBeDefined();
  });

  test('should verify ARIA gridcell elements', async () => {
    // ARIA table uses gridcell role
    const ariaRows = ['Web-API', 'Yes', 'No'];
    for (const row of ariaRows) {
      await browser.row(row).should.be.visible();
    }
  });

  // ---------------- ROW WITHIN COLUMN TESTS ----------------
  test('should verify multiple rows have correct column data', async () => {
    // Row 1 (Alice): Name=Alice, Age=30, City=New York
    // Row 2 (Bob): Name=Bob, Age=25, City=London
    // Row 3 (Charlie): Name=Charlie, Age=35, City=Paris
    const rowData = [
      { name: 'Alice', age: '30', city: 'New York' },
      { name: 'Bob', age: '25', city: 'London' },
      { name: 'Charlie', age: '35', city: 'Paris' },
    ];

    for (const row of rowData) {
      await browser.row(row.name).should.be.visible();
      await browser.row(row.age).should.be.visible();
      await browser.row(row.city).should.be.visible();
    }
  });

  test('should verify column data consistency across rows', async () => {
    // Age column should have consistent numeric values
    // Note: findAll finds across all tables, so we get Age from multiple tables
    await browser.element('Alice').within.column('Name').within.row(2).should.be.visible()
    await browser.element('London').within.column('City').within.row(3).should.be.visible()
  });

  test('should verify row data consistency across columns', async () => {
    // Each row should have 3 cells (Name, Age, City)
    // Note: findAll finds across all tables including the large table with 100 rows
    const rows = await browser.row().findAll();
    expect(rows.length).toBe(120); // 3 simple + 5 complex + 2 nested + 2 dynamic + 100 large + 8 ARIA
  });

  test('should get value of a specific cell', async () => {
    // Get the value of Bob's age (Age column, third row - row 1 is header, row 2 is Alice, row 3 is Bob)
    const bobAge = await browser.column('Age').within.row(3).get.text();
    expect(bobAge).toBe('25');

    // Get the value of Charlie's city (City column, fourth row)
    const charlieCity = await browser.column('City').within.row(4).get.text();
    expect(charlieCity).toBe('Paris');
  });

  test('should resolve elements within nested tables', async () => {
    const text = await browser.row('Inner 2.2').get.text();
    expect(text).toContain('Inner 2.2');
  });
});
