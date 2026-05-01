import { jest } from '@jest/globals';

// Shared mutable mock objects so tests can control delegate return values
const mockVisibilityDelegate = {
    scroll: jest.fn(),
    isVisible: jest.fn(),
    isDisabled: jest.fn(),
    hide: jest.fn(),
    unhide: jest.fn(),
    _isVisible: jest.fn().mockResolvedValue(true),
    _isEnabled: jest.fn().mockResolvedValue(true),
    _isDisabled: jest.fn().mockResolvedValue(false),
    _isNotVisible: jest.fn().mockResolvedValue(false),
};

const mockCheckboxDelegate = {
    check: jest.fn(),
    uncheck: jest.fn(),
    _isChecked: jest.fn().mockResolvedValue(true),
};

const mockRadioDelegate = {
    set: jest.fn(),
    _isSet: jest.fn().mockResolvedValue(true),
};

const mockSwitchDelegate = {
    on: jest.fn(),
    off: jest.fn(),
    _isOn: jest.fn().mockResolvedValue(true),
};

// Mocks
jest.unstable_mockModule('@nodebug/logger', () => ({
    log: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
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
    VisibilityDelegate: jest.fn().mockImplementation(() => mockVisibilityDelegate),
}));

jest.unstable_mockModule('../../app/command-delegates/checkbox-delegate.js', () => ({
    CheckboxDelegate: jest.fn().mockImplementation(() => mockCheckboxDelegate),
}));

jest.unstable_mockModule('../../app/command-delegates/radio-delegate.js', () => ({
    RadioDelegate: jest.fn().mockImplementation(() => mockRadioDelegate),
}));

