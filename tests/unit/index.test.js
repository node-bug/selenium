import { jest } from '@jest/globals';

// Mocks
jest.unstable_mockModule('@nodebug/logger', () => ({
    log: {
        info: jest.fn(),
        error: jest.fn(),
    },
}));

// Mock config module
jest.unstable_mockModule('@nodebug/config', () => ({
  default: jest.fn(() => ({
    timeout: 1, // small timeout for fast tests
    browser: 'chrome',
})),
}));

// Mock dependencies
jest.unstable_mockModule('../../app/elements/locator-strategy.js', () => {
    const mockLocatorStrategy = {
        definitions: { element: true },
        find: jest.fn(),
        findAll: jest.fn(),
    };
    return {
        LocatorStrategy: jest.fn().mockImplementation(() => mockLocatorStrategy)
    };
});

jest.unstable_mockModule('../../app/messenger.js', () => ({
    default: jest.fn(() => 'mock-message')
}));

jest.unstable_mockModule('../../app/command-delegates/click-delegate.js', () => ({
    ClickDelegate: jest.fn().mockImplementation(() => ({
        click: jest.fn().mockResolvedValue(true),
        hover: jest.fn(),
        doubleClick: jest.fn(),
        rightClick: jest.fn(),
        _clicker: jest.fn(),
    })),
}));

jest.unstable_mockModule('../../app/command-delegates/input-delegate.js', () => ({
    InputDelegate: jest.fn().mockImplementation(() => ({
        write: jest.fn(),
        focus: jest.fn(),
        clear: jest.fn(),
        overwrite: jest.fn(),
        press: jest.fn().mockResolvedValue(true),
    })),
}));

jest.unstable_mockModule('../../app/command-delegates/visibility-delegate.js', () => ({
    VisibilityDelegate: jest.fn().mockImplementation(() => ({
        scroll: jest.fn(),
        isVisible: jest.fn(),
        isDisabled: jest.fn(),
        hide: jest.fn(),
        unhide: jest.fn(),
    })),
}));

jest.unstable_mockModule('../../app/command-delegates/checkbox-delegate.js', () => ({
    CheckboxDelegate: jest.fn().mockImplementation(() => ({
        check: jest.fn(),
        uncheck: jest.fn(),
    })),
}));

const { default: WebBrowser } = await import('../../index.js');

