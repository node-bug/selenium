import WebBrowser from '../../index.js';
import sinon from 'sinon';

describe('WebBrowser Unit Tests', () => {
  let browser;
  let mockDriver;
  let mockElement;
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    mockDriver = {
      getSession: sandbox.stub().resolves({ id: 'test-session' }),
      executeScript: sandbox.stub().resolves({}),
      takeScreenshot: sandbox.stub().resolves('base64-screenshot'),
      switchTo: {
        defaultContent: sandbox.stub().resolves(),
        frame: sandbox.stub().resolves(),
        alert: sandbox.stub().returns({
          getText: sandbox.stub().resolves('Test Alert'),
          accept: sandbox.stub().resolves(),
          dismiss: sandbox.stub().resolves(),
          sendKeys: sandbox.stub().resolves()
        })
      },
      wait: sandbox.stub().resolves(),
      sleep: sandbox.stub().resolves(),
      getTitle: sandbox.stub().resolves('Test Page'),
      getCurrentUrl: sandbox.stub().resolves('https://test.com'),
      findElements: sandbox.stub().resolves([]),
      getRect: sandbox.stub().resolves({ x: 0, y: 0, width: 100, height: 50 }),
      click: sandbox.stub().resolves(),
      isEnabled: sandbox.stub().resolves(true),
      getAttribute: sandbox.stub().resolves(null),
      isSelected: sandbox.stub().resolves(false),
      find: sandbox.stub().resolves(mockElement),
      actions: sandbox.stub().returns({
        move: sandbox.stub().returns({
          pause: sandbox.stub().returns({
            click: sandbox.stub().returns({ perform: sandbox.stub().resolves() })
          })
        }),
        doubleClick: sandbox.stub().returns({ perform: sandbox.stub().resolves() }),
        contextClick: sandbox.stub().returns({ perform: sandbox.stub().resolves() }),
        keyDown: sandbox.stub().returns({ sendKeys: sandbox.stub().returns({ keyUp: sandbox.stub().returns({ perform: sandbox.stub().resolves() }) }) })
      })
    };

    mockElement = {
      tagName: 'input',
      getRect: sandbox.stub().resolves({ x: 0, y: 0, width: 100, height: 50 }),
      click: sandbox.stub().resolves(),
      sendKeys: sandbox.stub().resolves(),
      clear: sandbox.stub().resolves(),
      getText: sandbox.stub().resolves('test text'),
      getAttribute: sandbox.stub().resolves('test value'),
      isSelected: sandbox.stub().resolves(false),
      isEnabled: sandbox.stub().resolves(true),
      findElements: sandbox.stub().resolves([])
    };

    browser = new WebBrowser();
    browser.driver = mockDriver;
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('constructor', () => {
    it('should initialize with empty stack and locatorStrategy', () => {
      expect(browser.stack).toEqual([]);
      expect(browser.locatorStrategy).toBeDefined();
    });

    it('should set message property', () => {
      browser.message = 'test message';
      expect(browser.message).toBe('test message');
    });
  });

  describe('getDescriptions', () => {
    it('should split stack by OR conditions', () => {
      browser.stack = [
        { type: 'element', id: 'test1' },
        { type: 'condition', operator: 'or' },
        { type: 'element', id: 'test2' }
      ];
      const result = browser.getDescriptions();
      expect(result).toEqual([['element', 'test1'], ['element', 'test2']]);
    });

    it('should handle multiple OR conditions', () => {
      browser.stack = [
        { type: 'element', id: 'test1' },
        { type: 'condition', operator: 'or' },
        { type: 'element', id: 'test2' },
        { type: 'condition', operator: 'or' },
        { type: 'element', id: 'test3' }
      ];
      const result = browser.getDescriptions();
      expect(result).toEqual([['element', 'test1'], ['element', 'test2'], ['element', 'test3']]);
    });

    it('should handle stack without OR conditions', () => {
      browser.stack = [
        { type: 'element', id: 'test1' },
        { type: 'element', id: 'test2' }
      ];
      const result = browser.getDescriptions();
      expect(result).toEqual([['element', 'test1', 'element', 'test2']]);
    });
  });

  describe('finder', () => {
    it('should use default timeout from config', async () => {
      const finderStub = sandbox.stub().resolves(mockElement);
      browser.locatorStrategy.find = finderStub;
      await browser.finder();
      expect(finderStub.calledOnce).toBe(true);
    });

    it('should use custom timeout if provided', async () => {
      const finderStub = sandbox.stub().resolves(mockElement);
      browser.locatorStrategy.find = finderStub;
      await browser.finder(5000);
      expect(finderStub.calledOnce).toBe(true);
    });

    it('should retry on failure', async () => {
      const finderStub = sandbox.stub()
        .onFirstCall().rejects(new Error('Not found'))
        .onSecondCall().resolves(mockElement);
      browser.locatorStrategy.find = finderStub;
      const result = await browser.finder();
      expect(result).toBe(mockElement);
    });
  });

  describe('element builder', () => {
    it('should add element to stack', () => {
      const result = browser.element('test');
      expect(result).toBe(browser);
      expect(browser.stack[browser.stack.length - 1]).toEqual({
        type: 'element',
        id: 'test',
        exact: false,
        hidden: false,
        matches: [],
        index: false
      });
    });

    it('should preserve exact flag', () => {
      browser.exact();
      browser.element('test');
      expect(browser.stack[browser.stack.length - 1]).toEqual({
        type: 'element',
        id: 'test',
        exact: true,
        hidden: false,
        matches: [],
        index: false
      });
    });

    it('should preserve hidden flag', () => {
      browser.exact().hidden();
      browser.element('test');
      expect(browser.stack[browser.stack.length - 1]).toEqual({
        type: 'element',
        id: 'test',
        exact: true,
        hidden: true,
        matches: [],
        index: false
      });
    });

    it('should handle flag objects', () => {
      const flag = { exact: true, hidden: false };
      browser.element('test', flag);
      expect(browser.stack[browser.stack.length - 1]).toEqual({
        type: 'element',
        id: 'test',
        exact: true,
        hidden: false,
        matches: [],
        index: false
      });
    });
  });

  describe('exact() and hidden() methods', () => {
    it('should set exact flag', () => {
      const result = browser.exact();
      expect(result).toBe(browser);
      expect(browser.stack[browser.stack.length - 1]).toEqual({
        exact: true,
        hidden: false
      });
    });

    it('should set hidden flag', () => {
      const result = browser.hidden();
      expect(result).toBe(browser);
      expect(browser.stack[browser.stack.length - 1]).toEqual({
        exact: false,
        hidden: true
      });
    });

    it('should chain exact and hidden', () => {
      const result = browser.exact().hidden();
      expect(result).toBe(browser);
      expect(browser.stack[browser.stack.length - 1]).toEqual({
        exact: true,
        hidden: true
      });
    });
  });

  describe('write method', () => {
    it('should write text to input field', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.element('username').write('testuser');
      expect(mockElement.sendKeys.calledWith('testuser')).toBe(true);
    });

    it('should write text to textarea', async () => {
      mockElement.tagName = 'textarea';
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.textbox('description').write('test description');
      expect(mockElement.sendKeys.calledWith('test description')).toBe(true);
    });

    it('should handle content-editable elements', async () => {
      mockElement.tagName = 'div';
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.element('content').write('test');
      expect(mockElement.sendKeys.calledWith('test')).toBe(true);
    });
  });

  describe('find method', () => {
    it('should find element and reset stack', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.element('submit').find();
      expect(browser.stack).toEqual([]);
    });
  });

  describe('findAll method', () => {
    it('should find all matching elements', async () => {
      const mockElements = [mockElement, mockElement];
      browser.locatorStrategy.findAll = sandbox.stub().resolves(mockElements);
      const result = await browser.element('item').findAll();
      expect(result).toEqual(mockElements);
      expect(browser.stack).toEqual([]);
    });

    it('should throw error if no elements found', async () => {
      browser.locatorStrategy.findAll = sandbox.stub().resolves([]);
      await expect(browser.element('nonexistent').findAll()).rejects.toThrow('No elements matching the criteria were found');
    });
  });

  describe('text method', () => {
    it('should get text content', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      const result = await browser.element('welcome').text();
      expect(result).toBe('test text');
      expect(browser.stack).toEqual([]);
    });

    it('should get value attribute for input fields', async () => {
      mockElement.getAttribute = sandbox.stub().withArgs('textContent').resolves(null);
      mockElement.getAttribute = sandbox.stub().withArgs('value').resolves('input value');
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      const result = await browser.textbox('username').text();
      expect(result).toBe('input value');
    });
  });

  describe('attribute method', () => {
    it('should get attribute value', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      const result = await browser.element('link').attribute('href');
      expect(result).toBe('test value');
      expect(browser.stack).toEqual([]);
    });
  });

  describe('click method', () => {
    it('should click element', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.element('button').click();
      expect(mockElement.click.calledOnce).toBe(true);
      expect(browser.stack).toEqual([]);
    });

    it('should click at coordinates', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.element('button').click(10, 20);
      expect(mockElement.click.calledOnce).toBe(false);
      expect(mockDriver.actions().move().pause().click().perform.calledOnce).toBe(true);
      expect(browser.stack).toEqual([]);
    });
  });

  describe('doubleClick method', () => {
    it('should double click element', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.element('text').doubleClick();
      expect(mockDriver.actions().doubleClick().perform.calledOnce).toBe(true);
      expect(browser.stack).toEqual([]);
    });
  });

  describe('rightClick method', () => {
    it('should right click element', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.element('context-menu').rightClick();
      expect(mockDriver.actions().contextClick().perform.calledOnce).toBe(true);
      expect(browser.stack).toEqual([]);
    });
  });

  describe('focus method', () => {
    it('should focus element', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.element('input').focus();
      expect(mockDriver.executeScript.calledWith('arguments[0].focus();', mockElement)).toBe(true);
      expect(browser.stack).toEqual([]);
    });
  });

  describe('clear method', () => {
    it('should clear input field', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.textbox('username').clear();
      expect(mockElement.clear.calledOnce).toBe(true);
      expect(browser.stack).toEqual([]);
    });

    it('should clear textarea', async () => {
      mockElement.tagName = 'textarea';
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.textarea('description').clear();
      expect(mockElement.clear.calledOnce).toBe(true);
    });
  });

  describe('check and uncheck methods', () => {
    it('should check checkbox', async () => {
      mockElement.isSelected = sandbox.stub().resolves(false);
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.checkbox('agree').check();
      expect(mockElement.click.calledOnce).toBe(true);
    });

    it('should uncheck checkbox', async () => {
      mockElement.isSelected = sandbox.stub().resolves(true);
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.checkbox('agree').uncheck();
      expect(mockElement.click.calledOnce).toBe(true);
    });

    it('should skip if already checked', async () => {
      mockElement.isSelected = sandbox.stub().resolves(true);
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.checkbox('agree').check();
      expect(mockElement.click.calledOnce).toBe(false);
    });
  });

  describe('isVisible method', () => {
    it('should return true if element found', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      const result = await browser.element('submit').isVisible();
      expect(result).toBe(true);
      expect(browser.stack).toEqual([]);
    });

    it('should return false if element not found', async () => {
      browser.locatorStrategy.find = sandbox.stub().rejects(new Error('Not found'));
      const result = await browser.element('nonexistent').isVisible();
      expect(result).toBe(false);
      expect(browser.stack).toEqual([]);
    });
  });

  describe('isDisplayed method', () => {
    it('should return true if element found', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      const result = await browser.element('loading').isDisplayed();
      expect(result).toBe(true);
      expect(browser.stack).toEqual([]);
    });

    it('should throw error if element not found', async () => {
      browser.locatorStrategy.find = sandbox.stub().rejects(new Error('Not found'));
      await expect(browser.element('nonexistent').isDisplayed()).rejects.toThrow();
    });
  });

  describe('isNotDisplayed method', () => {
    it('should return true if element not found', async () => {
      browser.locatorStrategy.find = sandbox.stub().rejects(new Error('Not found'));
      const result = await browser.element('loading').isNotDisplayed();
      expect(result).toBe(true);
      expect(browser.stack).toEqual([]);
    });

    it('should throw error if element still visible', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await expect(browser.element('visible').isNotDisplayed()).rejects.toThrow();
    });
  });

  describe('isDisabled method', () => {
    it('should return true if element is disabled', async () => {
      mockElement.isEnabled = sandbox.stub().resolves(false);
      mockElement.getAttribute = sandbox.stub().resolves('disabled');
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      const result = await browser.button('submit').isDisabled();
      expect(result).toBe(true);
    });

    it('should return false if element is enabled', async () => {
      mockElement.isEnabled = sandbox.stub().resolves(true);
      mockElement.getAttribute = sandbox.stub().resolves(null);
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      const result = await browser.button('submit').isDisabled();
      expect(result).toBe(false);
    });
  });

  describe('screenshot method', () => {
    it('should take element screenshot', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      const result = await browser.element('form').screenshot();
      expect(result).toBe('base64-screenshot');
    });

    it('should take full page screenshot if no element', async () => {
      const result = await browser.screenshot();
      expect(result).toBe('base64-screenshot');
    });
  });

  describe('hide and unhide methods', () => {
    it('should hide elements', async () => {
      const mockElements = [mockElement];
      browser.locatorStrategy.findAll = sandbox.stub().resolves(mockElements);
      await browser.element('ad').hide();
      expect(mockDriver.executeScript.calledWith('arguments[0].style.opacity="0";', mockElement)).toBe(true);
    });

    it('should unhide elements', async () => {
      const mockElements = [mockElement];
      browser.locatorStrategy.findAll = sandbox.stub().resolves(mockElements);
      await browser.element('ad').unhide();
      expect(mockDriver.executeScript.calledWith('arguments[0].style.opacity="1";', mockElement)).toBe(true);
    });
  });

  describe('upload method', () => {
    it('should upload file', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.file('upload').upload('/path/to/file.txt');
      expect(mockElement.sendKeys.calledWith('/path/to/file.txt')).toBe(true);
    });
  });

  describe('scroll method', () => {
    it('should scroll element into view', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.element('footer').scroll();
      expect(mockDriver.executeScript.calledOnce).toBe(true);
    });

    it('should scroll with alignToTop=false', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.element('footer').scroll(false);
      expect(mockDriver.executeScript.calledOnce).toBe(true);
    });
  });

  describe('hover method', () => {
    it('should hover over element', async () => {
      browser.locatorStrategy.find = sandbox.stub().resolves(mockElement);
      await browser.element('menu').hover();
      expect(mockDriver.actions().move().perform.calledOnce).toBe(true);
    });
  });
});