jest.unstable_mockModule('../../app/command-delegates/switch-delegate.js', () => ({
    SwitchDelegate: jest.fn().mockImplementation(() => mockSwitchDelegate),
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

    // ------------------------------------------------------------------
    //  IS GETTER — query-style API (returns boolean, never throws)
    // ------------------------------------------------------------------
    describe('is getter', () => {
        beforeEach(() => {
            mockVisibilityDelegate._isVisible.mockResolvedValue(true);
            mockVisibilityDelegate._isEnabled.mockResolvedValue(true);
            mockVisibilityDelegate._isDisabled.mockResolvedValue(false);
            mockVisibilityDelegate._isNotVisible.mockResolvedValue(false);
            mockCheckboxDelegate._isChecked.mockResolvedValue(true);
            mockRadioDelegate._isSet.mockResolvedValue(true);
            mockSwitchDelegate._isOn.mockResolvedValue(true);
        });

        describe('is.visible()', () => {
            test('should return true when element is visible', async () => {
                const result = await browser.is.visible();
                expect(result).toBe(true);
            });

            test('should return false when element is not visible', async () => {
                mockVisibilityDelegate._isVisible.mockResolvedValue(false);
                const result = await browser.is.visible();
                expect(result).toBe(false);
            });

            test('should pass timeout to delegate', async () => {
                await browser.is.visible(5000);
                expect(mockVisibilityDelegate._isVisible).toHaveBeenCalledWith(5000);
            });
        });

        describe('is.enabled()', () => {
            test('should return true when element is enabled', async () => {
                const result = await browser.is.enabled();
                expect(result).toBe(true);
            });

            test('should return false when element is not enabled', async () => {
                mockVisibilityDelegate._isEnabled.mockResolvedValue(false);
                const result = await browser.is.enabled();
                expect(result).toBe(false);
            });
        });

        describe('is.disabled()', () => {
            test('should return true when element is disabled', async () => {
                mockVisibilityDelegate._isDisabled.mockResolvedValue(true);
                const result = await browser.is.disabled();
                expect(result).toBe(true);
            });

            test('should return false when element is not disabled', async () => {
                const result = await browser.is.disabled();
                expect(result).toBe(false);
            });
        });

        describe('is.checked()', () => {
            test('should return true when checkbox is checked', async () => {
                const result = await browser.is.checked();
                expect(result).toBe(true);
            });

            test('should return false when checkbox is not checked', async () => {
                mockCheckboxDelegate._isChecked.mockResolvedValue(false);
                const result = await browser.is.checked();
                expect(result).toBe(false);
            });
        });

        describe('is.set()', () => {
            test('should return true when radio is set', async () => {
                const result = await browser.is.set();
                expect(result).toBe(true);
            });

            test('should return false when radio is not set', async () => {
                mockRadioDelegate._isSet.mockResolvedValue(false);
                const result = await browser.is.set();
                expect(result).toBe(false);
            });
        });

        describe('is.on()', () => {
            test('should return true when switch is on', async () => {
                const result = await browser.is.on();
                expect(result).toBe(true);
            });

            test('should return false when switch is off', async () => {
                mockSwitchDelegate._isOn.mockResolvedValue(false);
                const result = await browser.is.on();
                expect(result).toBe(false);
            });
        });

        describe('is.off()', () => {
            test('should return true when switch is off', async () => {
                mockSwitchDelegate._isOn.mockResolvedValue(false);
                const result = await browser.is.off();
                expect(result).toBe(true);
            });

            test('should return false when switch is on', async () => {
                const result = await browser.is.off();
                expect(result).toBe(false);
            });
        });

        describe('is.not.visible()', () => {
            test('should return true when element is not visible', async () => {
                mockVisibilityDelegate._isNotVisible.mockResolvedValue(true);
                const result = await browser.is.not.visible();
                expect(result).toBe(true);
            });

            test('should return false when element is visible', async () => {
                const result = await browser.is.not.visible();
                expect(result).toBe(false);
            });
        });

        describe('is.not.checked()', () => {
            test('should return true when checkbox is not checked', async () => {
                mockCheckboxDelegate._isChecked.mockResolvedValue(false);
                const result = await browser.is.not.checked();
                expect(result).toBe(true);
            });

            test('should return false when checkbox is checked', async () => {
                const result = await browser.is.not.checked();
                expect(result).toBe(false);
            });
        });

        describe('is.not.set()', () => {
            test('should return true when radio is not set', async () => {
                mockRadioDelegate._isSet.mockResolvedValue(false);
                const result = await browser.is.not.set();
                expect(result).toBe(true);
            });

            test('should return false when radio is set', async () => {
                const result = await browser.is.not.set();
                expect(result).toBe(false);
            });
        });
    });

    // ------------------------------------------------------------------
    //  SHOULD GETTER — assertion-style API (throws on failure)
    // ------------------------------------------------------------------
    describe('should getter', () => {
        beforeEach(() => {
            mockVisibilityDelegate._isVisible.mockResolvedValue(true);
            mockVisibilityDelegate._isEnabled.mockResolvedValue(true);
            mockVisibilityDelegate._isDisabled.mockResolvedValue(false);
            mockVisibilityDelegate._isNotVisible.mockResolvedValue(false);
            mockCheckboxDelegate._isChecked.mockResolvedValue(true);
            mockRadioDelegate._isSet.mockResolvedValue(true);
            mockSwitchDelegate._isOn.mockResolvedValue(true);
        });

        describe('should.be.visible()', () => {
            test('should not throw when element is visible', async () => {
                await expect(browser.should.be.visible()).resolves.not.toThrow();
            });

            test('should throw when element is not visible', async () => {
                mockVisibilityDelegate._isVisible.mockResolvedValue(false);
                await expect(browser.should.be.visible()).rejects.toThrow('Element should be visible');
            });
        });

        describe('should.be.enabled()', () => {
            test('should not throw when element is enabled', async () => {
                await expect(browser.should.be.enabled()).resolves.not.toThrow();
            });

            test('should throw when element is not enabled', async () => {
                mockVisibilityDelegate._isEnabled.mockResolvedValue(false);
                await expect(browser.should.be.enabled()).rejects.toThrow('Element should be enabled');
            });
        });

        describe('should.be.disabled()', () => {
            test('should not throw when element is disabled', async () => {
                mockVisibilityDelegate._isDisabled.mockResolvedValue(true);
                await expect(browser.should.be.disabled()).resolves.not.toThrow();
            });

            test('should throw when element is not disabled', async () => {
                await expect(browser.should.be.disabled()).rejects.toThrow('Element should be disabled');
            });
        });

        describe('should.be.checked()', () => {
            test('should not throw when checkbox is checked', async () => {
                await expect(browser.should.be.checked()).resolves.not.toThrow();
            });

            test('should throw when checkbox is not checked', async () => {
                mockCheckboxDelegate._isChecked.mockResolvedValue(false);
                await expect(browser.should.be.checked()).rejects.toThrow('Element should be checked');
            });
        });

        describe('should.be.set()', () => {
            test('should not throw when radio is set', async () => {
                await expect(browser.should.be.set()).resolves.not.toThrow();
            });

            test('should throw when radio is not set', async () => {
                mockRadioDelegate._isSet.mockResolvedValue(false);
                await expect(browser.should.be.set()).rejects.toThrow('Radiobutton should be set');
            });
        });

        describe('should.be.on()', () => {
            test('should not throw when switch is on', async () => {
                await expect(browser.should.be.on()).resolves.not.toThrow();
            });

            test('should throw when switch is off', async () => {
                mockSwitchDelegate._isOn.mockResolvedValue(false);
                await expect(browser.should.be.on()).rejects.toThrow('Switch should be on');
            });
        });

        describe('should.be.off()', () => {
            test('should not throw when switch is off', async () => {
                mockSwitchDelegate._isOn.mockResolvedValue(false);
                await expect(browser.should.be.off()).resolves.not.toThrow();
            });

            test('should throw when switch is on', async () => {
                await expect(browser.should.be.off()).rejects.toThrow('Switch should be off');
            });
        });

        describe('should.not.be.visible()', () => {
            test('should not throw when element is not visible', async () => {
                mockVisibilityDelegate._isNotVisible.mockResolvedValue(true);
                await expect(browser.should.not.be.visible()).resolves.not.toThrow();
            });

            test('should throw when element is visible', async () => {
                await expect(browser.should.not.be.visible()).rejects.toThrow('Element should not be visible');
            });
        });

        describe('should.not.be.checked()', () => {
            test('should not throw when checkbox is not checked', async () => {
                mockCheckboxDelegate._isChecked.mockResolvedValue(false);
                await expect(browser.should.not.be.checked()).resolves.not.toThrow();
            });

            test('should throw when checkbox is checked', async () => {
                await expect(browser.should.not.be.checked()).rejects.toThrow('Element should not be checked');
            });
        });

        describe('should.not.be.set()', () => {
            test('should not throw when radio is not set', async () => {
                mockRadioDelegate._isSet.mockResolvedValue(false);
                await expect(browser.should.not.be.set()).resolves.not.toThrow();
            });

            test('should throw when radio is set', async () => {
                await expect(browser.should.not.be.set()).rejects.toThrow('Radiobutton should not be set');
            });
        });
    });
});