import { log } from '@nodebug/logger';
import config from '@nodebug/config';

const selenium = config('selenium');

export class BaseGet {
    constructor(driver, label) {
        this._driver = driver;
        this._label = label;
    }

    async title() {
        try {
            return await this._driver.getTitle();
        } catch (err) {
            log.error(`Unrecognized error while getting the ${this._label.toLowerCase()} title : ${err.message}`);
            throw err;
        }
    }

    async url() {
        try {
            return await this._driver.getCurrentUrl();
        } catch (err) {
            log.error(`Unrecognized error while getting the current URL : ${err.message}`);
            throw err;
        }
    }
}

export class BrowserTarget {
    constructor(driver, label = 'Target') {
        this._label = label;
        if (driver) this.initialize(driver);
    }

    initialize(driver) {
        this._driver = driver;
        this.get = new BaseGet(driver, this._label);
    }

    get timeout() { return (selenium.timeout || 10) * 1000; }
    set driver(value) { this.initialize(value); }
    get driver() { return this._driver; }

    with() { return this; }

    title(value) {
        this._targetTitle = value;
        return this;
    }

    async _findTarget(shouldSwitch, customTimeout) {
        const timeout = customTimeout ?? this.timeout;
        log.debug(`Checking ${this._label} with title '${this._targetTitle}' is displayed`);

        if (this._targetTitle === undefined) {
            log.warn(`${this._label} title is not defined. Please set a title to check for using the 'title' function.`);
        }

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