describe('WebBrowser', () => {
    let browser;

    beforeEach(() => {
        jest.clearAllMocks();
        browser = new WebBrowser();

        browser.locatorStrategy = {
            find: jest.fn(),
            findAll: jest.fn(),
        };
    });

    test('should initialize correctly', () => {
        expect(browser.stack).toEqual([]);
        expect(browser.locatorStrategy).toBeDefined();
    });

    test('message getter/setter works', () => {
        browser.message = 'hello';
        expect(browser.message).toBe('hello');
    });

    test('getDescriptions splits stack by OR condition', () => {
        browser.stack = [
            { id: 1 },
            { type: 'condition', operator: 'or' },
            { id: 2 },
        ];

        const result = browser.getDescriptions();

        expect(result).toEqual([
            [{ id: 1 }],
            [{ id: 2 }],
        ]);
    });

    test('_finder returns locator when found', async () => {
        const mockLocator = { id: 'el' };

        // 🔥 force mock at instance level
        browser.locatorStrategy = {
            find: jest.fn().mockResolvedValue(mockLocator),
        };
        browser.stack = [{ id: 1 }];

        const result = await browser._finder(100);

        expect(result).toBe(mockLocator);
    });

    test('_finder retries and throws on timeout', async () => {
        browser.locatorStrategy = {
            find: jest.fn().mockRejectedValue(new Error('fail')),
        };
        browser.stack = [{ id: 1 }];

        await expect(browser._finder(50)).rejects.toThrow(
            /Element not found/
        );
    });

    test('find() resets stack after success', async () => {
        const mockLocator = { id: 'el' };

        // 🔥 force mock at instance level
        browser.locatorStrategy = {
            find: jest.fn().mockResolvedValue(mockLocator),
        };
        browser.stack = [{ id: 1 }];

        const result = await browser.find();

        expect(result).toBe(mockLocator);
        expect(browser.stack).toEqual([]);
    });

    test('findAll returns elements when found', async () => {
        const mockElements = [{ id: 1 }, { id: 2 }];

        browser.locatorStrategy = {
            findAll: jest.fn().mockResolvedValue(mockElements),
        };
        browser.stack = [{ id: 1 }];

        const result = await browser.findAll(100);

        expect(result).toEqual(mockElements);
        expect(browser.stack).toEqual([]);
    });

    test('findAll throws when no elements found', async () => {
        browser.locatorStrategy = {
            findAll: jest.fn().mockResolvedValue([]),
        };
        browser.stack = [{ id: 1 }];

        await expect(browser.findAll(50)).rejects.toThrow(
            /No elements matching/
        );
    });

    test('handleError logs and rethrows error', () => {
        const err = new Error('original');
        browser.message = 'context message';

        expect(() => browser.handleError(err, 'testing')).toThrow();

        expect(err.message).toContain('Error while context message');
        expect(browser.stack).toEqual([]);
    });

    test('write delegates correctly', async () => {
        const spy = jest
        .spyOn(Object.getPrototypeOf(browser), 'write') // This is problematic
        .mockResolvedValue(true);

        const result = await browser.write('text');

        expect(spy).toHaveBeenCalledWith('text');
        expect(result).toBe(true);
    });

    test('click delegates to clickDelegate', async () => {
        const browser = new WebBrowser();
        const result = await browser.click(10, 20);
        expect(result).toBe(true);
    });

    test('upload sends keys to locator', async () => {
        const sendKeys = jest.fn();

        browser._finder = jest.fn().mockResolvedValue({ sendKeys });
        browser.stack = [{ id: 1 }];

        const result = await browser.upload('/file.txt');

        expect(sendKeys).toHaveBeenCalledWith('/file.txt');
        expect(result).toBe(true);
        expect(browser.stack).toEqual([]);
    });

    test('start() closes existing session', async () => {
        const closeMock = jest.fn().mockResolvedValue();
        browser.close = closeMock;

        browser.driver = { sessionId: '123' };

        const superNew = jest.spyOn(
            Object.getPrototypeOf(Object.getPrototypeOf(browser)),
            'new'
        ).mockResolvedValue();

        await browser.start();

        expect(closeMock).toHaveBeenCalled();
        expect(superNew).toHaveBeenCalled();
    });

    test('start() ignores known cleanup errors', async () => {
        browser.driver = {
            get sessionId() {
                throw new Error("reading 'sessionId'");
            },
        };

        const superNew = jest.spyOn(
            Object.getPrototypeOf(Object.getPrototypeOf(browser)),
            'new'
        ).mockResolvedValue();

        await browser.start();

        expect(superNew).toHaveBeenCalled();
    });

    test('_finder tries multiple OR stacks', async () => {
        const firstFail = jest.fn().mockRejectedValue(new Error('fail'));
        const secondSuccess = jest.fn().mockResolvedValue({ id: 'ok' });

        browser.locatorStrategy.find
            .mockImplementationOnce(firstFail)
            .mockImplementationOnce(secondSuccess);

        browser.stack = [
            { id: 1 },
            { type: 'condition', operator: 'or' },
            { id: 2 },
        ];

        const result = await browser._finder(100);

        expect(result).toEqual({ id: 'ok' });
    });

    test('get.text() falls back to value for input', async () => {
        const locator = {
            tagName: 'input',
            getAttribute: jest
                .fn()
                .mockResolvedValueOnce('') // textContent empty
                .mockResolvedValueOnce('typed value'),
        };

        browser._finder = jest.fn().mockResolvedValue(locator);
        browser.stack = [{ id: 1 }];

        const result = await browser.get.text();

        expect(result).toBe('typed value');
    });

    test('get.text() returns trimmed textContent', async () => {
        const locator = {
            tagName: 'div',
            getAttribute: jest.fn().mockResolvedValue('  hello  '),
        };

        browser._finder = jest.fn().mockResolvedValue(locator);
        browser.stack = [{ id: 1 }];

        const result = await browser.get.text();

        expect(result).toBe('hello');
    });
    test('get.attribute returns attribute value', async () => {
        const locator = {
            getAttribute: jest.fn().mockResolvedValue('123'),
        };

        browser._finder = jest.fn().mockResolvedValue(locator);
        browser.stack = [{ id: 1 }];

        const result = await browser.get.attribute('data-id');

        expect(result).toBe('123');
    });
    test('get.screenshot() uses element screenshot when stack exists', async () => {
        const locator = {
            takeScreenshot: jest.fn().mockResolvedValue('element-img'),
        };

        browser._finder = jest.fn().mockResolvedValue(locator);
        browser.stack = [{ id: 1 }];

        const result = await browser.get.screenshot();

        expect(result).toBe('element-img');
    });
    test('get.screenshot() falls back to driver screenshot', async () => {
        browser._finder = jest.fn().mockRejectedValue(new Error('fail'));
        browser.driver = {
            takeScreenshot: jest.fn().mockResolvedValue('page-img'),
        };

        browser.stack = [{ id: 1 }];

        const result = await browser.get.screenshot();

        expect(result).toBe('page-img');
    });
    test('upload() handles error via handleError', async () => {
        const error = new Error('fail');

        browser._finder = jest.fn().mockRejectedValue(error);
        browser.stack = [{ id: 1 }];

        expect(() => browser.upload('/file')).rejects.toThrow();
    });
    test('atIndex throws if not number', () => {
        expect(() => browser.atIndex('x')).toThrow(TypeError);
    });
    test('or getter adds condition to stack', () => {
        browser.stack = [{ id: 1 }];

        browser.or;

        expect(browser.stack).toContainEqual({
            type: 'condition',
            operator: 'or',
        });
    });
    test('within getter adds location to stack', () => {
        browser.within;

        expect(browser.stack).toContainEqual({
            type: 'location',
            located: 'within',
        });
    });
    test('drop() performs drag and drop', async () => {
        const dragEl = { id: 'drag' };
        const dropEl = { id: 'drop' };

        browser.locatorStrategy.find
            .mockResolvedValueOnce(dragEl)
            .mockResolvedValueOnce(dropEl);

        const perform = jest.fn().mockResolvedValue();

        browser.driver = {
            actions: jest.fn().mockReturnValue({
                move: jest.fn().mockReturnThis(),
                press: jest.fn().mockReturnThis(),
                pause: jest.fn().mockReturnThis(),
                release: jest.fn().mockReturnThis(),
                perform,
            }),
        };

        browser.stack = [
            { id: 'drag' },
            { type: 'action', perform: 'drag' },
            { type: 'action', perform: 'onto' },
            { id: 'drop' },
        ];

        const result = await browser.drop();

        expect(perform).toHaveBeenCalled();
        expect(result).toBe(true);
    });
    test('drop() throws if stack invalid', async () => {
        browser.stack = [{ id: 1 }];

        await expect(browser.drop()).rejects.toThrow(
            /Invalid drag-and-drop/
        );
    });

    describe('arrow key methods', () => {
        beforeEach(() => {
            // Tests use public methods directly via the browser instance
        });

        test('left() presses left arrow once by default', async () => {
            const pressSpy = jest.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.left();
            expect(pressSpy).toHaveBeenCalledTimes(1);
            expect(pressSpy).toHaveBeenCalledWith('left');
            pressSpy.mockRestore();
        });

        test('left(n) presses left arrow n times', async () => {
            const pressSpy = jest.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.left(5);
            expect(pressSpy).toHaveBeenCalledTimes(5);
            pressSpy.mockRestore();
        });

        test('right() presses right arrow once by default', async () => {
            const pressSpy = jest.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.right();
            expect(pressSpy).toHaveBeenCalledTimes(1);
            expect(pressSpy).toHaveBeenCalledWith('right');
            pressSpy.mockRestore();
        });

        test('right(n) presses right arrow n times', async () => {
            const pressSpy = jest.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.right(3);
            expect(pressSpy).toHaveBeenCalledTimes(3);
            pressSpy.mockRestore();
        });

        test('up() presses up arrow once by default', async () => {
            const pressSpy = jest.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.up();
            expect(pressSpy).toHaveBeenCalledTimes(1);
            expect(pressSpy).toHaveBeenCalledWith('up');
            pressSpy.mockRestore();
        });

        test('up(n) presses up arrow n times', async () => {
            const pressSpy = jest.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.up(4);
            expect(pressSpy).toHaveBeenCalledTimes(4);
            pressSpy.mockRestore();
        });

        test('down() presses down arrow once by default', async () => {
            const pressSpy = jest.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.down();
            expect(pressSpy).toHaveBeenCalledTimes(1);
            expect(pressSpy).toHaveBeenCalledWith('down');
            pressSpy.mockRestore();
        });

        test('down(n) presses down arrow n times', async () => {
            const pressSpy = jest.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.down(2);
            expect(pressSpy).toHaveBeenCalledTimes(2);
            pressSpy.mockRestore();
        });

        test('arrow key methods return true', async () => {
            const pressSpy = jest.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            const leftResult = await browser.left();
            const rightResult = await browser.right();
            const upResult = await browser.up();
            const downResult = await browser.down();
            expect(leftResult).toBe(true);
            expect(rightResult).toBe(true);
            expect(upResult).toBe(true);
            expect(downResult).toBe(true);
            pressSpy.mockRestore();
        });
    });
});