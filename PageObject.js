const { assert, expect } = require('chai')
const { until } = require('selenium-webdriver')
const jsonfile = require('jsonfile')
const { log } = require('@nodebug/logger')
const config = require('@nodebug/config')('selenium')
const WebElement = require('./app/WebElement')
const {
  getDriver,
  activateTab,
  closeTabAndSwitch,
  getURL,
  getTitle,
} = require('./driver')
const {
  populateInput,
  populateClick,
  populateSelect,
  populateRichTextField,
} = require('./populate')
const { sleep } = require('./utils')

class PageObject {
  constructor(pageNameInput, pageNameDirectoryInput) {
    this.driver = getDriver()
    this.pageElements = new Map() // a hash of all of the web elements for this page.
    this.loadPageDefinitionFile(pageNameDirectoryInput + pageNameInput)
  }

  addElement(elementName, elements) {
    return this.pageElements.set(elementName, elements)
  }

  getElement(elementName) {
    return this.pageElements.get(elementName)
  }

  hasElement(elementName) {
    return this.pageElements.has(elementName)
  }

  loadPageDefinitionFile(fullFileName) {
    const elements = jsonfile.readFileSync(fullFileName)
    Object.values(elements.webElements).forEach((element) =>
      this.addElement(element.name, element),
    )
  }

  addDynamicElement(elementName, additionalDescription) {
    if (this.hasElement(elementName)) {
      if (typeof additionalDescription !== 'undefined') {
        const newElementName = `${elementName} ${additionalDescription}`
        if (!this.hasElement(newElementName)) {
          const dynamicElement = { ...this.getElement(elementName) }
          dynamicElement.name = newElementName
          dynamicElement.definition = dynamicElement.definition.replace(
            '<ReplaceText>',
            additionalDescription,
          )
          this.addElement(newElementName, dynamicElement)
        }
        return newElementName
      }
      return elementName
    }
    assert.fail(
      `ERROR: WebElement ${elementName} not found in PageElements for adding dynamic element.`,
    )
    return elementName
  }

  async switchFrame(frame) {
    await getDriver().switchTo().defaultContent()
    await sleep(100)
    if (frame !== 'default') {
      if (typeof frame === 'number') {
        log.debug(`Switching to frame number ${frame}`)
        return getDriver().wait(
          until.ableToSwitchToFrame(frame, config.timeout * 1000),
        )
      }
      log.debug(`Switching to frame ${frame}`)
      const WebElementData = await this.getElement(frame)
      const WebElementObject = new WebElement(getDriver(), WebElementData)
      const webElement = await WebElementObject.getWebElement()
      return getDriver().wait(
        until.ableToSwitchToFrame(webElement, config.timeout * 1000),
      )
    }
    return true
  }

  async genericAssertElement(payload) {
    const timeout = (payload.timeout || config.timeout) * 1000
    const { implicit } = await getDriver().manage().getTimeouts()
    await getDriver().manage().setTimeouts({ implicit: 1000 })

    let status
    const element = await this.addDynamicElement(
      payload.elementName,
      payload.replaceText,
    )
    log.info(`Waiting for ${element} to be ${payload.condition}`)
    if (await this.hasElement(element)) {
      const WebElementData = await this.getElement(element)
      await this.switchFrame(WebElementData.frame)
      const WebElementObject = new WebElement(getDriver(), WebElementData)
      try {
        switch (payload.condition.toLowerCase()) {
          case 'disabled':
            await getDriver().manage().setTimeouts({ implicit })
            status = !(await WebElementObject.isEnabled())
            log.debug(`WebElement ${element} is disabled on page. PASS`)
            break
          case 'present':
            status = await WebElementObject.isPresent(timeout)
            log.debug(`WebElement ${element} is present on page. PASS`)
            break
          case 'not present':
            status = await WebElementObject.isNotPresent(timeout)
            log.debug(`WebElement ${element} is not present on page. PASS`)
            break
          default:
            assert.fail(`Only visibility and invisibility suppoorted.
          ${payload.condition} kind of wait is not defined.`)
        }
      } finally {
        await getDriver().manage().setTimeouts({ implicit })
      }
    } else {
      assert.fail(
        `ERROR: WebElement ${element} not found in PageElements during AssertElement attempt.`,
      )
    }
    return status
  }

