import { vi } from 'vitest';

// Shared mutable mock objects so tests can control delegate return values
const mockVisibilityDelegate = {
    scroll: vi.fn(),
    isVisible: vi.fn(),
    isDisabled: vi.fn(),
    hide: vi.fn(),
    unhide: vi.fn(),
    _isVisible: vi.fn().mockResolvedValue(true),
    _isEnabled: vi.fn().mockResolvedValue(true),
    _isDisabled: vi.fn().mockResolvedValue(false),
    _isNotVisible: vi.fn().mockResolvedValue(false),
    get is() {
        return {
            visible: async (t = null) => {
                return mockVisibilityDelegate._isVisible(t);
            },
            enabled: async (t = null) => {
                return mockVisibilityDelegate._isEnabled(t);
            },
            disabled: async (t = null) => {
                return mockVisibilityDelegate._isDisabled(t);
            },
            not: {
                visible: async (t = null) => {
                    return mockVisibilityDelegate._isNotVisible(t);
                },
            },
        };
    },
};

const mockCheckboxDelegate = {
    check: vi.fn(),
    uncheck: vi.fn(),
    _isChecked: vi.fn().mockResolvedValue(true),
    get is() {
        return {
            checked: async () => {
                return mockCheckboxDelegate._isChecked();
            },
            not: {
                checked: async () => {
                    const result = await mockCheckboxDelegate._isChecked();
                    return !result;
                },
            },
        };
    },
};

const mockRadioDelegate = {
    set: vi.fn(),
    _isSet: vi.fn().mockResolvedValue(true),
    get is() {
        return {
            set: async () => {
                return mockRadioDelegate._isSet();
            },
            not: {
                set: async () => {
                    const result = await mockRadioDelegate._isSet();
                    return !result;
                },
            },
        };
    },
};

const mockSwitchDelegate = {
    on: vi.fn(),
    off: vi.fn(),
    _isOn: vi.fn().mockResolvedValue(true),
    get is() {
        return {
            on: async () => {
                return mockSwitchDelegate._isOn();
            },
            off: async () => {
                const result = await mockSwitchDelegate._isOn();
                return !result;
            },
            not: {
                on: async () => {
                    const result = await mockSwitchDelegate._isOn();
                    return !result;
                },
                off: async () => {
                    return mockSwitchDelegate._isOn();
                },
            },
        };
    },
};

// Mocks
vi.mock('@nodebug/logger', () => ({
    log: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
    },
}));

// Mock config module
vi.mock('@nodebug/config', () => ({
  default: vi.fn(() => ({
    timeout: 1, // small timeout for fast tests
    browser: 'chrome',
})),
}));

// Mock dependencies
vi.mock('../../app/elements/locator-strategy.js', () => {
    const mockInstance = {
        definitions: {
            // Navigation & Structure
            link: true,
            navigation: true,
            heading: true,
            // Interactive Controls
            button: true,
            checkbox: true,
            switch: true,
            radio: true,
            slider: true,
            dropdown: true,
            // Forms & Inputs
            textbox: true,
            file: true,
            // Lists & Menus
            list: true,
            listitem: true,
            menu: true,
            menuitem: true,
            // Containers & Layout
            toolbar: true,
            dialog: true,
            // Tables / Grids
            table: true,
            row: true,
            column: true,
            // Media
            image: true,
            // Global Fallback
            element: true,
        },
        find: vi.fn(),
        findAll: vi.fn(),
    };
    // Create a mock constructor that returns the instance when called with 'new'
    function MockLocatorStrategy() {
        return mockInstance;
    }
    return {
        LocatorStrategy: MockLocatorStrategy
    };
});

vi.mock('../../app/messenger.js', () => ({
    default: vi.fn(() => 'mock-message')
}));

vi.mock('../../app/command-delegates/click-delegate.js', () => {
    const clickDelegateInstance = {
        click: vi.fn().mockResolvedValue(true),
        hover: vi.fn(),
        doubleClick: vi.fn(),
        rightClick: vi.fn(),
        _clicker: vi.fn(),
    };
    function MockClickDelegate() { return clickDelegateInstance; }
    return { ClickDelegate: MockClickDelegate };
});

