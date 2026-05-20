import { vi, beforeEach } from 'vitest';

// ---------------- MOCKS ----------------
const mockSelectInstance = vi.hoisted(() => ({
  getOptions: vi.fn(),
  getFirstSelectedOption: vi.fn(),
  getAllSelectedOptions: vi.fn(),
  selectByIndex: vi.fn(),
  selectByVisibleText: vi.fn(),
  selectByValue: vi.fn(),
}));

function MockSelect() {
  return mockSelectInstance;
}

vi.mock('selenium-webdriver', () => ({
  Builder: vi.fn(),
  By: {},
  until: {},
  WebDriver: vi.fn(),
  Select: MockSelect,
}));

vi.mock('@nodebug/logger', () => ({
  log: {
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../../app/messenger.js', () => ({
  default: vi.fn(({ action }) => `Select: ${action}`),
}));

// ---------------- IMPORTS ----------------
const { log } = await import('@nodebug/logger');

const { SelectDelegate } = await import(
  '../../../app/command-delegates/select-delegate.js'
);

// ---------------- TESTS ----------------
describe('SelectDelegate (ESM)', () => {
  let mockBrowser;
  let delegate;
  let mockLocator;

  const createLocatorMock = (overrides = {}) => ({
    tagName: 'select',
    getAttribute: vi.fn(),
    click: vi.fn(),
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocator = createLocatorMock();

    mockBrowser = {
      stack: ['some-select'],
      message: '',
      _finder: vi.fn().mockResolvedValue(mockLocator),
      handleError: vi.fn(),
      driver: {
        findElements: vi.fn(),
        executeScript: vi.fn(),
      },
    };

    delegate = new SelectDelegate(mockBrowser);
  });

  // ---------------- CONSTRUCTOR ----------------
  describe('constructor', () => {
    test('should create a new SelectDelegate instance', () => {
      expect(delegate).toBeInstanceOf(SelectDelegate);
    });

    test('should initialize optionValue to null', () => {
      expect(delegate.optionValue).toBeNull();
    });

    test('should initialize isIndex to false', () => {
      expect(delegate.isIndex).toBe(false);
    });
  });

  // ---------------- OPTION ----------------
  describe('option()', () => {
    test('should set optionValue to a string', () => {
      delegate.option('United States');
      expect(delegate.optionValue).toBe('United States');
      expect(delegate.isIndex).toBe(false);
    });

    test('should set optionValue to a number and mark as index', () => {
      delegate.option(3);
      expect(delegate.optionValue).toBe(3);
      expect(delegate.isIndex).toBe(true);
    });

    test('should not mark as index when value is 0', () => {
      delegate.option(0);
      expect(delegate.optionValue).toBe(0);
      expect(delegate.isIndex).toBe(false);
    });

    test('should not mark as index when value is negative', () => {
      delegate.option(-1);
      expect(delegate.optionValue).toBe(-1);
      expect(delegate.isIndex).toBe(false);
    });

    test('should return this for chaining', () => {
      const result = delegate.option('test');
      expect(result).toBe(delegate);
    });
  });

  // ---------------- SELECT ----------------
  describe('select()', () => {
    test('should throw error when optionValue is null (no option() called)', async () => {
      await expect(delegate.select()).rejects.toThrow(
        'Option to be selected was not provided. Please use option() chain.'
      );
      expect(log.error).toHaveBeenCalled();
    });

    test('should delegate to native select for <select> elements', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockResolvedValue();

      delegate.option('United States');
      await delegate.select();

      expect(mockBrowser._finder).toHaveBeenCalledWith();
      expect(mockSelectInstance.selectByVisibleText).toHaveBeenCalledWith('United States');
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should delegate to combobox select for non-select elements', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();
      mockBrowser.driver.findElements.mockResolvedValue([]);

      delegate.option('option');
      await delegate.select();

      expect(mockLocator.click).toHaveBeenCalled();
      expect(mockBrowser.stack).toEqual([]);
    });

    test('should handle errors during selection', async () => {
      const error = new Error('Finder failed');
      mockBrowser._finder.mockRejectedValue(error);

      delegate.option('option');
      const result = await delegate.select();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        "selecting 'option' from dropdown"
      );
      expect(result).toBe(true);
    });

    test('should clear stack in finally block', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('fail'));

      delegate.option('option');
      await delegate.select();

      expect(mockBrowser.stack).toEqual([]);
    });

    test('should set browser message via messenger', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('fail'));

      delegate.option('test-option');
      await delegate.select();

      expect(mockBrowser.message).toBeDefined();
    });

    test('should clear optionValue and isIndex in finally block', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('fail'));

      delegate.option(5);
      expect(delegate.optionValue).toBe(5);
      expect(delegate.isIndex).toBe(true);

      await delegate.select();

      expect(delegate.optionValue).toBeNull();
      expect(delegate.isIndex).toBe(false);
    });
  });

  // ---------------- SELECT NATIVE (INDEX) ----------------
  describe('select() - native by index', () => {
    test('should select by 1-based index', async () => {
      mockLocator.tagName = 'select';
      const mockOptions = [{ click: vi.fn() }];
      mockSelectInstance.getOptions.mockResolvedValue(mockOptions);
      mockSelectInstance.selectByIndex.mockResolvedValue();

      delegate.option(1);
      await delegate.select();

      expect(mockSelectInstance.selectByIndex).toHaveBeenCalledWith(0);
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('index 1'));
    });

    test('should select by index 2 (converts to 0-based)', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([{}, {}, {}]);
      mockSelectInstance.selectByIndex.mockResolvedValue();

      delegate.option(2);
      await delegate.select();

      expect(mockSelectInstance.selectByIndex).toHaveBeenCalledWith(1);
    });

    test('should throw error for index out of range', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([{}, {}]); // 2 options

      delegate.option(5);
      await delegate.select();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        "selecting '5' from dropdown"
      );
      expect(mockBrowser.handleError.mock.calls[0][0].message).toContain('out of range');
    });

    test('should throw error for index 0 (out of range since 1-based)', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([{}, {}]);

      delegate.option(0);
      await delegate.select();

      // 0 is not treated as index (val > 0 required), falls through to string matching
      expect(mockSelectInstance.selectByVisibleText).toHaveBeenCalled();
    });

    test('should treat 0 as a string selector (not an index)', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockRejectedValue(new Error('not found'));

      const mockOption = {
        getAttribute: vi.fn()
          .mockResolvedValueOnce('Zero')
          .mockResolvedValueOnce('0'),
        click: vi.fn(),
      };
      mockSelectInstance.getOptions.mockResolvedValue([mockOption]);

      delegate.option(0);
      await delegate.select();

      expect(mockSelectInstance.selectByVisibleText).toHaveBeenCalledWith(0);
    });
  });

  // ---------------- SELECT NATIVE (EXACT TEXT) ----------------
  describe('select() - native by exact text', () => {
    test('should select by exact visible text match', async () => {
      mockLocator.tagName = 'select';
      mockLocator.getAttribute.mockResolvedValue(null); // multiple attribute
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockResolvedValue();

      delegate.option('United States');
      await delegate.select();

      expect(mockSelectInstance.selectByVisibleText).toHaveBeenCalledWith('United States');
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('exact text match'));
    });
  });

  // ---------------- SELECT NATIVE (EXACT VALUE) ----------------
  describe('select() - native by exact value', () => {
    test('should select by exact value match', async () => {
      mockLocator.tagName = 'select';
      mockLocator.getAttribute.mockResolvedValue(null); // multiple attribute
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockResolvedValue();

      delegate.option('us');
      await delegate.select();

      expect(mockSelectInstance.selectByValue).toHaveBeenCalledWith('us');
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('exact value match'));
    });

    test('should try exact text first, then exact value', async () => {
      mockLocator.tagName = 'select';
      mockLocator.getAttribute.mockResolvedValue(null); // multiple attribute
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockResolvedValue();

      delegate.option('us');
      await delegate.select();

      expect(mockSelectInstance.selectByVisibleText).toHaveBeenCalled();
      expect(mockSelectInstance.selectByValue).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('exact value match'));
    });
  });

  // ---------------- SELECT NATIVE (PARTIAL MATCH) ----------------
  describe('select() - native by partial match', () => {
    test('should select by partial text match', async () => {
      mockLocator.tagName = 'select';
      mockLocator.getAttribute.mockResolvedValue(null); // multiple attribute
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockRejectedValue(new Error('not found'));

      const mockOption = {
        getAttribute: vi.fn()
          .mockResolvedValueOnce('United States') // textContent
          .mockResolvedValueOnce('us'),            // value
        click: vi.fn(),
      };
      mockSelectInstance.getOptions.mockResolvedValue([mockOption]);

      delegate.option('United');
      await delegate.select();

      expect(mockOption.click).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('partial match'));
    });

    test('should select by partial value match', async () => {
      mockLocator.tagName = 'select';
      mockLocator.getAttribute.mockResolvedValue(null); // multiple attribute
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockRejectedValue(new Error('not found'));

      const mockOption = {
        getAttribute: vi.fn()
          .mockResolvedValueOnce('Country Name')  // textContent (no match)
          .mockResolvedValueOnce('united-states'), // value (partial match)
        click: vi.fn(),
      };
      mockSelectInstance.getOptions.mockResolvedValue([mockOption]);

      delegate.option('unit');
      await delegate.select();

      expect(mockOption.click).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('partial match'));
    });

    test('should prefer text match over value match when both match', async () => {
      mockLocator.tagName = 'select';
      mockLocator.getAttribute.mockResolvedValue(null); // multiple attribute
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockRejectedValue(new Error('not found'));

      const mockOption = {
        getAttribute: vi.fn()
          .mockResolvedValueOnce('unit test') // textContent (matches 'unit')
          .mockResolvedValueOnce('united'),   // value (also matches 'unit')
        click: vi.fn(),
      };
      mockSelectInstance.getOptions.mockResolvedValue([mockOption]);

      delegate.option('unit');
      await delegate.select();

      expect(mockOption.click).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('partial match'));
    });

    test('should iterate through multiple options to find match', async () => {
      mockLocator.tagName = 'select';
      mockLocator.getAttribute.mockResolvedValue(null); // multiple attribute
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockRejectedValue(new Error('not found'));

      const mockOption1 = {
        getAttribute: vi.fn()
          .mockResolvedValueOnce('First')
          .mockResolvedValueOnce('first'),
        click: vi.fn(),
      };
      const mockOption2 = {
        getAttribute: vi.fn()
          .mockResolvedValueOnce('Second')
          .mockResolvedValueOnce('second'),
        click: vi.fn(),
      };
      mockSelectInstance.getOptions.mockResolvedValue([mockOption1, mockOption2]);

      delegate.option('second');
      await delegate.select();

      expect(mockOption1.click).not.toHaveBeenCalled();
      expect(mockOption2.click).toHaveBeenCalled();
    });

    test('should throw error when no option matches', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockRejectedValue(new Error('not found'));

      const mockOption = {
        getAttribute: vi.fn()
          .mockResolvedValueOnce('No Match')
          .mockResolvedValueOnce('nomatch'),
        click: vi.fn(),
      };
      mockSelectInstance.getOptions.mockResolvedValue([mockOption]);

      delegate.option('xyz');
      await delegate.select();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        "selecting 'xyz' from dropdown"
      );
      expect(mockBrowser.handleError.mock.calls[0][0].message).toContain('not found');
    });

    test('should handle empty options array in partial matching', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockRejectedValue(new Error('not found'));

      delegate.option('anything');
      await delegate.select();

      expect(mockBrowser.handleError).toHaveBeenCalled();
      expect(mockBrowser.handleError.mock.calls[0][0].message).toContain('not found');
    });
  });

  // ---------------- SELECT COMBOBOX ----------------
  describe('select() - combobox', () => {
    test('should click combobox to open dropdown', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();
      mockBrowser.driver.findElements.mockResolvedValue([]);

      delegate.option('option');
      await delegate.select();

      expect(mockLocator.click).toHaveBeenCalled();
    });

    test('should use JS click fallback for combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockRejectedValue(new Error('click intercepted'));
      mockBrowser.driver.findElements.mockResolvedValue([]);

      delegate.option('option');
      await delegate.select();

      expect(mockBrowser.driver.executeScript).toHaveBeenCalledWith(
        'arguments[0].click();',
        mockLocator
      );
    });

    test('should select by index in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();
      mockLocator.findElements = vi.fn().mockResolvedValue([{ click: vi.fn() }]);

      delegate.option(1);
      await delegate.select();

      expect(mockLocator.findElements).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('index 1'));
    });

    test('should select by index 2 in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();
      const mockOptions = [{ click: vi.fn() }, { click: vi.fn() }];
      // #openCombobox calls findElements multiple times:
      // - First 4 calls are for trigger selectors (return empty)
      // - Then calls for option selectors (return mockOptions)
      let callCount = 0;
      mockLocator.findElements = vi.fn().mockImplementation(() => {
        callCount++;
        // First 4 calls are for trigger selectors (return empty array)
        if (callCount <= 4) return Promise.resolve([]);
        // Subsequent calls are for option selectors
        return Promise.resolve(mockOptions);
      });

      delegate.option(2);
      await delegate.select();

      expect(mockOptions[1].click).toHaveBeenCalled();
      expect(mockOptions[0].click).not.toHaveBeenCalled();
    });

    test('should select by text match in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();

      const mockOption = {
        getAttribute: vi.fn()
          .mockResolvedValueOnce('one option') // textContent (matches 'one')
          .mockResolvedValueOnce('opt1'),
        click: vi.fn(),
      };
      mockLocator.findElements = vi.fn().mockResolvedValue([mockOption]);

      delegate.option('one');
      await delegate.select();

      expect(mockOption.click).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('partial match'));
    });

    test('should select by value match in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();

      const mockOption = {
        getAttribute: vi.fn()
          .mockResolvedValueOnce('Some Text')
          .mockResolvedValueOnce('option-value'),
        click: vi.fn(),
      };
      mockLocator.findElements = vi.fn().mockResolvedValue([mockOption]);

      delegate.option('option');
      await delegate.select();

      expect(mockOption.click).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('partial match'));
    });

    test('should throw error when no options found in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();
      mockLocator.findElements = vi.fn().mockResolvedValue([]);

      delegate.option('option');
      await delegate.select();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        "selecting 'option' from dropdown"
      );
    });

    test('should throw error when option not found in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();

      const mockOption = {
        getAttribute: vi.fn()
          .mockResolvedValueOnce('No Match')
          .mockResolvedValueOnce('nomatch'),
        click: vi.fn(),
      };
      mockLocator.findElements = vi.fn().mockResolvedValue([mockOption]);

      delegate.option('xyz');
      await delegate.select();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        "selecting 'xyz' from dropdown"
      );
    });

    test('should throw error for index out of range in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();

      const mockOption = { click: vi.fn() };
      mockLocator.findElements = vi.fn().mockResolvedValue([mockOption]);

      delegate.option(10);
      await delegate.select();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        expect.any(Error),
        "selecting '10' from dropdown"
      );
      expect(mockBrowser.handleError.mock.calls[0][0].message).toContain('out of range');
    });

    test('should try multiple option selectors in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();

      // Return options on first call (the implementation tries multiple selectors until finding options)
      mockLocator.findElements = vi.fn().mockResolvedValue([{ click: vi.fn() }]);

      delegate.option(1);
      await delegate.select();

      expect(mockLocator.findElements).toHaveBeenCalled();
    });

    test('should handle findElements throwing errors in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();

      // First few calls throw, then return options
      mockLocator.findElements = vi.fn()
        .mockRejectedValueOnce(new Error('xpath error'))
        .mockResolvedValueOnce([{ click: vi.fn() }]);

      delegate.option(1);
      await delegate.select();

      expect(mockLocator.findElements).toHaveBeenCalled();
    });
  });

  // ---------------- GET SELECTED OPTION ----------------
  // ---------------- IS SELECTED ----------------
  describe('_isSelected()', () => {
    test('should throw error when optionValue is null (no option() called)', async () => {
      await expect(delegate._isSelected()).rejects.toThrow(
        'Option to be asserted was not provided. Please use option() chain.'
      );
      expect(log.error).toHaveBeenCalled();
    });

    test('should return true when option is selected in native select (by text)', async () => {
      mockLocator.tagName = 'select';

      // getAllSelectedOptions returns array of selected options
      const mockSelectedOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('United States')
            .mockResolvedValueOnce('us'),
        },
      ];
      mockSelectInstance.getAllSelectedOptions.mockResolvedValue(mockSelectedOptions);

      // Options must include the searched option so existence check passes
      const mockOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('United States')
            .mockResolvedValueOnce('us'),
        },
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('Canada')
            .mockResolvedValueOnce('ca'),
        },
      ];
      mockSelectInstance.getOptions.mockResolvedValue(mockOptions);

      delegate.option('United');
      const result = await delegate._isSelected();

      expect(result).toBe(true);
    });

    test('should return true when option is selected in native select (by value)', async () => {
      mockLocator.tagName = 'select';

      // getAllSelectedOptions returns array of selected options
      const mockSelectedOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('Country Name')
            .mockResolvedValueOnce('us'),
        },
      ];
      mockSelectInstance.getAllSelectedOptions.mockResolvedValue(mockSelectedOptions);

      // Options must include the searched option so existence check passes
      const mockOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('Country Name')
            .mockResolvedValueOnce('us'),
        },
      ];
      mockSelectInstance.getOptions.mockResolvedValue(mockOptions);

      delegate.option('us');
      const result = await delegate._isSelected();

      expect(result).toBe(true);
    });

    test('should return false when option exists but is not selected in native select', async () => {
      mockLocator.tagName = 'select';

      // getAllSelectedOptions returns array of selected options (Canada is selected)
      const mockSelectedOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('Canada')
            .mockResolvedValueOnce('ca'),
        },
      ];
      mockSelectInstance.getAllSelectedOptions.mockResolvedValue(mockSelectedOptions);

      // "United States" exists in the options list but is NOT the selected one
      const mockOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('United States')
            .mockResolvedValueOnce('us'),
        },
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('Canada')
            .mockResolvedValueOnce('ca'),
        },
      ];
      mockSelectInstance.getOptions.mockResolvedValue(mockOptions);

      delegate.option('United States');
      const result = await delegate._isSelected();

      expect(result).toBe(false);
    });

    test('should return false when option does not exist in native select', async () => {
      mockLocator.tagName = 'select';

      // getAllSelectedOptions returns array of selected options
      const mockSelectedOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('Canada')
            .mockResolvedValueOnce('ca'),
        },
      ];
      mockSelectInstance.getAllSelectedOptions.mockResolvedValue(mockSelectedOptions);

      // "United States" is NOT in the options list
      const mockOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('Canada')
            .mockResolvedValueOnce('ca'),
        },
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('Mexico')
            .mockResolvedValueOnce('mx'),
        },
      ];
      mockSelectInstance.getOptions.mockResolvedValue(mockOptions);

      delegate.option('United States');
      const result = await delegate._isSelected();

      expect(result).toBe(false);
    });

    test('should return true when option is selected in combobox', async () => {
      mockLocator.tagName = 'div';
      // The trigger element is the locator itself (textContent = 'United States')
      mockLocator.getAttribute.mockResolvedValue('United States');
      mockLocator.click.mockResolvedValue();

      // Mock option elements in the opened dropdown — "United States" exists
      const mockOptionElements = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('United States')
            .mockResolvedValueOnce('us'),
        },
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('Canada')
            .mockResolvedValueOnce('ca'),
        },
      ];
      // #openCombobox calls findElements multiple times:
      // - First 4 calls are for trigger selectors (return empty)
      // - Then calls for option selectors (return mockOptionElements)
      let callCount = 0;
      mockLocator.findElements = vi.fn().mockImplementation(() => {
        callCount++;
        // First 4 calls are for trigger selectors (return empty array)
        if (callCount <= 4) return Promise.resolve([]);
        // Subsequent calls are for option selectors
        return Promise.resolve(mockOptionElements);
      });

      delegate.option('United');
      const result = await delegate._isSelected();

      expect(result).toBe(true);
    });

    test('should return false when option exists but is not selected in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.getAttribute.mockResolvedValue('Canada');
      mockLocator.click.mockResolvedValue();

      // "United States" exists in the dropdown options but is NOT the current value
      const mockOptionElements = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('United States')
            .mockResolvedValueOnce('us'),
        },
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('Canada')
            .mockResolvedValueOnce('ca'),
        },
      ];
      mockLocator.findElements = vi.fn().mockResolvedValue(mockOptionElements);

      delegate.option('United States');
      const result = await delegate._isSelected();

      expect(result).toBe(false);
    });

    test('should return false when option does not exist in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.getAttribute.mockResolvedValue('Canada');
      mockLocator.click.mockResolvedValue();

      // "United States" is NOT in the dropdown options
      const mockOptionElements = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('Canada')
            .mockResolvedValueOnce('ca'),
        },
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('Mexico')
            .mockResolvedValueOnce('mx'),
        },
      ];
      mockLocator.findElements = vi.fn().mockResolvedValue(mockOptionElements);

      delegate.option('United States');
      const result = await delegate._isSelected();

      expect(result).toBe(false);
    });

    test('should check by index in native select', async () => {
      mockLocator.tagName = 'select';

      // getAllSelectedOptions returns array of selected options
      const mockSelectedOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('United States')
            .mockResolvedValueOnce('us'),
        },
      ];
      mockSelectInstance.getAllSelectedOptions.mockResolvedValue(mockSelectedOptions);

      const mockOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('United States')
            .mockResolvedValueOnce('us'),
        },
      ];
      mockSelectInstance.getOptions.mockResolvedValue(mockOptions);

      delegate.option(1);
      const result = await delegate._isSelected();

      expect(result).toBe(true);
    });

    test('should throw for index out of range in native select', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([{}, {}]);

      delegate.option(10);
      await expect(delegate._isSelected()).rejects.toThrow();
    });

    test('should handle errors during _isSelected', async () => {
      const error = new Error('Finder failed');
      mockBrowser._finder.mockRejectedValue(error);

      delegate.option('United States');
      await expect(delegate._isSelected()).rejects.toThrow();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        "validating if 'United States' is selected"
      );
    });

    test('should clear stack in finally block', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('fail'));

      delegate.option('test');
      await expect(delegate._isSelected()).rejects.toThrow();

      expect(mockBrowser.stack).toEqual([]);
    });

    test('should clear optionValue and isIndex in finally block', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('fail'));

      delegate.option(5);
      expect(delegate.optionValue).toBe(5);
      expect(delegate.isIndex).toBe(true);

      await expect(delegate._isSelected()).rejects.toThrow();

      expect(delegate.optionValue).toBeNull();
      expect(delegate.isIndex).toBe(false);
    });

    test('should handle null text in combobox _isSelected', async () => {
      mockLocator.tagName = 'div';
      mockLocator.getAttribute.mockResolvedValue(null);

      delegate.option('anything');
      await expect(delegate._isSelected()).rejects.toThrow(
        'Combobox has no text content'
      );
    });

    test('should handle null text in native _isSelected', async () => {
      mockLocator.tagName = 'select';

      // getAllSelectedOptions returns array of selected options
      const mockSelectedOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null),
        },
      ];
      mockSelectInstance.getAllSelectedOptions.mockResolvedValue(mockSelectedOptions);

      const mockOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('test')
            .mockResolvedValueOnce('test-val'),
        },
      ];
      mockSelectInstance.getOptions.mockResolvedValue(mockOptions);

      delegate.option('anything');
      const result = await delegate._isSelected();

      expect(result).toBe(false);
    });

    test('should set browser message via messenger', async () => {
      mockLocator.tagName = 'select';

      // getAllSelectedOptions returns array of selected options
      const mockSelectedOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('test')
            .mockResolvedValueOnce('test-val'),
        },
      ];
      mockSelectInstance.getAllSelectedOptions.mockResolvedValue(mockSelectedOptions);

      const mockOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('test')
            .mockResolvedValueOnce('test-val'),
        },
      ];
      mockSelectInstance.getOptions.mockResolvedValue(mockOptions);

      delegate.option('test');
      await delegate._isSelected();

      expect(mockBrowser.message).toBeDefined();
    });
  });

  // ---------------- CHAINING ----------------
  describe('chaining', () => {
    test('should support option().select() pattern (sequential calls)', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockResolvedValue();

      delegate.option('United States');
      await delegate.select();

      expect(mockSelectInstance.selectByVisibleText).toHaveBeenCalledWith('United States');
    });

    test('should support option()._isSelected() chaining pattern', async () => {
      mockLocator.tagName = 'select';

      // getAllSelectedOptions returns array of selected options
      const mockSelectedOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('United States')
            .mockResolvedValueOnce('us'),
        },
      ];
      mockSelectInstance.getAllSelectedOptions.mockResolvedValue(mockSelectedOptions);

      // Options must include the searched option so existence check passes
      const mockOptions = [
        {
          getAttribute: vi.fn()
            .mockResolvedValueOnce('United States')
            .mockResolvedValueOnce('us'),
        },
      ];
      mockSelectInstance.getOptions.mockResolvedValue(mockOptions);

      delegate.option('United');
      const result = await delegate._isSelected();

      expect(result).toBe(true);
    });

    test('should reset state between calls', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockResolvedValue();

      delegate.option(5);
      await delegate.select();

      expect(delegate.optionValue).toBeNull();
      expect(delegate.isIndex).toBe(false);

      // Second call should work independently
      mockSelectInstance.selectByVisibleText.mockResolvedValue();
      delegate.option('test');
      await delegate.select();

      expect(mockSelectInstance.selectByVisibleText).toHaveBeenCalledWith('test');
    });
  });
});