  async waitForElementVisibility(elementName, replaceText, timeout) {
    try {
      await this.genericAssertElement({
        condition: 'present',
        elementName,
        replaceText,
        timeout,
      })
    } catch (err) {
      log.info(
        `Element not present on page after ${
          timeout || config.timeout
        } second wait`,
      )
      throw err
    }
  }

  async waitForElementInvisibility(elementName, replaceText, timeout) {
    try {
      await this.genericAssertElement({
        condition: 'not present',
        elementName,
        replaceText,
        timeout,
      })
    } catch (err) {
      log.info(
        `Element present on page after ${
          timeout || config.timeout
        } second wait`,
      )
      throw err
    }
  }

  async assertElementExists(elementName, replaceText) {
    return this.waitForElementVisibility(elementName, replaceText)
  }

  async assertElementDoesNotExist(elementName, replaceText) {
    return this.waitForElementInvisibility(elementName, replaceText)
  }

  async checkElementExists(elementName, replaceText) {
    try {
      await this.waitForElementVisibility(elementName, replaceText, 5)
      return true
    } catch (err) {
      return false
    }
  }

  async assertElementDisabled(elementName, replaceText) {
    if (
      !(await this.genericAssertElement({
        condition: 'disabled',
        elementName,
        replaceText,
      }))
    ) {
      assert.fail(
        `Element is not disabled on page after ${config.timeout} second wait`,
      )
    }
    return true
  }

  async genericPopulateElement(payload) {
    try {
      const element = await this.addDynamicElement(
        payload.elementName,
        payload.replaceText,
      )
      if (payload.value.toLowerCase() !== 'click') {
        log.info(
          `Starting populate the WebElement: ${element} with value ${payload.value}`,
        )
      } else {
        log.info(`Starting click the WebElement: ${element}`)
      }

      if (await this.hasElement(element)) {
        const WebElementData = await this.getElement(element)
        await this.switchFrame(WebElementData.frame)
        // Setup all underlying required objects to take action on for this action
        // if (WebElementData && WebElementData.waitForElementToBeInvisible) {
        //   if (await hasElement(WebElementData.waitForElementToBeInvisible)) {
        //     const elementToWaitToBeInvisible = await getElement(WebElementData.waitForElementToBeInvisible);
        //     actionElement.elementToWaitToBeInvisible = elementToWaitToBeInvisible;
        //   }
        // }
        // if (WebElementData && WebElementData.waitToBeVisible) {
        //   if (await hasElement(WebElementData.waitToBeVisible)) {
        //     const waitToBeVisible = await getElement(WebElementData.waitToBeVisible);
        //     actionElement.waitToBeVisible = waitToBeVisible;
        //   }
        // }

        // If need to hit a iframe, do it
        const WebElementObject = new WebElement(getDriver(), WebElementData)
        const webElement = await WebElementObject.getWebElement()
        // console.log(await getDriver().getPageSource())
        const tagName = await webElement.getTagName()
        const actionElement = {}
        actionElement.element = WebElementData
        actionElement.webElement = WebElementObject
        if (payload.value === 'click') {
          await populateClick(webElement, actionElement)
          return true
        }
        switch (tagName.toLowerCase()) {
          case 'input':
          case 'textarea':
            await populateInput(webElement, payload.value, actionElement)

            break
          case 'a':
          case 'button':
          case 'div':
          case 'span':
          case 'ul':
          case 'li':
          case 'th':
          case 'h2':
          case 'section':
            await populateRichTextField(
              webElement,
              payload.value,
              actionElement,
            )
            break
          case 'svg':
            await populateSelect(webElement, payload.value, actionElement)
            break
          case 'select':
          case 'p':
            await populateSelect(webElement, payload.value, actionElement)
            break
          case 'label':
          case 'option':
            await populateClick(webElement, actionElement)
            break
          default:
            assert.fail(`ERROR: We tried to populate an unknown tag(${tagName}) of
          element(${element}) with data in populateGenericElement()\n\tWe failed.`)
        }
      } else {
        assert.fail(
          `ERROR: WebElement ${element} not found in PageElements during PopulateElement() attempt.`,
        )
      }
    } catch (err) {
      log.error(err.stack)
      throw err
    }
    return true
  }