vi.mock('../../app/command-delegates/input-delegate.js', () => {
    const inputDelegateInstance = {
        write: vi.fn().mockResolvedValue(true),
        focus: vi.fn(),
        clear: vi.fn(),
        overwrite: vi.fn(),
        press: vi.fn().mockResolvedValue(true),
    };
    function MockInputDelegate() { return inputDelegateInstance; }
    return { InputDelegate: MockInputDelegate };
});

vi.mock('../../app/command-delegates/visibility-delegate.js', () => {
    function MockVisibilityDelegate() { return mockVisibilityDelegate; }
    return { VisibilityDelegate: MockVisibilityDelegate };
});

vi.mock('../../app/command-delegates/checkbox-delegate.js', () => {
    function MockCheckboxDelegate() { return mockCheckboxDelegate; }
    return { CheckboxDelegate: MockCheckboxDelegate };
});

vi.mock('../../app/command-delegates/radio-delegate.js', () => {
    function MockRadioDelegate() { return mockRadioDelegate; }
    return { RadioDelegate: MockRadioDelegate };
});

vi.mock('../../app/command-delegates/switch-delegate.js', () => {
    function MockSwitchDelegate() { return mockSwitchDelegate; }
    return { SwitchDelegate: MockSwitchDelegate };
});

vi.mock('../../app/command-delegates/slider-delegate.js', () => {
    const sliderDelegateInstance = {
        set: vi.fn(),
        _isSet: vi.fn().mockResolvedValue(true),
    };
    function MockSliderDelegate() { return sliderDelegateInstance; }
    return { SliderDelegate: MockSliderDelegate };
});

vi.mock('../../app/command-delegates/select-delegate.js', () => {
    const selectDelegateInstance = {
        option: vi.fn().mockReturnThis(),
    };
    function MockSelectDelegate() { return selectDelegateInstance; }
    return { SelectDelegate: MockSelectDelegate };
});

const { default: WebBrowser } = await import('../../index.js');

