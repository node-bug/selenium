import { log } from '@nodebug/logger';
import config from '@nodebug/config';

const selenium = config('selenium');

export class BrowserTarget {
    constructor(driver, label = 'Target') {
        this._label = label;
        if (driver) this.initialize(driver);
    }

    initialize(driver) {
        this._driver = driver;
    }

    get get() {
        return {
            title: async () => {
                try {
                    await this._ensureFocus(); // 'this' correctly points to the Window/Tab
                    return await this._driver.getTitle();
                } catch (err) {
                    log.error(`Unrecognized error while getting the ${this._label.toLowerCase()} title : ${err.message}`);
                    throw err;
                }
            },
            url: async () => {
                try {
                    await this._ensureFocus(); // Ensuring focus before fetching URL
                    return await this._driver.getCurrentUrl();
                } catch (err) {
                    log.error(`Unrecognized error while getting the current URL : ${err.message}`);
                    throw err;
                }
            }
        };
    }

    get timeout() { return (selenium.timeout || 10) * 1000; }
    set driver(value) { this.initialize(value); }
    get driver() { return this._driver; }

    with() { return this; }

    title(value) {
        this._targetTitle = value;
        return this;
    }

    /**
     * Stores a title that MUST be active before the next command.
     */
    smartPrepare(title) {
        this._pendingTitle = title;
    }

    /**
     * Internal helper to ensure we are on the right target 
     * before executing get.url(), maximize(), etc.
     */
    async _ensureFocus() {
        if (!this._pendingTitle) return;

        // INDEX BASED SMART FOCUS
        if (typeof this._pendingTitle === 'number') {
            log.debug(`SmartSwitch: Ensuring focus on ${this._label} index ${this._pendingTitle}`);
            await this.title(this._pendingTitle).switch();
        } 
        // NAME BASED SMART FOCUS
        else {
            const currentTitle = await this.driver.getTitle();
            if (!currentTitle.includes(this._pendingTitle)) {
                log.debug(`SmartSwitch: Current title '${currentTitle}' does not match '${this._pendingTitle}'. Switching...`);
                await this.title(this._pendingTitle).switch();
            }
        }
        this._pendingTitle = undefined;
    }

    async _findTarget(shouldSwitch, customTimeout) {
        const timeout = customTimeout ?? this.timeout;
        log.debug(`Checking ${this._label} with title '${this._targetTitle}' is displayed`);

        // 1. FAST PATH FOR INDEX-BASED SWITCHING
        if (typeof this._targetTitle === 'number') {
            const handles = await this.driver.getAllWindowHandles();
            if (this._targetTitle >= handles.length || this._targetTitle < 0) {
                throw new Error(`${this._label} index ${this._targetTitle} is out of bounds (Total: ${handles.length})`);
            }
            const handle = handles[this._targetTitle];
            await this.driver.switchTo().window(handle);
            this._targetTitle = undefined;
            return true;
        }

        // 2. NAME-BASED SEARCH LOOP
        log.debug(`Checking ${this._label} with title '${this._targetTitle}' is displayed`);
        let og;
        try {
            og = await this.driver.getWindowHandle();
        } catch (err) {
            if (err.name === 'NoSuchWindowError') {
                log.error(`The active ${this._label} was closed. Is that expected?`);
            } else {
                log.error(`Unrecognized error while switching ${this._label}. ${err}`);
                throw err;
            }
        }

        const startTime = Date.now();
        try {
            while (Date.now() - startTime < timeout) {
                try {
                    const handles = await this.driver.getAllWindowHandles();
                    for (const handle of handles) {
                        await this.driver.switchTo().window(handle);
                        const currentTitle = await this.get.title();

                        if (currentTitle.includes(this._targetTitle)) {
                            if (shouldSwitch) {
                                log.debug(`Successfully switched to ${this._label} with title '${currentTitle}'`);
                            } else {
                                if (og) await this.driver.switchTo().window(og);
                                log.debug(`Found ${this._label} with title '${currentTitle}'`);
                            }
                            return true;
                        }
                    }
                } catch (err) {
                    log.error(`Unrecognized error while checking ${this._label} is displayed : ${err.message}`);
                    throw err;
                }
                await new Promise(r => setTimeout(r, 200));
            }

            if (shouldSwitch) {
                log.error(`${this._label} was not found on screen after '${timeout} ms' timeout`);
                throw new Error(`${this._label} was not found on screen after '${timeout} ms' timeout`);
            } else {
                log.info(`${this._label} was not found on screen after '${timeout} ms' timeout`);
                if (og) await this.driver.switchTo().window(og);
                return false;
            }
        } finally {
            this._targetTitle = undefined; // Ensure state is never persistent
        }
    }

    async close() {
        log.info(`Closing ${this._label} with title '${await this.get.title()}'`);
        await this.driver.close();
        const handles = await this.driver.getAllWindowHandles();
        if (handles.length <= 0) {
            log.error(`No browser windows are currenlty open. Is this expected?`);
        } else {
            await this.driver.switchTo().window(handles[0]);
        }
        log.info(`Currently active ${this._label} is '${await this.get.title()}'`);
        return true;
    }

    async isDisplayed(t) { return await this._findTarget(false, t); }
    async switch(t) {
        const found = await this._findTarget(true, t);
        if (!found) throw new Error(`Target "${this._targetTitle}" not found`);
        return true;
    }
}