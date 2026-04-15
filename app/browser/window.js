import { log } from '@nodebug/logger';
import { BrowserTarget } from './browser-target.js';

class Window extends BrowserTarget {
    constructor(driver) {
        super(driver, 'Window');
    }

    async isDisplayed(t) { return await this._findTarget(false, t); }
    async switch(t) { return await this._findTarget(true, t); }

    async new() {
        log.info(`Opening new browser window`);
        return this.driver.switchTo().newWindow('window');
    }

    async close() { return super.close('Window'); }

    async maximize() {
        log.info(`Maximizing browser window`);
        return this.driver.manage().window().maximize();
    }
    async minimize() {
        log.info(`Minimizing browser`);
        return this.driver.manage().window().minimize();
    }
    async fullscreen() {
        log.info(`Switching to fullscreen`);
        return this.driver.manage().window().fullscreen();
    }
}

export default Window;