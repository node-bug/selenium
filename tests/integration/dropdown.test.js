import WebBrowser from '../../index.js';

describe('Dropdown Interactions Integration Tests', () => {
  let browser;

  beforeEach(async () => {
    browser = new WebBrowser();
    await browser.start();
    await browser.goto(`file://${process.cwd()}/tests/fixtures/dropdowns.html`);
  });

  afterEach(async () => {
    await browser.close();
  });

  // ========================================
  // 1. Standard HTML Select Tests
  // ========================================

  describe('Standard HTML Select', () => {
    test('should find parent of option Banana when dropdown element type is used', async () => {
      await browser.dropdown('Banana').should.be.visible();
    });

    test('should select option by text in single select', async () => {
      await browser.dropdown('Single Select').option('Apple').select();
      const selected = await browser.dropdown('Single Select').get.selected.option();
      expect(selected[0].value).toBe('apple');
    });

    test('should select option by value in single select', async () => {
      await browser.dropdown('Single Select').option('cherry').select();
      const selected = await browser.dropdown('Single Select').get.selected.option();
      expect(selected[0].text).toBe('Cherry');
    });

    test('should select option by index in single select', async () => {
      await browser.dropdown('Single Select').option(3).select(); // Banana (1-based index)
      const selected = await browser.dropdown('Single Select').get.selected.option();
      expect(selected[0].value).toBe('banana');
    });

    test('should assert selected option with should.be.selected()', async () => {
      await browser.dropdown('Single Select').option('Cherry').select();
      await browser.dropdown('Single Select').option('Cherry').should.be.selected();
    });

    test('should assert non-selected option with should.not.be.selected()', async () => {
      await browser.dropdown('Single Select').option('Apple').should.not.be.selected();
    });

    test('should assert selected option with is.selected()', async () => {
      await browser.dropdown('Single Select').option('Banana').select();
      const isSelected = await browser.dropdown('Single Select').option('Banana').is.selected();
      expect(isSelected).toBe(true);
    });

    test('should assert non-selected option with is.not.selected()', async () => {
      const isSelected = await browser.dropdown('Single Select').option('Apple').is.not.selected();
      expect(isSelected).toBe(true);
    });

    test('should get selected option with get.selected.option()', async () => {
      await browser.dropdown('Single Select').option('Banana').select();
      const selected = await browser.dropdown('Single Select').get.selected.option();
      expect(selected).toEqual([{ text: 'Banana', value: 'banana', index: 2 }]);
    });

    test('should get selected option with get.selected.options() alias', async () => {
      await browser.dropdown('Single Select').option('Cherry').select();
      const selected = await browser.dropdown('Single Select').get.selected.options();
      expect(selected).toEqual([{ text: 'Cherry', value: 'cherry', index: 3 }]);
    });
  });

  describe('Multiple Select', () => {
    test('should select multiple options', async () => {
      await browser.dropdown('Multiple Select').option('Option 1').select();
      await browser.dropdown('Multiple Select').option('Option 3').select();
      
      await browser.dropdown('Multiple Select').option('Option 1').should.be.selected();
      await browser.dropdown('Multiple Select').option('Option 3').should.be.selected();
    });

    test('should verify option is not selected', async () => {
      await browser.dropdown('Multiple Select').option('Option 5').should.not.be.selected();
    });

    test('should assert selected option with is.selected() for multi-select', async () => {
      await browser.dropdown('Multiple Select').option('Option 1').select();
      const isSelected = await browser.dropdown('Multiple Select').option('Option 1').is.selected();
      expect(isSelected).toBe(true);
    });

    test('should assert another selected option with is.selected() for multi-select', async () => {
      await browser.dropdown('Multiple Select').option('Option 3').select();
      const isSelected = await browser.dropdown('Multiple Select').option('Option 3').is.selected();
      expect(isSelected).toBe(true);
    });

    test('should assert non-selected option with is.not.selected() for multi-select', async () => {
      const isSelected = await browser.dropdown('Multiple Select').option('Option 2').is.not.selected();
      expect(isSelected).toBe(true);
    });

    test('should assert selected option with should.be.selected() for multi-select', async () => {
      await browser.dropdown('Multiple Select').option('Option 1').select();
      await browser.dropdown('Multiple Select').option('Option 1').should.be.selected();
    });

    test('should assert non-selected option with should.not.be.selected() for multi-select', async () => {
      await browser.dropdown('Multiple Select').option('Option 2').should.not.be.selected();
    });

    test('should check if multiple select dropdown has options', async () => {
      // has.option - should pass
      await browser.dropdown('Multiple Select').has.option('Option 1');
      await browser.dropdown('Multiple Select').has.option('Option 5');

      // does.not.have.option - should pass
      await browser.dropdown('Multiple Select').does.not.have.option('Option X');

      // should.have.option - should pass
      await browser.dropdown('Multiple Select').should.have.option('Option 3');

      // should.not.have.option - should pass
      await browser.dropdown('Multiple Select').should.not.have.option('Option Y');
    });

    test('should get all options from multiple select dropdown', async () => {
      const options = await browser.dropdown('Multiple Select').get.options();
      expect(options).toHaveLength(5);
      expect(options[0]).toEqual({ text: 'Option 1', value: 'opt1' });
      expect(options[1]).toEqual({ text: 'Option 2', value: 'opt2' });
      expect(options[2]).toEqual({ text: 'Option 3', value: 'opt3' });
      expect(options[3]).toEqual({ text: 'Option 4', value: 'opt4' });
      expect(options[4]).toEqual({ text: 'Option 5', value: 'opt5' });
    });

    test('should get selected options with get.selected.options() for multi-select', async () => {
      // Reset by selecting Option 1 first (clears previous selections in multi-select)
      await browser.dropdown('Multiple Select').option('Option 1').select();
      // Now select Option 3 to have 2 selected options
      await browser.dropdown('Multiple Select').option('Option 3').select();
      
      const selected = await browser.dropdown('Multiple Select').get.selected.options();
      expect(selected).toHaveLength(2);
      expect(selected[0]).toEqual({ text: 'Option 1', value: 'opt1', index: 0 });
      expect(selected[1]).toEqual({ text: 'Option 3', value: 'opt3', index: 2 });
    });

    test('should get selected option with get.selected.option() for multi-select (returns all selected)', async () => {
      // Reset by selecting Option 2 first (clears previous selections in multi-select)
      await browser.dropdown('Multiple Select').option('Option 2').select();
      // Now select Option 4 to have 2 selected options
      await browser.dropdown('Multiple Select').option('Option 4').select();
      
      const selected = await browser.dropdown('Multiple Select').get.selected.option();
      expect(selected).toHaveLength(2);
      expect(selected[0]).toEqual({ text: 'Option 2', value: 'opt2', index: 1 });
      expect(selected[1]).toEqual({ text: 'Option 4', value: 'opt4', index: 3 });
    });
  });

  // ========================================
  // 2. Custom Div-based Dropdown Tests
  // ========================================

  describe('Custom Div-based Dropdown', () => {
    test('should open and select from custom dropdown', async () => {
      await browser.dropdown('Custom UI').option('Option A').select();
      const result1 = await browser.dropdown('Custom UI').option('Option A').is.selected();
      expect(result1).toBe(true);

      await browser.dropdown('Custom UI').option(2).select();
      const result2 = await browser.dropdown('Custom UI').option('Option B').is.selected();
      expect(result2).toBe(true);
      const result3 = await browser.dropdown('Custom UI').option('Option A').is.selected();
      expect(result3).toBe(false);

      //non existent option
      await expect(browser.dropdown('Custom UI').option('Option D').select()).rejects.toThrow();

      //non existent dropdown
      await expect(browser.dropdown('Custom UI Dropdow2').option('Option A').select()).rejects.toThrow();
    });

    test('should check if dropdown has options', async () => {
      // has.option - should pass
      await browser.dropdown('Custom UI').has.option('Option A');
      await browser.dropdown('Custom UI').has.option('Option B');

      // does.not.have.option - should pass
      await browser.dropdown('Custom UI').does.not.have.option('Option D');

      // should.have.option - should pass
      await browser.dropdown('Custom UI').should.have.option('Option C');

      // should.not.have.option - should pass
      await browser.dropdown('Custom UI').should.not.have.option('Option X');
    });

    test('should check if native dropdown has options', async () => {
      // has.option - should pass for native dropdown
      await browser.dropdown('Single Select').has.option('Apple');
      await browser.dropdown('Single Select').has.option('Banana');

      // does.not.have.option - should pass for native dropdown
      await browser.dropdown('Single Select').does.not.have.option('Orange');

      // should.have.option - should pass for native dropdown
      await browser.dropdown('Single Select').should.have.option('Cherry');

      // should.not.have.option - should pass for native dropdown
      await browser.dropdown('Single Select').should.not.have.option('Grape');
    });

    test('should get all options from dropdown', async () => {
      // Get options from native dropdown
      const nativeOptions = await browser.dropdown('Single Select').get.options();
      expect(nativeOptions).toHaveLength(4);
      expect(nativeOptions[0]).toEqual({ text: 'Please choose...', value: '' });
      expect(nativeOptions[1]).toEqual({ text: 'Apple', value: 'apple' });
      expect(nativeOptions[2]).toEqual({ text: 'Banana', value: 'banana' });
      expect(nativeOptions[3]).toEqual({ text: 'Cherry', value: 'cherry' });

      // Get options from custom dropdown
      const customOptions = await browser.dropdown('Custom UI').get.options();
      expect(customOptions.length).toBeGreaterThan(0);
      expect(customOptions[0].text).toBe('Option A');
      expect(customOptions[1].text).toBe('Option B');
      expect(customOptions[2].text).toBe('Option C');
    });
  });

  // ========================================
  // 5. Cascading Dropdown Tests
  // ========================================

  describe('Cascading Dropdowns', () => {
    test('should start with subcategory disabled', async () => {
      const isDisabled = await browser.dropdown('Subcategory').is.disabled();
      expect(isDisabled).toBe(true);
    });

    test('should assert subcategory is disabled with should.be.disabled()', async () => {
      await browser.dropdown('Subcategory').should.be.disabled();
    });

    test('should throw error when trying to select from disabled dropdown', async () => {
      await expect(
        browser.dropdown('Subcategory').option('Car').select()
      ).rejects.toThrow();
    });

    test('should enable subcategory when category is selected', async () => {
      await browser.dropdown('Category').option('Fruits').select();
      
      const isEnabled = await browser.dropdown('Subcategory').is.enabled();
      expect(isEnabled).toBe(true);
    });

    test('should assert subcategory is enabled with should.be.enabled()', async () => {
      await browser.dropdown('Category').option('Fruits').select();
      await browser.dropdown('Subcategory').should.be.enabled();
    });

    test('should populate subcategory options based on category', async () => {
      await browser.dropdown('Category').option('Vehicles').select();
      await browser.dropdown('Subcategory').option('Car').select();
      
      const selected = await browser.dropdown('Subcategory').get.selected.option();
      expect(selected[0].value).toBe('car');
    });

    test('should reset subcategory when category changes', async () => {
      await browser.dropdown('Category').option('Fruits').select();
      await browser.dropdown('Subcategory').option('Apple').select();
      
      await browser.dropdown('Category').option('Vehicles').select();
      
      const selected = await browser.dropdown('Subcategory').get.selected.option();
      expect(selected[0].value).toBe('car'); // Default first option
    });
  });
});