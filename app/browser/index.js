const config = require('@nodebug/config')('selenium')
const { log } = require('@nodebug/logger')
const { Builder } = require('selenium-webdriver')
const capabilities = require('../capabilities')
const Window = require('./window')
const remote = require('selenium-webdriver/remote')

class Browser {
    constructor() {
        this.window = new Window()
        this.capabilities = capabilities()
        this.capabilities.set('pageLoadStrategy', 'normal')

        if (config.grid !== null) {
            this.hub = config.grid
        }
    }

    get capabilities() {
        return this._capabilities
    }

    set capabilities(value) {
        this._capabilities = value
    }

    set driver(value) {
        this._driver = value
        this.window.driver = value
    }

    get driver() {
        return this._driver
    }

    async new() {
        const builder = new Builder()
        builder.withCapabilities(this.capabilities)
        if (this.hub !== undefined) {
            builder.usingServer(this.hub)
        }
        this.driver = builder.build()

        if (!['', undefined, null].includes(this.hub)) {
            await this.driver.setFileDetector(new remote.FileDetector())
        }

        await this.sleep(2000)

            ;['SIGINT', 'SIGTERM', 'exit', 'uncaughtException'].forEach((signal) =>
                process.on(signal, async () => {
                    await this.close()
                    process.exit()
                }),
            )
    }

    timeout() {
        return parseInt(config.timeout, 10) * 1000
    }

    async sleep(ms) {
        log.info(`Sleeping for ${ms} ms`)
        return new Promise((resolve) => setTimeout(resolve, ms))
    }

    async name() {
        return (await this.driver.getCapabilities())
            .get('browserName')
            .replace(/\s/g, '')
    }

    async os() {
        return (await this.driver.getCapabilities())
            .get('platformName')
            .replace(/\s/g, '')
    }

    async close() {
        try {
            log.info(`Closing the browser. Current URL is ${await this.window.get.url()}.`)
            await this.driver.quit()
        } catch (err) {
            log.error(
                `Unrecognized error while deleting existing sessions : ${err.message}`,
            )
        }
        return true
    }

    async setSize(size) {
        await this.window.maximize()
        try {
            if (![0, undefined, null].includes(size.height)
                && ![0, undefined, null].includes(size.width)) {
                log.info(`Resizing the browser to ${JSON.stringify(size)}.`)
                await this.driver.manage().window().setRect(size)
                await this.driver.switchTo().defaultContent()
                const deltaWidth = await this.driver.executeScript(
                    'return window.outerWidth - window.innerWidth',
                )
                const deltaHeight = await this.driver.executeScript(
                    'return window.outerHeight - window.innerHeight',
                )
                const lSize = size
                lSize.width += deltaWidth
                lSize.height += deltaHeight
                lSize.x = 0
                lSize.y = 0
                await this.driver.manage().window().setRect(lSize)
                log.info(`Resizing the browser to ${JSON.stringify(size)}.`)
                return this.driver.manage().window().setRect(size)
            }
        } catch (err) {
            log.error(err)
            throw err
        }
        return false
    }

    async getSize() {
        await this.driver.switchTo().defaultContent()
        const width = await this.driver.executeScript('return window.innerWidth')
        const height = await this.driver.executeScript('return window.innerHeight')
        return { width, height }
    }

    async goto(url) {
        log.info(`Loading the url ${url} in the browser.`)
        try {
            await this.setSize({
                width: parseInt(config.width, 10),
                height: parseInt(config.height, 10),
            })
            await this.driver.manage().setTimeouts({
                implicit: 500,
                pageLoad: 6 * this.timeout(),
                script: 6 * this.timeout(),
            })
            await this.driver.get(url)
            return true
        } catch (err) {
            log.error(`Unable to navigate to ${url}\nError ${err.stack}`)
            throw err
        }
    }

    async refresh() {
        log.info(`Refreshing ${await this.window.get.title()}`)
        return this.driver.navigate().refresh()
    }

    async goBack() {
        log.info(`Current page is ${await this.window.get.title()}`)
        log.info(`Performing browser back`)
        await this.driver.navigate().back()
        log.info(`Loaded page is ${await this.window.get.title()}`)
        return true
    }

    async goForward() {
        log.info(`Current page is ${await this.window.get.title()}`)
        log.info(`Performing browser forward`)
        await this.driver.navigate().forward()
        log.info(`Loaded page is ${await this.window.get.title()}`)
        return true
    }

    async reset() {
        log.info(`Resetting the browser, cache and cookies`)
        const hs = await this.driver.getAllWindowHandles()
        for (let i = 1; i < hs.length; i++) {
            /* eslint-disable no-await-in-loop */
            await this.driver.switchTo().window(hs[i])
            await this.driver.close()
            await this.driver.switchTo().window(hs[0])
            /* eslint-enable no-await-in-loop */
        }
        await this.driver.manage().deleteAllCookies()
        return this.driver.executeScript(
            'window.sessionStorage.clear();window.localStorage.clear();',
        )
    }

    async consoleErrors() {
        log.info(`Getting console errors on page ${await this.window.get.title()}`)

        const entries = []
        const logs = []
        const promises = ['browser'].map(async (type) => {
            entries.push(...(await this.driver.manage().logs().get(type)))
        })
        await Promise.all(promises)
            ;['SEVERE'].map(async (level) => {
                logs.push(...entries.filter((entry) => entry.level.name === level))
            })

        return logs
    }

    actions() {
        return this.driver.actions({ async: true })
    }
}

module.exports = Browser