  async populate(elementName, replaceText, value) {
    if (value === undefined && replaceText !== undefined) {
      /* eslint-disable no-param-reassign */
      value = replaceText
      replaceText = undefined
      /* eslint-enable no-param-reassign */
    }
    return this.genericPopulateElement({ elementName, replaceText, value })
  }

  async click(elementName, replaceText) {
    return this.genericPopulateElement({
      elementName,
      replaceText,
      value: 'click',
    })
  }

  async genericPopulateDatable(table) {
    log.debug('I populated table')

    const rows = table.raw()
    const numberOfColumns = rows[0].length
    const numberOfRows = rows.length - 1

    for (let rowIndex = 1; rowIndex < numberOfRows; rowIndex += 1) {
      for (
        let columnIndex = 0;
        columnIndex < numberOfColumns;
        columnIndex += 1
      ) {
        log.debug('TABLE: ', rows[0][columnIndex], rows[rowIndex][columnIndex])
        // eslint-disable-next-line no-await-in-loop
        await this.genericPopulateElement(
          rows[0][columnIndex],
          rows[rowIndex][columnIndex],
        )
      }
    }
    return true
  }

  async getWebElements(elementName, replaceText) {
    let elementList
    const element = await this.addDynamicElement(elementName, replaceText)

    if (await this.hasElement(element)) {
      const WebElementData = await this.getElement(element)
      await this.switchFrame(WebElementData.frame)
      const WebElementObject = new WebElement(getDriver(), WebElementData)
      elementList = await WebElementObject.getWebElements()
      return elementList
    }
    assert.fail(`Element ${element} not found.`)
    return elementList
  }

  // const generateDataTable = async (padLength) => {
  //   const localPadLength = padLength || 0;
  //   const _NA = '| NA'.padEnd(localPadLength + 1);
  //   console.log(`\nGenerating data table for ${this.pageName} \n`);
  //   try {
  //     // Return a | delimited list of the field names in the pageDefs file for this PageObject
  //     console.log(`|${this.pageElements.keyList('|', localPadLength)}`);

  //     // Generate a list of NA for the page object.
  //     let NAList = '';
  //     let i;
  //     const elementCount = this.pageElements.length;
  //     for (i = 0; i < elementCount; i++) {
  //       NAList += _NA;
  //     }
  //     console.log(`${NAList}|`);
  //   } catch (err) {
  //     log.error(err.stack);
  //     throw err;
  //   }
  // };

  // to be revisited
  async scrollElementIntoView(elementName, replaceText) {
    const element = await this.addDynamicElement(elementName, replaceText)
    log.debug(`Scrolling element: ${element} into view.`)
    if (await this.hasElement(element)) {
      const WebElementData = await this.getElement(element)
      await this.switchFrame(WebElementData.frame)
      const WebElementObject = new WebElement(getDriver(), WebElementData)
      log.info(
        `Info: Page Element ${element} retrieved from Page Elements collection for exists check.`,
      )
      return WebElementObject.scrollIntoView()
    }
    assert.fail(
      `ERROR: WebElement ${element} not found in PageElements during scrollElementIntoView() attempt.`,
    )
    return true
  }

  // to be revisited
  async genericGetAttribute(payload) {
    let returnValue
    const element = await this.addDynamicElement(
      payload.elementName,
      payload.replaceText,
    )
    log.debug(`Getting attribute value for WebElement ${element}`)
    if (await this.hasElement(element)) {
      const WebElementData = await this.getElement(element)
      await this.switchFrame(WebElementData.frame)
      const WebElementObject = new WebElement(getDriver(), WebElementData)
      const webElement = await WebElementObject.getWebElement()
      try {
        switch (payload.attribute.toLowerCase()) {
          case 'text':
            returnValue = await webElement.getText()
            break

          case 'selected':
            returnValue = await webElement.isSelected()
            break

          default:
            returnValue = await webElement.getAttribute(payload.attribute)
            break
        }
      } catch (err) {
        log.error(err.stack)
        throw err
      }
    } else {
      assert.fail(
        `ERROR: WebElement ${element} not found in PageElements during GetAttributeValue() attempt.`,
      )
    }
    log.info(
      `Attribute "${payload.attribute}" value for element "${element}" is "${returnValue}".`,
    )
    return returnValue
  }