describe('WebBrowser', () => {
    let browser;

    beforeEach(() => {
        vi.clearAllMocks();
        browser = new WebBrowser();

        browser.locatorStrategy = {
            find: vi.fn(),
            findAll: vi.fn(),
            _injectElementFinder: vi.fn().mockResolvedValue(undefined),
        };
    });

    test('should initialize correctly', () => {
        expect(browser.stack).toEqual([]);
        expect(browser.locatorStrategy).toBeDefined();
    });

    test('should accept empty string for element type', () => {
        expect(() => browser.element('')).not.toThrow();
    });

    describe('element type validation', () => {
        const elementTypes = [
            'button', 'textbox', 'checkbox', 'radio', 'slider', 'dropdown',
            'link', 'heading', 'image', 'file', 'dialog',
            'row', 'column', 'table', 'list', 'listitem',
            'menu', 'menuitem', 'toolbar', 'navigation',
            'switch', 'element'
        ];

        test.each(elementTypes)('should accept empty string for %s()', (type) => {
            expect(() => browser[type]('')).not.toThrow();
        });

        test.each(elementTypes)('should accept null for %s()', (type) => {
            expect(() => browser[type](null)).not.toThrow();
        });

        test.each(elementTypes)('should accept undefined for %s()', (type) => {
            expect(() => browser[type](undefined)).not.toThrow();
        });

        test.each(elementTypes)('should work when %s() is called with valid string', (type) => {
            expect(() => browser[type]('test')).not.toThrow();
        });

        test.each(elementTypes)('should work when %s() is called with valid number index', (type) => {
            expect(() => browser[type](1)).not.toThrow();
        });
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
            find: vi.fn().mockResolvedValue(mockLocator),
        };
        browser.stack = [{ id: 1 }];

        const result = await browser._finder(100);

        expect(result).toBe(mockLocator);
    });

    test('_finder retries and throws on timeout', async () => {
        browser.locatorStrategy = {
            find: vi.fn().mockRejectedValue(new Error('fail')),
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
            find: vi.fn().mockResolvedValue(mockLocator),
        };
        browser.stack = [{ id: 1 }];

        const result = await browser.find();

        expect(result).toBe(mockLocator);
        expect(browser.stack).toEqual([]);
    });

    test('findAll returns elements when found', async () => {
        const mockElements = [{ id: 1 }, { id: 2 }];

        browser.locatorStrategy = {
            findAll: vi.fn().mockResolvedValue(mockElements),
        };
        browser.stack = [{ id: 1 }];

        const result = await browser.findAll(100);

        expect(result).toEqual(mockElements);
        expect(browser.stack).toEqual([]);
    });

    test('findAll throws when no elements found', async () => {
        browser.locatorStrategy = {
            findAll: vi.fn().mockResolvedValue([]),
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
        const result = await browser.write('text');

        expect(result).toBe(true);
    });

    test('click delegates to clickDelegate', async () => {
        const browser = new WebBrowser();
        const result = await browser.click(10, 20);
        expect(result).toBe(true);
    });

    test('upload sends keys to locator', async () => {
        const sendKeys = vi.fn();

        browser._finder = vi.fn().mockResolvedValue({ sendKeys });
        browser.stack = [{ id: 1 }];

        const result = await browser.upload('/file.txt');

        expect(sendKeys).toHaveBeenCalledWith('/file.txt');
        expect(result).toBe(true);
        expect(browser.stack).toEqual([]);
    });

    test('start() closes existing session', async () => {
        const closeMock = vi.fn().mockResolvedValue();
        browser.close = closeMock;

        browser.driver = { sessionId: '123' };

        const superNew = vi.spyOn(
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

        const superNew = vi.spyOn(
            Object.getPrototypeOf(Object.getPrototypeOf(browser)),
            'new'
        ).mockResolvedValue();

        await browser.start();

        expect(superNew).toHaveBeenCalled();
    });

    test('_finder tries multiple OR stacks', async () => {
        const firstFail = vi.fn().mockRejectedValue(new Error('fail'));
        const secondSuccess = vi.fn().mockResolvedValue({ id: 'ok' });

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
            getAttribute: vi
                .fn()
                .mockResolvedValueOnce('') // textContent empty
                .mockResolvedValueOnce('typed value'),
        };

        browser._finder = vi.fn().mockResolvedValue(locator);
        browser.stack = [{ id: 1 }];

        const result = await browser.get.text();

        expect(result).toBe('typed value');
    });

    test('get.text() returns trimmed textContent', async () => {
        const locator = {
            tagName: 'div',
            getAttribute: vi.fn().mockResolvedValue('  hello  '),
        };

        browser._finder = vi.fn().mockResolvedValue(locator);
        browser.stack = [{ id: 1 }];

        const result = await browser.get.text();

        expect(result).toBe('hello');
    });
    test('get.attribute returns attribute value', async () => {
        const locator = {
            getAttribute: vi.fn().mockResolvedValue('123'),
        };

        browser._finder = vi.fn().mockResolvedValue(locator);
        browser.stack = [{ id: 1 }];

        const result = await browser.get.attribute('data-id');

        expect(result).toBe('123');
    });
    test('get.screenshot() uses element screenshot when stack exists', async () => {
        const locator = {
            takeScreenshot: vi.fn().mockResolvedValue('element-img'),
        };

        browser._finder = vi.fn().mockResolvedValue(locator);
        browser.stack = [{ id: 1 }];
        browser.driver = {
            executeScript: vi.fn().mockResolvedValue({ originalStyles: new Map(), pausedCount: 0 }),
            takeScreenshot: vi.fn().mockResolvedValue('page-img'),
        };

        const result = await browser.get.screenshot();

        expect(result).toBe('element-img');
    });
    test('get.screenshot() falls back to driver screenshot', async () => {
        browser._finder = vi.fn().mockRejectedValue(new Error('fail'));
        browser.driver = {
            executeScript: vi.fn().mockResolvedValue({ originalStyles: new Map(), pausedCount: 0 }),
            takeScreenshot: vi.fn().mockResolvedValue('page-img'),
        };

        browser.stack = [{ id: 1 }];

        const result = await browser.get.screenshot();

        expect(result).toBe('page-img');
    });
    test('upload() handles error via handleError', async () => {
        const error = new Error('fail');

        browser._finder = vi.fn().mockRejectedValue(error);
        browser.stack = [{ id: 1 }];

        await expect(browser.upload('/file')).rejects.toThrow();
    });
    test('at.index sets index and clears id on last stack item', () => {
        browser.stack = [{ id: 'some-text', index: false }];

        browser.at.index(2);

        expect(browser.stack[0].index).toBe(2);
        expect(browser.stack[0].id).toBe('');
    });
    test('at.index returns browser for chaining', () => {
        browser.stack = [{ id: 'text' }];

        const result = browser.at.index(1);

        expect(result).toBe(browser);
    });
    test('at.index does nothing when stack is empty', () => {
        browser.stack = [];

        const result = browser.at.index(1);

        expect(result).toBe(browser);
        expect(browser.stack).toEqual([]);
    });
    test('at.index defaults to 1 when called with 0', () => {
        browser.stack = [{ id: 'text', index: false }];

        browser.at.index(0);

        expect(browser.stack[0].index).toBe(1);
        expect(browser.stack[0].id).toBe('');
    });
    test('at.index defaults to 1 when called with negative number', () => {
        browser.stack = [{ id: 'text', index: false }];

        browser.at.index(-1);

        expect(browser.stack[0].index).toBe(1);
        expect(browser.stack[0].id).toBe('');
    });
    test('at.index defaults to 1 when called with NaN', () => {
        browser.stack = [{ id: 'text', index: false }];

        browser.at.index(NaN);

        expect(browser.stack[0].index).toBe(1);
        expect(browser.stack[0].id).toBe('');
    });
    test('at.index defaults to 1 when called with null', () => {
        browser.stack = [{ id: 'text', index: false }];

        browser.at.index(null);

        expect(browser.stack[0].index).toBe(1);
        expect(browser.stack[0].id).toBe('');
    });
    test('at.index defaults to 1 when called with undefined', () => {
        browser.stack = [{ id: 'text', index: false }];

        browser.at.index(undefined);

        expect(browser.stack[0].index).toBe(1);
        expect(browser.stack[0].id).toBe('');
    });
    test('at.index defaults to 1 when called with non-number string', () => {
        browser.stack = [{ id: 'text', index: false }];

        browser.at.index('x');

        expect(browser.stack[0].index).toBe(1);
        expect(browser.stack[0].id).toBe('');
    });
    test('at.index defaults to 1 when called with non-integer float', () => {
        browser.stack = [{ id: 'text', index: false }];

        browser.at.index(1.5);

        expect(browser.stack[0].index).toBe(1);
        expect(browser.stack[0].id).toBe('');
    });
    test('element(1) and element().at.index(1) produce equivalent stack items', () => {
        const browser1 = new WebBrowser();
        const browser2 = new WebBrowser();

        browser1.element(1);
        browser2.element('some-text').at.index(1);

        expect(browser1.stack[0].index).toBe(1);
        expect(browser1.stack[0].id).toBe('');
        expect(browser2.stack[0].index).toBe(1);
        expect(browser2.stack[0].id).toBe('');
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

        const perform = vi.fn().mockResolvedValue();

        browser.driver = {
            executeScript: vi.fn().mockResolvedValue(),
            actions: vi.fn().mockReturnValue({
                dragAndDrop: vi.fn().mockReturnThis(),
                perform,
            }),
        };

        browser.stack = [
            { type: 'action', perform: 'drag' },
            { id: 'drag' },
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
            const pressSpy = vi.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.left();
            expect(pressSpy).toHaveBeenCalledTimes(1);
            expect(pressSpy).toHaveBeenCalledWith('left');
            pressSpy.mockRestore();
        });

        test('left(n) presses left arrow n times', async () => {
            const pressSpy = vi.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.left(5);
            expect(pressSpy).toHaveBeenCalledTimes(5);
            pressSpy.mockRestore();
        });

        test('right() presses right arrow once by default', async () => {
            const pressSpy = vi.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.right();
            expect(pressSpy).toHaveBeenCalledTimes(1);
            expect(pressSpy).toHaveBeenCalledWith('right');
            pressSpy.mockRestore();
        });

        test('right(n) presses right arrow n times', async () => {
            const pressSpy = vi.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.right(3);
            expect(pressSpy).toHaveBeenCalledTimes(3);
            pressSpy.mockRestore();
        });

        test('up() presses up arrow once by default', async () => {
            const pressSpy = vi.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.up();
            expect(pressSpy).toHaveBeenCalledTimes(1);
            expect(pressSpy).toHaveBeenCalledWith('up');
            pressSpy.mockRestore();
        });

        test('up(n) presses up arrow n times', async () => {
            const pressSpy = vi.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.up(4);
            expect(pressSpy).toHaveBeenCalledTimes(4);
            pressSpy.mockRestore();
        });

        test('down() presses down arrow once by default', async () => {
            const pressSpy = vi.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.down();
            expect(pressSpy).toHaveBeenCalledTimes(1);
            expect(pressSpy).toHaveBeenCalledWith('down');
            pressSpy.mockRestore();
        });

        test('down(n) presses down arrow n times', async () => {
            const pressSpy = vi.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
            await browser.down(2);
            expect(pressSpy).toHaveBeenCalledTimes(2);
            pressSpy.mockRestore();
        });

        test('arrow key methods return true', async () => {
            const pressSpy = vi.spyOn(Object.getPrototypeOf(browser), 'press').mockResolvedValue(true);
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
                browser.stack = [{ type: 'checkbox' }];
                const result = await browser.is.checked();
                expect(result).toBe(true);
            });

            test('should return false when checkbox is not checked', async () => {
                browser.stack = [{ type: 'checkbox' }];
                mockCheckboxDelegate._isChecked.mockResolvedValue(false);
                const result = await browser.is.checked();
                expect(result).toBe(false);
            });
        });

        describe('is.set()', () => {
            test('should return true when radio is set', async () => {
                browser.stack = [{ type: 'radio' }];
                const result = await browser.is.set();
                expect(result).toBe(true);
            });

            test('should return false when radio is not set', async () => {
                browser.stack = [{ type: 'radio' }];
                mockRadioDelegate._isSet.mockResolvedValue(false);
                const result = await browser.is.set();
                expect(result).toBe(false);
            });
        });

        describe('is.on()', () => {
            test('should return true when switch is on', async () => {
                browser.stack = [{ type: 'switch' }];
                const result = await browser.is.on();
                expect(result).toBe(true);
            });

            test('should return false when switch is off', async () => {
                browser.stack = [{ type: 'switch' }];
                mockSwitchDelegate._isOn.mockResolvedValue(false);
                const result = await browser.is.on();
                expect(result).toBe(false);
            });
        });

        describe('is.off()', () => {
            test('should return true when switch is off', async () => {
                browser.stack = [{ type: 'switch' }];
                mockSwitchDelegate._isOn.mockResolvedValue(false);
                const result = await browser.is.off();
                expect(result).toBe(true);
            });

            test('should return false when switch is on', async () => {
                browser.stack = [{ type: 'switch' }];
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
                browser.stack = [{ type: 'checkbox' }];
                mockCheckboxDelegate._isChecked.mockResolvedValue(false);
                const result = await browser.is.not.checked();
                expect(result).toBe(true);
            });

            test('should return false when checkbox is checked', async () => {
                browser.stack = [{ type: 'checkbox' }];
                const result = await browser.is.not.checked();
                expect(result).toBe(false);
            });
        });

        describe('is.not.set()', () => {
            test('should return true when radio is not set', async () => {
                browser.stack = [{ type: 'radio' }];
                mockRadioDelegate._isSet.mockResolvedValue(false);
                const result = await browser.is.not.set();
                expect(result).toBe(true);
            });

            test('should return false when radio is set', async () => {
                browser.stack = [{ type: 'radio' }];
                const result = await browser.is.not.set();
                expect(result).toBe(false);
            });
        });

        describe('has.value()', () => {
            test('should return true when element value matches', async () => {
                const locator = {
                    tagName: 'input',
                    getAttribute: vi.fn().mockResolvedValueOnce('').mockResolvedValueOnce('75'),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                const result = await browser.has.value('75');
                expect(result).toBe(true);
            });

            test('should return false when element value does not match', async () => {
                const locator = {
                    tagName: 'input',
                    getAttribute: vi.fn().mockResolvedValueOnce('').mockResolvedValueOnce('50'),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                const result = await browser.has.value('75');
                expect(result).toBe(false);
            });
        });

        describe('has.text()', () => {
            test('should return true when element text matches', async () => {
                const locator = {
                    tagName: 'span',
                    getAttribute: vi.fn().mockResolvedValueOnce('Hello World').mockResolvedValueOnce('Hello World'),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                const result = await browser.has.text('Hello World');
                expect(result).toBe(true);
            });

            test('should return false when element text does not match', async () => {
                const locator = {
                    tagName: 'span',
                    getAttribute: vi.fn().mockResolvedValueOnce('Goodbye World').mockResolvedValueOnce(''),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                const result = await browser.has.text('Hello World');
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
                await expect(browser.should.be.on()).rejects.toThrow('Switch should be ON');
            });
        });

        describe('should.be.off()', () => {
            test('should not throw when switch is off', async () => {
                mockSwitchDelegate._isOn.mockResolvedValue(false);
                await expect(browser.should.be.off()).resolves.not.toThrow();
            });

            test('should throw when switch is on', async () => {
                await expect(browser.should.be.off()).rejects.toThrow('Switch should be OFF');
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

        describe('should.have.value()', () => {
            test('should not throw when element value matches', async () => {
                const locator = {
                    tagName: 'input',
                    getAttribute: vi.fn().mockResolvedValueOnce('').mockResolvedValueOnce('75'),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                await expect(browser.should.have.value('75')).resolves.not.toThrow();
            });

            test('should throw when element value does not match', async () => {
                const locator = {
                    tagName: 'input',
                    getAttribute: vi.fn().mockResolvedValueOnce('').mockResolvedValueOnce('50'),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                await expect(browser.should.have.value('75')).rejects.toThrow('Element value');
            });
        });

        describe('should.not.have.value()', () => {
            test('should not throw when element value does not match', async () => {
                const locator = {
                    tagName: 'input',
                    getAttribute: vi.fn().mockResolvedValueOnce('').mockResolvedValueOnce('50'),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                await expect(browser.should.not.have.value('75')).resolves.not.toThrow();
            });

            test('should throw when element value matches', async () => {
                const locator = {
                    tagName: 'input',
                    getAttribute: vi.fn().mockResolvedValueOnce('').mockResolvedValueOnce('75'),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                await expect(browser.should.not.have.value('75')).rejects.toThrow('Element value');
            });
        });

        describe('should.have.text()', () => {
            test('should not throw when element text matches', async () => {
                const locator = {
                    tagName: 'span',
                    getAttribute: vi.fn().mockResolvedValueOnce('Hello World').mockResolvedValueOnce('Hello World'),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                await expect(browser.should.have.text('Hello World')).resolves.not.toThrow();
            });

            test('should throw when element text does not match', async () => {
                const locator = {
                    tagName: 'span',
                    getAttribute: vi.fn().mockResolvedValueOnce('Goodbye World').mockResolvedValueOnce(''),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                await expect(browser.should.have.text('Hello World')).rejects.toThrow('Element text');
            });
        });

        describe('should.not.have.text()', () => {
            test('should not throw when element text does not match', async () => {
                const locator = {
                    tagName: 'span',
                    getAttribute: vi.fn().mockResolvedValueOnce('Goodbye World').mockResolvedValueOnce(''),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                await expect(browser.should.not.have.text('Hello World')).resolves.not.toThrow();
            });

            test('should throw when element text matches', async () => {
                const locator = {
                    tagName: 'span',
                    getAttribute: vi.fn().mockResolvedValueOnce('Hello World').mockResolvedValueOnce('Hello World'),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                await expect(browser.should.not.have.text('Hello World')).rejects.toThrow('Element text');
            });
        });

        describe('does.not.have.value()', () => {
            test('should return true when element value does not match', async () => {
                const locator = {
                    tagName: 'input',
                    getAttribute: vi.fn().mockResolvedValueOnce('').mockResolvedValueOnce('50'),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                const result = await browser.does.not.have.value('75');
                expect(result).toBe(true);
            });

            test('should return false when element value matches', async () => {
                const locator = {
                    tagName: 'input',
                    getAttribute: vi.fn().mockResolvedValueOnce('').mockResolvedValueOnce('75'),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                const result = await browser.does.not.have.value('75');
                expect(result).toBe(false);
            });
        });

        describe('does.not.have.text()', () => {
            test('should return true when element text does not match', async () => {
                const locator = {
                    tagName: 'span',
                    getAttribute: vi.fn().mockResolvedValueOnce('Goodbye World').mockResolvedValueOnce(''),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                const result = await browser.does.not.have.text('Hello World');
                expect(result).toBe(true);
            });

            test('should return false when element text matches', async () => {
                const locator = {
                    tagName: 'span',
                    getAttribute: vi.fn().mockResolvedValueOnce('Hello World').mockResolvedValueOnce('Hello World'),
                };
                browser._finder = vi.fn().mockResolvedValue(locator);
                browser.stack = [{ id: 1 }];
                const result = await browser.does.not.have.text('Hello World');
                expect(result).toBe(false);
            });
        });
    });
});