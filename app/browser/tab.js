import { log } from '@nodebug/logger';
import { BrowserTarget } from './browser-target.js';

class Tab extends BrowserTarget {
    constructor(driver) {
        super(driver, 'Tab');
    }

    async isDisplayed(t) { return await this._findTarget(false, t); }
    async switch(t) { return await this._findTarget(true, t); }

    async new() {
        log.info(`Opening new tab in the browser window`);
        return await this.driver.switchTo().newWindow('tab');
    }

    async close() { return super.close('Tab'); }

    async switchTab(tab) {
        log.info(`Switching to Tab ${tab}`);
        if (typeof tab === 'number') {
            const handles = await this.driver.getAllWindowHandles();
            return await this.driver.switchTo().window(handles[tab]);
        }
        this.title(tab);
        return await this.switch();
    }
}

export default Tab;