  async getAttributeValue(elementName, replaceText, attribute) {
    if (attribute === undefined && replaceText !== undefined) {
      /* eslint-disable no-param-reassign */
      attribute = replaceText
      replaceText = undefined
      /* eslint-enable no-param-reassign */
    }
    // eslint-disable-next-line no-param-reassign
    attribute = attribute || 'textContent'
    return this.genericGetAttribute({ elementName, replaceText, attribute })
  }

  async getText(elementName, replaceText) {
    return this.genericGetAttribute({
      elementName,
      replaceText,
      attribute: 'textContent',
    })
  }

  async assertText(elementName, replaceText, expectedValue) {
    if (expectedValue === undefined && replaceText !== undefined) {
      /* eslint-disable no-param-reassign */
      expectedValue = replaceText
      replaceText = undefined
      /* eslint-enable no-param-reassign */
    }
    log.info(`Asserting text for "${elementName} ${replaceText}".`)
    const text = await this.genericGetAttribute({
      elementName,
      replaceText,
      attribute: 'textContent',
    })
    if (await expect(text).to.equal(expectedValue)) {
      log.info(
        `WebElement text "${text}" equals Expected value "${expectedValue}". PASS`,
      )
    }
  }

  async assertTextIncludes(elementName, replaceText, expectedValue) {
    if (expectedValue === undefined && replaceText !== undefined) {
      /* eslint-disable no-param-reassign */
      expectedValue = replaceText
      replaceText = undefined
      /* eslint-enable no-param-reassign */
    }
    log.info(`Asserting text for "${elementName} ${replaceText}".`)
    const text = await this.genericGetAttribute({
      elementName,
      replaceText,
      attribute: 'textContent',
    })
    if (await expect(text).to.include(expectedValue)) {
      log.info(
        `WebElement text "${text}" includes Expected value "${expectedValue}". PASS`,
      )
    }
  }

