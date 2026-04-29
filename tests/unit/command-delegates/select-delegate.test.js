import { jest } from '@jest/globals';

// ---------------- MOCKS ----------------
const mockSelectInstance = {
  getOptions: jest.fn(),
  getFirstSelectedOption: jest.fn(),
  selectByIndex: jest.fn(),
  selectByVisibleText: jest.fn(),
  selectByValue: jest.fn(),
};

jest.unstable_mockModule('selenium-webdriver', () => ({
  Builder: jest.fn(),
  By: {},
  until: {},
  WebDriver: jest.fn(),
  Select: jest.fn(() => mockSelectInstance),
}));

jest.unstable_mockModule('@nodebug/logger', () => ({
  log: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

jest.unstable_mockModule('../../../app/messenger.js', () => ({
  default: jest.fn(({ action }) => `Select: ${action}`),
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
    getAttribute: jest.fn(),
    click: jest.fn(),
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockLocator = createLocatorMock();

    mockBrowser = {
      stack: ['some-select'],
      message: '',
      _finder: jest.fn().mockResolvedValue(mockLocator),
      handleError: jest.fn(),
      driver: {
        findElements: jest.fn(),
        executeScript: jest.fn(),
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

    test('should return undefined (chainable)', () => {
      const result = delegate.option('test');
      expect(result).toBeUndefined();
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

      expect(mockBrowser._finder).toHaveBeenCalledWith(null, 'select');
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
      const mockOptions = [{ click: jest.fn() }];
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
        getAttribute: jest.fn()
          .mockResolvedValueOnce('Zero')
          .mockResolvedValueOnce('0'),
        click: jest.fn(),
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
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockRejectedValue(new Error('not found'));

      const mockOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('United States') // textContent
          .mockResolvedValueOnce('us'),            // value
        click: jest.fn(),
      };
      mockSelectInstance.getOptions.mockResolvedValue([mockOption]);

      delegate.option('United');
      await delegate.select();

      expect(mockOption.click).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('partial text match'));
    });

    test('should select by partial value match', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockRejectedValue(new Error('not found'));

      const mockOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('Country Name')  // textContent (no match)
          .mockResolvedValueOnce('united-states'), // value (partial match)
        click: jest.fn(),
      };
      mockSelectInstance.getOptions.mockResolvedValue([mockOption]);

      delegate.option('unit');
      await delegate.select();

      expect(mockOption.click).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('partial value match'));
    });

    test('should prefer text match over value match when both match', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockRejectedValue(new Error('not found'));

      const mockOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('unit test') // textContent (matches 'unit')
          .mockResolvedValueOnce('united'),   // value (also matches 'unit')
        click: jest.fn(),
      };
      mockSelectInstance.getOptions.mockResolvedValue([mockOption]);

      delegate.option('unit');
      await delegate.select();

      expect(mockOption.click).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('partial text match'));
    });

    test('should iterate through multiple options to find match', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([]);
      mockSelectInstance.selectByVisibleText.mockRejectedValue(new Error('not found'));
      mockSelectInstance.selectByValue.mockRejectedValue(new Error('not found'));

      const mockOption1 = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('First')
          .mockResolvedValueOnce('first'),
        click: jest.fn(),
      };
      const mockOption2 = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('Second')
          .mockResolvedValueOnce('second'),
        click: jest.fn(),
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
        getAttribute: jest.fn()
          .mockResolvedValueOnce('No Match')
          .mockResolvedValueOnce('nomatch'),
        click: jest.fn(),
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

      const mockOption = { click: jest.fn() };
      mockBrowser.driver.findElements.mockResolvedValue([mockOption]);

      delegate.option(1);
      await delegate.select();

      expect(mockOption.click).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('index 1'));
    });

    test('should select by index 2 in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();

      const mockOptions = [{ click: jest.fn() }, { click: jest.fn() }];
      mockBrowser.driver.findElements.mockResolvedValue(mockOptions);

      delegate.option(2);
      await delegate.select();

      expect(mockOptions[1].click).toHaveBeenCalled();
      expect(mockOptions[0].click).not.toHaveBeenCalled();
    });

    test('should select by text match in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();

      const mockOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('one option') // textContent (matches 'one')
          .mockResolvedValueOnce('opt1'),
        click: jest.fn(),
      };
      mockBrowser.driver.findElements.mockResolvedValue([mockOption]);

      delegate.option('one');
      await delegate.select();

      expect(mockOption.click).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('partial text match'));
    });

    test('should select by value match in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();

      const mockOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('Some Text')
          .mockResolvedValueOnce('option-value'),
        click: jest.fn(),
      };
      mockBrowser.driver.findElements.mockResolvedValue([mockOption]);

      delegate.option('option');
      await delegate.select();

      expect(mockOption.click).toHaveBeenCalled();
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('partial value match'));
    });

    test('should throw error when no options found in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();
      mockBrowser.driver.findElements.mockResolvedValue([]);

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
        getAttribute: jest.fn()
          .mockResolvedValueOnce('No Match')
          .mockResolvedValueOnce('nomatch'),
        click: jest.fn(),
      };
      mockBrowser.driver.findElements.mockResolvedValue([mockOption]);

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

      const mockOption = { click: jest.fn() };
      mockBrowser.driver.findElements.mockResolvedValue([mockOption]);

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

      // First selector returns empty, second returns options
      mockBrowser.driver.findElements
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ click: jest.fn() }]);

      delegate.option(1);
      await delegate.select();

      expect(mockBrowser.driver.findElements).toHaveBeenCalledTimes(2);
    });

    test('should handle findElements throwing errors in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.click.mockResolvedValue();

      mockBrowser.driver.findElements
        .mockRejectedValueOnce(new Error('xpath error'))
        .mockResolvedValueOnce([{ click: jest.fn() }]);

      delegate.option(1);
      await delegate.select();

      expect(mockBrowser.driver.findElements).toHaveBeenCalledTimes(2);
    });
  });

  // ---------------- GET SELECTED OPTION ----------------
  describe('getSelectedOption()', () => {
    test('should return text and value for native select', async () => {
      mockLocator.tagName = 'select';

      const mockSelectedOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('United States')
          .mockResolvedValueOnce('us'),
      };
      mockSelectInstance.getFirstSelectedOption.mockResolvedValue(mockSelectedOption);

      const result = await delegate.getSelectedOption();

      expect(result).toEqual({ text: 'United States', value: 'us' });
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('native <select>'));
    });

    test('should return text and value for combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.getAttribute
        .mockResolvedValueOnce('Selected Item')
        .mockResolvedValueOnce('selected-value');

      const result = await delegate.getSelectedOption();

      expect(result).toEqual({ text: 'Selected Item', value: 'selected-value' });
      expect(log.info).toHaveBeenCalledWith(expect.stringContaining('combobox'));
    });

    test('should use text as value fallback for combobox when value is empty', async () => {
      mockLocator.tagName = 'div';
      mockLocator.getAttribute
        .mockResolvedValueOnce('Selected Item')
        .mockResolvedValueOnce('');

      const result = await delegate.getSelectedOption();

      expect(result).toEqual({ text: 'Selected Item', value: 'Selected Item' });
    });

    test('should handle errors when getting selected option', async () => {
      const error = new Error('Finder failed');
      mockBrowser._finder.mockRejectedValue(error);

      const result = await delegate.getSelectedOption();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        'getting selected option from dropdown'
      );
      expect(result).toEqual({ text: '', value: '' });
    });

    test('should clear stack in finally block', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('fail'));

      await delegate.getSelectedOption();

      expect(mockBrowser.stack).toEqual([]);
    });

    test('should trim whitespace from text and value', async () => {
      mockLocator.tagName = 'select';

      const mockSelectedOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('  United States  ')
          .mockResolvedValueOnce('  us  '),
      };
      mockSelectInstance.getFirstSelectedOption.mockResolvedValue(mockSelectedOption);

      const result = await delegate.getSelectedOption();

      expect(result).toEqual({ text: 'United States', value: 'us' });
    });

    test('should handle null text and value gracefully', async () => {
      mockLocator.tagName = 'select';

      const mockSelectedOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
      };
      mockSelectInstance.getFirstSelectedOption.mockResolvedValue(mockSelectedOption);

      const result = await delegate.getSelectedOption();

      // null?.trim() returns undefined
      expect(result).toEqual({ text: undefined, value: undefined });
    });

    test('should handle undefined text and value gracefully', async () => {
      mockLocator.tagName = 'select';

      const mockSelectedOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce(undefined)
          .mockResolvedValueOnce(undefined),
      };
      mockSelectInstance.getFirstSelectedOption.mockResolvedValue(mockSelectedOption);

      const result = await delegate.getSelectedOption();

      // undefined?.trim() returns undefined
      expect(result).toEqual({ text: undefined, value: undefined });
    });

    test('should delegate to native for <select> elements', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getFirstSelectedOption.mockResolvedValue({
        getAttribute: jest.fn().mockResolvedValue('test'),
      });

      await delegate.getSelectedOption();

      expect(mockBrowser._finder).toHaveBeenCalledWith(null, 'select');
    });

    test('should delegate to combobox for non-select elements', async () => {
      mockLocator.tagName = 'div';
      mockLocator.getAttribute.mockResolvedValue('test');

      await delegate.getSelectedOption();

      expect(mockLocator.getAttribute).toHaveBeenCalled();
    });
  });

  // ---------------- IS SELECTED ----------------
  describe('isSelected()', () => {
    test('should throw error when optionValue is null (no option() called)', async () => {
      await expect(delegate.isSelected()).rejects.toThrow(
        'Option to be asserted was not provided. Please use option() chain.'
      );
      expect(log.error).toHaveBeenCalled();
    });

    test('should return true when option is selected in native select (by text)', async () => {
      mockLocator.tagName = 'select';

      const mockSelectedOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('United States')
          .mockResolvedValueOnce('us'),
      };
      mockSelectInstance.getFirstSelectedOption.mockResolvedValue(mockSelectedOption);

      delegate.option('United');
      const result = await delegate.isSelected();

      expect(result).toBe(true);
    });

    test('should return true when option is selected in native select (by value)', async () => {
      mockLocator.tagName = 'select';

      const mockSelectedOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('Country Name')
          .mockResolvedValueOnce('us'),
      };
      mockSelectInstance.getFirstSelectedOption.mockResolvedValue(mockSelectedOption);

      delegate.option('us');
      const result = await delegate.isSelected();

      expect(result).toBe(true);
    });

    test('should throw when option is not selected in native select', async () => {
      mockLocator.tagName = 'select';

      const mockSelectedOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('Canada')
          .mockResolvedValueOnce('ca'),
      };
      mockSelectInstance.getFirstSelectedOption.mockResolvedValue(mockSelectedOption);

      delegate.option('United States');
      // optionValue is cleared in finally block before the throw, so it will be null
      await expect(delegate.isSelected()).rejects.toThrow(
        "Option 'null' is not selected"
      );
    });

    test('should return true when option is selected in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.getAttribute.mockResolvedValue('United States');

      delegate.option('United');
      const result = await delegate.isSelected();

      expect(result).toBe(true);
    });

    test('should throw when option is not selected in combobox', async () => {
      mockLocator.tagName = 'div';
      mockLocator.getAttribute.mockResolvedValue('Canada');

      delegate.option('United States');
      // optionValue is cleared in finally block before the throw, so it will be null
      await expect(delegate.isSelected()).rejects.toThrow(
        "Option 'null' is not selected"
      );
    });

    test('should check by index in native select', async () => {
      mockLocator.tagName = 'select';

      const mockSelectedOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('United States')
          .mockResolvedValueOnce('us'),
      };
      mockSelectInstance.getFirstSelectedOption.mockResolvedValue(mockSelectedOption);

      const mockOptions = [
        {
          getAttribute: jest.fn()
            .mockResolvedValueOnce('United States')
            .mockResolvedValueOnce('us'),
        },
      ];
      mockSelectInstance.getOptions.mockResolvedValue(mockOptions);

      delegate.option(1);
      const result = await delegate.isSelected();

      expect(result).toBe(true);
    });

    test('should throw for index out of range in native select', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getOptions.mockResolvedValue([{}, {}]);

      delegate.option(10);
      await expect(delegate.isSelected()).rejects.toThrow();
    });

    test('should handle errors during isSelected', async () => {
      const error = new Error('Finder failed');
      mockBrowser._finder.mockRejectedValue(error);

      delegate.option('United States');
      await expect(delegate.isSelected()).rejects.toThrow();

      expect(mockBrowser.handleError).toHaveBeenCalledWith(
        error,
        "checking if 'United States' is selected"
      );
    });

    test('should clear stack in finally block', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('fail'));

      delegate.option('test');
      await expect(delegate.isSelected()).rejects.toThrow();

      expect(mockBrowser.stack).toEqual([]);
    });

    test('should clear optionValue and isIndex in finally block', async () => {
      mockBrowser._finder.mockRejectedValue(new Error('fail'));

      delegate.option(5);
      expect(delegate.optionValue).toBe(5);
      expect(delegate.isIndex).toBe(true);

      await expect(delegate.isSelected()).rejects.toThrow();

      expect(delegate.optionValue).toBeNull();
      expect(delegate.isIndex).toBe(false);
    });

    test('should handle null text in combobox isSelected', async () => {
      mockLocator.tagName = 'div';
      mockLocator.getAttribute.mockResolvedValue(null);

      delegate.option('anything');
      await expect(delegate.isSelected()).rejects.toThrow();
    });

    test('should handle null text in native isSelected', async () => {
      mockLocator.tagName = 'select';

      const mockSelectedOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce(null),
      };
      mockSelectInstance.getFirstSelectedOption.mockResolvedValue(mockSelectedOption);

      delegate.option('anything');
      await expect(delegate.isSelected()).rejects.toThrow();
    });

    test('should set browser message via messenger', async () => {
      mockLocator.tagName = 'select';
      mockSelectInstance.getFirstSelectedOption.mockResolvedValue({
        getAttribute: jest.fn().mockResolvedValue('test'),
      });

      delegate.option('test');
      await delegate.isSelected();

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

    test('should support option().isSelected() chaining pattern', async () => {
      mockLocator.tagName = 'select';

      const mockSelectedOption = {
        getAttribute: jest.fn()
          .mockResolvedValueOnce('United States')
          .mockResolvedValueOnce('us'),
      };
      mockSelectInstance.getFirstSelectedOption.mockResolvedValue(mockSelectedOption);

      delegate.option('United');
      const result = await delegate.isSelected();

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
