import { log } from '@nodebug/logger';

/**
 * Plugin Manager for WebBrowser
 * Allows external npm packages to extend functionality at runtime
 * WITHOUT requiring core modifications
 */
export class PluginManager {
  #plugins = [];
  #browser;
  #wrappedMethods = new Map();

  constructor(browser) {
    this.#browser = browser;
  }

  /**
   * Register a plugin (can be an object or a function that returns an object)
   * @param {Object|Function} plugin - Plugin to register
   * @param {Object} options - Plugin options
   */
  register(plugin, options = {}) {
    // Support both object plugins and factory functions
    const pluginInstance = typeof plugin === 'function' ? plugin(this.#browser, options) : plugin;
    
    if (!pluginInstance || (typeof pluginInstance !== 'object')) {
      throw new Error('Plugin must be an object or a factory function returning an object');
    }

    // Validate plugin has at least one extension point
    const hasExtensions = Object.keys(pluginInstance).some(key => 
      key === 'name' || key === 'hooks' || key === 'extend' || key === 'middleware' || key === 'wrap'
    );

    if (!hasExtensions) {
      log.warn('Plugin has no extension points (hooks, extend, middleware, or wrap)');
    }

    this.#plugins.push({
      ...pluginInstance,
      _options: options,
      _enabled: options.enabled !== false
    });

    log.info(`Registered plugin: ${pluginInstance.name || 'unnamed'}`);
    
    // Auto-wrap methods specified in plugin.wrap
    if (pluginInstance.wrap) {
      this.#applyMethodWrapping(pluginInstance);
    }
    
    return this;
  }

  /**
   * Apply method wrapping for plugins that specify wrap property
   * @private
   */
  #applyMethodWrapping(plugin) {
    const methodsToWrap = Array.isArray(plugin.wrap) ? plugin.wrap : [plugin.wrap];
    
    for (const methodName of methodsToWrap) {
      if (typeof this.#browser[methodName] === 'function' && !this.#wrappedMethods.has(methodName)) {
        const original = this.#browser[methodName].bind(this.#browser);
        this.#wrappedMethods.set(methodName, original);
        
        // Replace with wrapped version
        this.#browser[methodName] = async (...args) => {
          let result = args;
          
          // Before hooks
          for (const p of this.#plugins.filter(pl => pl._enabled)) {
            if (typeof p.hooks?.[`before${this.#capitalize(methodName)}`] === 'function') {
              result = await p.hooks[`before${this.#capitalize(methodName)}`](result, this.#browser);
            }
          }
          
          // Execute original
          const originalResult = await original(...result);
          result = originalResult;
          
          // After hooks
          for (const p of this.#plugins.filter(pl => pl._enabled)) {
            if (typeof p.hooks?.[`after${this.#capitalize(methodName)}`] === 'function') {
              result = await p.hooks[`after${this.#capitalize(methodName)}`](result, this.#browser);
            }
          }
          
          return result;
        };
      }
    }
  }

  /**
   * Capitalize first letter of string
   * @private
   */
  #capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Unregister a plugin by name
   * @param {string} name - Plugin name to unregister
   */
  unregister(name) {
    const index = this.#plugins.findIndex(p => p.name === name);
    if (index !== -1) {
      this.#plugins.splice(index, 1);
      log.info(`Unregistered plugin: ${name}`);
    }
    return this;
  }

  /**
   * Get all registered plugins
   * @returns {Array} Array of plugins
   */
  getPlugins() {
    return [...this.#plugins];
  }

  /**
   * Get a plugin by name
   * @param {string} name - Plugin name
   * @returns {Object|undefined} Plugin instance
   */
  getPlugin(name) {
    return this.#plugins.find(p => p.name === name);
  }

  /**
   * Execute hooks for a specific lifecycle event
   * @param {string} hookName - Hook name (e.g., 'beforeScreenshot', 'afterClick')
   * @param {*} data - Data to pass to hooks
   * @returns {*} Modified data
   */
  async executeHooks(hookName, data) {
    let result = data;
    
    for (const plugin of this.#plugins.filter(p => p._enabled)) {
      if (typeof plugin.hooks?.[hookName] === 'function') {
        try {
          result = await plugin.hooks[hookName](result, this.#browser);
        } catch (err) {
          log.error(`Plugin ${plugin.name || 'unnamed'} hook '${hookName}' failed: ${err.message}`);
        }
      }
    }
    
    return result;
  }

  /**
   * Extend browser with plugin methods
   * @param {Object} target - Target object to extend (usually the browser instance)
   */
  applyExtensions(target) {
    for (const plugin of this.#plugins.filter(p => p._enabled)) {
      if (typeof plugin.extend === 'function') {
        try {
          const extensions = plugin.extend(this.#browser);
          if (extensions && typeof extensions === 'object') {
            Object.entries(extensions).forEach(([key, value]) => {
              if (typeof value === 'function') {
                target[key] = value.bind(this.#browser);
              } else {
                target[key] = value;
              }
            });
          }
        } catch (err) {
          log.error(`Plugin ${plugin.name || 'unnamed'} extend failed: ${err.message}`);
        }
      }
    }
  }

  /**
   * Apply middleware to intercept method calls
   * @param {string} method - Method name to wrap
   * @param {Function} originalFn - Original function
   * @returns {Function} Wrapped function
   */
  applyMiddleware(method, originalFn) {
    return async (...args) => {
      let result = args;
      
      // Before middleware
      for (const plugin of this.#plugins.filter(p => p._enabled)) {
        if (typeof plugin.middleware?.before?.[method] === 'function') {
          result = await plugin.middleware.before[method](result, this.#browser);
        }
      }

      // Execute original
      const originalResult = await originalFn.apply(this.#browser, result);
      result = originalResult;

      // After middleware
      for (const plugin of this.#plugins.filter(p => p._enabled)) {
        if (typeof plugin.middleware?.after?.[method] === 'function') {
          result = await plugin.middleware.after[method](result, this.#browser);
        }
      }

      return result;
    };
  }
}

/**
 * Create a plugin manager instance
 * @param {WebBrowser} browser - The browser instance
 * @returns {PluginManager} Plugin manager instance
 */
export function createPluginManager(browser) {
  return new PluginManager(browser);
}