  async assertTextDoesNotInclude(elementName, replaceText, expectedValue) {
    if (expectedValue === undefined && replaceText !== undefined) {
      /* eslint-disable no-param-reassign */
      expectedValue = replaceText
      replaceText = undefined
      /* eslint-enable no-param-reassign */
    }
    log.info(`Asserting text for "${elementName} ${replaceText}".`)
    const text = await this.genericGetAttribute({
      elementName,
      replaceText,
      attribute: 'textContent',
    })
    if (await expect(text).to.not.include(expectedValue)) {
      log.info(
        `WebElement text "${text}" does not include Expected value "${expectedValue}". PASS`,
      )
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async switchToTab(tabName) {
    try {
      log.debug(`Switching to tab : ${tabName}`)
      if (!(await activateTab(tabName))) {
        assert.fail(`${tabName} tab was not found. FAIL`)
      }
    } catch (err) {
      log.error(err.stack)
      throw err
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async closeTab(tabName) {
    try {
      log.debug(`Closing tab : ${tabName}`)
      await closeTabAndSwitch(tabName)
    } catch (err) {
      log.error(err.stack)
      throw err
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async getCurrentURL() {
    try {
      log.debug('Getting URL of the current tab.')
      return getURL()
    } catch (err) {
      log.error(err.stack)
      throw err
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async getPageTitle() {
    try {
      log.debug('Getting the title of the current tab.')
      return getTitle()
    } catch (err) {
      log.error(err.stack)
      throw err
    }
  }

  async assertPageTitle(expectedValue) {
    try {
      const actualValue = await this.getPageTitle()
      log.info('Asserting page title match for current tab.')
      if (await expect(actualValue).to.equal(expectedValue)) {
        log.info(
          `Actual value "${actualValue}" equals Expected value "${expectedValue}". PASS`,
        )
      }
    } catch (err) {
      log.error(err.stack)
      throw err
    }
  }

  async assertPageTitleIncludes(expectedValue) {
    try {
      const actualValue = await this.getPageTitle()
      log.info('Asserting page title partial match for current tab.')
      if (await expect(actualValue).to.include(expectedValue)) {
        log.info(
          `Actual value "${actualValue}" includes Expected value "${expectedValue}". PASS`,
        )
      }
    } catch (err) {
      log.error(err.stack)
      throw err
    }
  }

  // eslint-disable-next-line class-methods-use-this
  async genericAlertOperations(operation) {
    let retval
    if (await getDriver().wait(until.alertIsPresent())) {
      const alert = getDriver().switchTo().alert()
      switch (operation.toLowerCase()) {
        case 'accept':
          retval = await alert.accept()
          break
        case 'dismiss':
          retval = await alert.dismiss()
          break
        case 'text':
          retval = alert.getText()
          break
        default:
          assert.fail(
            `ERROR: ${operation} is not implemented in genericAlertOperations().`,
          )
      }
    } else {
      assert.fail('ERROR: Assert pop up was not displayed.')
    }
    return retval
  }

  async acceptAlert() {
    await this.genericAlertOperations('accept')
    log.info('Accepted alert popup.')
  }

  async dismissAlert() {
    await this.genericAlertOperations('dismiss')
    log.info('Dismissed alert popup.')
  }

  async getAlertText() {
    log.debug('Getting text in alert popup.')
    const text = await this.genericAlertOperations('text')
    log.info(`${text} is displayed in the alert popup.`)
    return text
  }

  async assertAlertText(expectedValue) {
    log.debug('Asserting text in alert popup.')
    const text = await this.genericAlertOperations('text')
    if (text === expectedValue) {
      log.info(
        `Actual value "${text}" matches Expected value "${expectedValue}". PASS`,
      )
    } else {
      assert.fail(
        `Actual value "${text}" does not match Expected value "${expectedValue}". FAIL`,
      )
    }
  }

  async assertAlertTextIncludes(expectedValue) {
    log.debug('Asserting text in alert popup.')
    const text = await this.genericAlertOperations('text')
    if (text.includes(expectedValue)) {
      log.info(
        `Actual value "${text}" includes Expected value "${expectedValue}". PASS`,
      )
    } else {
      assert.fail(
        `Actual value "${text}" does not include Expected value "${expectedValue}". FAIL`,
      )
    }
  }

  async dragAndDrop(
    dragElementName,
    dropElementName,
    dragReplaceText,
    dropReplaceText,
  ) {
    let From
    let To

    const fromElementName = await this.addDynamicElement(
      dragElementName,
      dragReplaceText,
    )
    const toElementName = await this.addDynamicElement(
      dropElementName,
      dropReplaceText,
    )
    await this.assertElementExists(fromElementName)
    await this.assertElementExists(toElementName)
    if (await this.hasElement(fromElementName)) {
      const WebElementData = await this.getElement(fromElementName)
      await this.switchFrame(WebElementData.frame)
      const WebElementObject = new WebElement(getDriver(), WebElementData)
      await WebElementObject.scrollIntoView()
      From = await WebElementObject.getWebElement()
    }
    if (await this.hasElement(toElementName)) {
      const WebElementData = await this.getElement(toElementName)
      await this.switchFrame(WebElementData.frame)
      const WebElementObject = new WebElement(getDriver(), WebElementData)
      await WebElementObject.scrollIntoView()
      To = await WebElementObject.getWebElement()
    }
    try {
      const actions = getDriver().actions({ bridge: true })
      await actions.dragAndDrop(From, To).perform()
      log.debug(
        `Dropped element "${fromElementName}" on element "${toElementName}". PASS`,
      )
    } catch (err) {
      assert.fail(
        `Unable to perform drag and drop operation due to error. FAIL. Error ${err}`,
      )
    }
  }
}

module.exports = PageObject
