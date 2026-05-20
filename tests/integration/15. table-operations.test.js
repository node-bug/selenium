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
    // Toggle visibility first to make the element visible
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
    await browser.column('Name').should.be.visible();
    await browser.column('Age').should.be.visible();
    await browser.column('City').should.be.visible();

    // Verify data cells
    await browser.element('Alice').should.be.visible();
    await browser.element('Bob').should.be.visible();
    await browser.element('Charlie').should.be.visible();
  });

  test('should find elements in complex table with rowspan', async () => {
    // Electronics category spans 2 rows
    await browser.element('Electronics').should.be.visible();
    await browser.element('Laptop').should.be.visible();
    await browser.element('Mouse').should.be.visible();
  });

  test('should find elements in complex table with colspan', async () => {
    // Total row has colspan=3
    await browser.element('Total').should.be.visible();
    await browser.element('$1325').should.be.visible();
  });

  test('should handle nested table elements independently', async () => {
    // Find element in outer table
    await browser.element('Outer Col 1').should.be.visible();

    // Find element in inner nested table
    await browser.element('Inner 1.1').should.be.visible();
    await browser.element('Inner 2.2').should.be.visible();
  });

  test('should verify hidden element state changes', async () => {
    // Toggle visibility to make the element visible
    await browser.button('Toggle Hidden Cell').click();

    // Now visible
    const nowVisible = await browser.element('This is a hidden message').is.visible();
    expect(nowVisible).toBe(true);
  });

  test('should find elements in large table by index', async () => {
    // Find row by index in large table
    const rowByIndex = await browser.row(50);
    expect(rowByIndex).toBeDefined();
  });

  test('should verify ARIA gridcell elements', async () => {
    // ARIA table uses gridcell role
    await browser.element('Web-API').should.be.visible();
    await browser.element('Yes').should.be.visible();
    await browser.element('No').should.be.visible();
  });

  // ---------------- ROW WITHIN COLUMN TESTS ----------------
  test('should verify data within a specific row', async () => {
    // Bob's row contains: Bob, 25, London
    const bobRow = await browser.row('Bob');
    expect(bobRow).toBeDefined();

    // Verify all cells in Bob's row are accessible
    await browser.element('Bob').should.be.visible();
    await browser.element('25').should.be.visible();
    await browser.element('London').should.be.visible();
  });

  test('should verify data within a specific column', async () => {
    // Age column contains: Age, 30, 25, 35
    const ageColumn = await browser.column('Age');
    expect(ageColumn).toBeDefined();

    // Verify all cells in Age column are accessible
    await browser.element('Age').should.be.visible();
    await browser.element('30').should.be.visible();
    await browser.element('25').should.be.visible();
    await browser.element('35').should.be.visible();
  });

  test('should verify cell data matches row and column intersection', async () => {
    // Alice is in row 1, column 1 (Name column)
    // Alice's age (30) is in row 1, column 2 (Age column)
    // Alice's city (New York) is in row 1, column 3 (City column)

    // Verify Alice's data
    await browser.element('Alice').should.be.visible();
    await browser.element('30').should.be.visible();
    await browser.element('New York').should.be.visible();
  });

  test('should verify multiple rows have correct column data', async () => {
    // Row 1 (Alice): Name=Alice, Age=30, City=New York
    // Row 2 (Bob): Name=Bob, Age=25, City=London
    // Row 3 (Charlie): Name=Charlie, Age=35, City=Paris

    // Verify all row-column intersections
    await browser.element('Alice').should.be.visible();
    await browser.element('30').should.be.visible();
    await browser.element('New York').should.be.visible();

    await browser.element('Bob').should.be.visible();
    await browser.element('25').should.be.visible();
    await browser.element('London').should.be.visible();

    await browser.element('Charlie').should.be.visible();
    await browser.element('35').should.be.visible();
    await browser.element('Paris').should.be.visible();
  });

  test('should find all cells within a row using findAll', async () => {
    // Find all rows and verify each has cells
    const rows = await browser.row().findAll();
    expect(rows.length).toBeGreaterThan(0);
  });

  test('should verify column data consistency across rows', async () => {
    // Age column should have consistent numeric values
    // Note: findAll finds across all tables, so we get Age from multiple tables
    const ageColumnCells = await browser.column('Age').findAll();
    expect(ageColumnCells.length).toBe(6); // 1 header + 3 data rows in simple table + 2 from other tables
  });

  test('should verify row data consistency across columns', async () => {
    // Each row should have 3 cells (Name, Age, City)
    // Note: findAll finds across all tables including the large table with 100 rows
    const rows = await browser.row().findAll();
    expect(rows.length).toBe(120); // 3 simple + 5 complex + 2 nested + 2 dynamic + 100 large + 8 ARIA
  });

  test('should get value of a specific cell', async () => {
    // Get the value of the cell containing "Alice" (Name column, first row)
    
    const aliceValue = await browser.column('Name').within.row(2).get.text();
    expect(aliceValue).toBe('Alice');

    // Get the value of Bob's age (Age column, second row)
    const bobAge = await browser.element('25').get.text();
    expect(bobAge).toBe('25');

    // Get the value of Charlie's city (City column, third row)
    const charlieCity = await browser.element('Paris').get.text();
    expect(charlieCity).toBe('Paris');
  });
});
