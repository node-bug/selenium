import WebBrowser from '../../index.js';

describe('WebBrowser Plugin System', () => {
  let browser;

  beforeAll(async () => {
    browser = new WebBrowser();
    await browser.start();
  });

  afterAll(async () => {
    await browser.close();
  });

  test('should register and use object plugin', async () => {
    const testPlugin = {
      name: 'test-plugin',
      hooks: {
        afterScreenshot: async (data) => {
          data.processedBy = 'test-plugin';
          return data;
        }
      },
      extend: () => ({
        customMethod: () => 'custom-result'
      })
    };

    browser.use(testPlugin);
    
    expect(browser.plugins.getPlugin('test-plugin')).toBeDefined();
    expect(browser.customMethod).toBeDefined();
    expect(browser.customMethod()).toBe('custom-result');
  });

  test('should register and use factory function plugin', async () => {
    const factoryPlugin = () => ({
      name: 'factory-plugin',
      hooks: {
        beforeClick: (data) => {
          data.enhanced = true;
          return data;
        }
      },
      extend: () => ({
        factoryMethod: (val) => `factory-${val}`
      })
    });

    browser.use(factoryPlugin);
    
    expect(browser.plugins.getPlugin('factory-plugin')).toBeDefined();
    expect(browser.factoryMethod('test')).toBe('factory-test');
  });

  test('should register factory plugin that uses browser and options', async () => {
    const contextualPlugin = (browser, options) => ({
      name: 'contextual-plugin',
      extend: () => ({
        getBrowserCapabilities: () => browser.capabilities,
        getOptionValue: () => options.someOption
      })
    });

    browser.use(contextualPlugin, { someOption: 'test-value' });
    
    expect(browser.plugins.getPlugin('contextual-plugin')).toBeDefined();
    expect(browser.getOptionValue()).toBe('test-value');
  });

  test('should register plugin with wrap property', async () => {
    const hookPlugin = {
      name: 'hook-test-plugin',
      wrap: ['screenshot', 'click'],  // Specify methods to wrap
      hooks: {
        beforeScreenshot: async (data) => {
          data.hookRan = 'before';
          return data;
        },
        afterScreenshot: async (data) => {
          data.hookRan = 'after';
          return data;
        }
      }
    };

    browser.use(hookPlugin);
    
    // Verify plugin is registered
    expect(browser.plugins.getPlugin('hook-test-plugin')).toBeDefined();
    
    // Verify the plugin has the wrap property
    const plugin = browser.plugins.getPlugin('hook-test-plugin');
    expect(plugin.wrap).toEqual(['screenshot', 'click']);
  });

  test('should unregister plugins', async () => {
    const removablePlugin = { name: 'removable-plugin' };
    browser.use(removablePlugin);
    
    expect(browser.plugins.getPlugin('removable-plugin')).toBeDefined();
    
    browser.plugins.unregister('removable-plugin');
    expect(browser.plugins.getPlugin('removable-plugin')).toBeUndefined();
  });

  test('should support middleware pattern', async () => {
    const middlewarePlugin = {
      name: 'middleware-plugin',
      middleware: {
        before: {
          click: (args) => {
            args[0] = args[0] + '-modified';
            return args;
          }
        }
      }
    };

    browser.use(middlewarePlugin);
    // Middleware would intercept click calls
    expect(browser.plugins.getPlugin('middleware-plugin')).toBeDefined();
  });
});