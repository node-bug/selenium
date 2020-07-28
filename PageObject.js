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

function PageObject(pageNameInput, pageNameDirectoryInput) {
  const that = {}
  that.pageName = pageNameInput
  that.pageDefinitionFileName = pageNameDirectoryInput + pageNameInput
  that.pageElements = new Map() // a hash of all of the web elements for this page.
  that.driver = getDriver()

  function addElement(elementName, elements) {
    return that.pageElements.set(elementName, elements)
  }

  function getElement(elementName) {
    return that.pageElements.get(elementName)
  }

  function hasElement(elementName) {
    return that.pageElements.has(elementName)
  }

  function loadPageDefinitionFile(fullFileName) {
    const elements = jsonfile.readFileSync(fullFileName)
    Object.values(elements.webElements).forEach((element) =>
      addElement(element.name, element),
    )
  }

  function addDynamicElement(elementName, additionalDescription) {
    if (hasElement(elementName)) {
      if (typeof additionalDescription !== 'undefined') {
        const newElementName = `${elementName} ${additionalDescription}`
        if (!hasElement(newElementName)) {
          const dynamicElement = { ...getElement(elementName) }
          dynamicElement.name = newElementName
          dynamicElement.definition = dynamicElement.definition.replace(
            '<ReplaceText>',
            additionalDescription,
          )
          addElement(newElementName, dynamicElement)
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

  async function switchFrame(frame) {
    await that.driver.switchTo().defaultContent()
    await sleep(100)
    if (frame !== 'default') {
      if (typeof frame === 'number') {
        log.debug(`Switching to frame number ${frame}`)
        return that.driver.wait(
          until.ableToSwitchToFrame(frame, config.timeout * 1000),
        )
      }
      log.debug(`Switching to frame ${frame}`)
      const WebElementData = await getElement(frame)
      const WebElementObject = new WebElement(that.driver, WebElementData)
      const webElement = await WebElementObject.getWebElement()
      return that.driver.wait(
        until.ableToSwitchToFrame(webElement, config.timeout * 1000),
      )
    }
    return true
  }

  async function genericAssertElement(payload) {
    const timeout = (payload.timeout || config.timeout) * 1000
    const { implicit } = await that.driver.manage().getTimeouts()
    await that.driver.manage().setTimeouts({ implicit: 1000 })

    let status
    const element = await addDynamicElement(
      payload.elementName,
      payload.replaceText,
    )
    log.info(`Waiting for ${element} to be ${payload.condition}`)
    if (await hasElement(element)) {
      const WebElementData = await getElement(element)
      await switchFrame(WebElementData.frame)
      const WebElementObject = new WebElement(that.driver, WebElementData)
      try {
        switch (payload.condition.toLowerCase()) {
          case 'disabled':
            await that.driver.manage().setTimeouts({ implicit })
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
        await that.driver.manage().setTimeouts({ implicit })
      }
    } else {
      assert.fail(
        `ERROR: WebElement ${element} not found in PageElements during AssertElement attempt.`,
      )
    }
    return status
  }

  async function visibilityWait(elementName, replaceText, timeout) {
    try {
      await genericAssertElement({
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

  async function invisibilityWait(elementName, replaceText, timeout) {
    try {
      await genericAssertElement({
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

  async function assertElementExists(elementName, replaceText) {
    return visibilityWait(elementName, replaceText)
  }

  async function assertElementDoesNotExist(elementName, replaceText) {
    return invisibilityWait(elementName, replaceText)
  }

  async function checkElementExists(elementName, replaceText) {
    try {
      await visibilityWait(elementName, replaceText, 5)
      return true
    } catch (err) {
      return false
    }
  }

  async function assertElementDisabled(elementName, replaceText) {
    if (
      !(await genericAssertElement({
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

  async function genericPopulateElement(payload) {
    try {
      const element = await addDynamicElement(
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

      if (await hasElement(element)) {
        const WebElementData = await getElement(element)
        await switchFrame(WebElementData.frame)
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
        const WebElementObject = new WebElement(that.driver, WebElementData)
        const webElement = await WebElementObject.getWebElement()
        // console.log(await that.driver.getPageSource())
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

  async function populateElement(elementName, replaceText, value) {
    if (value === undefined && replaceText !== undefined) {
      /* eslint-disable no-param-reassign */
      value = replaceText
      replaceText = undefined
      /* eslint-enable no-param-reassign */
    }
    return genericPopulateElement({ elementName, replaceText, value })
  }

  async function clickElement(elementName, replaceText) {
    return genericPopulateElement({ elementName, replaceText, value: 'click' })
  }

  async function genericPopulateDatable(table) {
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
        await genericPopulateElement(
          rows[0][columnIndex],
          rows[rowIndex][columnIndex],
        )
      }
    }
    return true
  }

  async function getWebElements(elementName, replaceText) {
    let elementList
    const element = await addDynamicElement(elementName, replaceText)

    if (await hasElement(element)) {
      const WebElementData = await getElement(element)
      await switchFrame(WebElementData.frame)
      const WebElementObject = new WebElement(that.driver, WebElementData)
      elementList = await WebElementObject.getWebElements()
      return elementList
    }
    assert.fail(`Element ${element} not found.`)
    return elementList
  }

  // const generateDataTable = async (padLength) => {
  //   const localPadLength = padLength || 0;
  //   const _NA = '| NA'.padEnd(localPadLength + 1);
  //   console.log(`\nGenerating data table for ${that.pageName} \n`);
  //   try {
  //     // Return a | delimited list of the field names in the pageDefs file for this PageObject
  //     console.log(`|${that.pageElements.keyList('|', localPadLength)}`);

  //     // Generate a list of NA for the page object.
  //     let NAList = '';
  //     let i;
  //     const elementCount = that.pageElements.length;
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
  async function scrollElementIntoView(elementName, replaceText) {
    const element = await addDynamicElement(elementName, replaceText)
    log.debug(`Scrolling element: ${element} into view.`)
    if (await hasElement(element)) {
      const WebElementData = await getElement(element)
      await switchFrame(WebElementData.frame)
      const WebElementObject = new WebElement(that.driver, WebElementData)
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
  async function genericGetAttribute(payload) {
    let returnValue
    const element = await addDynamicElement(
      payload.elementName,
      payload.replaceText,
    )
    log.debug(`Getting attribute value for WebElement ${element}`)
    if (await hasElement(element)) {
      const WebElementData = await getElement(element)
      await switchFrame(WebElementData.frame)
      const WebElementObject = new WebElement(that.driver, WebElementData)
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

  async function getAttributeValue(elementName, replaceText, attribute) {
    if (attribute === undefined && replaceText !== undefined) {
      /* eslint-disable no-param-reassign */
      attribute = replaceText
      replaceText = undefined
      /* eslint-enable no-param-reassign */
    }
    // eslint-disable-next-line no-param-reassign
    attribute = attribute || 'textContent'
    return genericGetAttribute({ elementName, replaceText, attribute })
  }

  async function getText(elementName, replaceText) {
    return genericGetAttribute({
      elementName,
      replaceText,
      attribute: 'textContent',
    })
  }

  async function assertText(elementName, replaceText, expectedValue) {
    if (expectedValue === undefined && replaceText !== undefined) {
      /* eslint-disable no-param-reassign */
      expectedValue = replaceText
      replaceText = undefined
      /* eslint-enable no-param-reassign */
    }
    log.info(`Asserting text for "${elementName} ${replaceText}".`)
    const text = await genericGetAttribute({
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

  async function assertTextIncludes(elementName, replaceText, expectedValue) {
    if (expectedValue === undefined && replaceText !== undefined) {
      /* eslint-disable no-param-reassign */
      expectedValue = replaceText
      replaceText = undefined
      /* eslint-enable no-param-reassign */
    }
    log.info(`Asserting text for "${elementName} ${replaceText}".`)
    const text = await genericGetAttribute({
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

  async function assertTextDoesNotInclude(
    elementName,
    replaceText,
    expectedValue,
  ) {
    if (expectedValue === undefined && replaceText !== undefined) {
      /* eslint-disable no-param-reassign */
      expectedValue = replaceText
      replaceText = undefined
      /* eslint-enable no-param-reassign */
    }
    log.info(`Asserting text for "${elementName} ${replaceText}".`)
    const text = await genericGetAttribute({
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

  async function switchToTab(tabName) {
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

  async function closeTab(tabName) {
    try {
      log.debug(`Closing tab : ${tabName}`)
      await closeTabAndSwitch(tabName)
    } catch (err) {
      log.error(err.stack)
      throw err
    }
  }

  async function getCurrentURL() {
    try {
      log.debug('Getting URL of the current tab.')
      return await getURL()
    } catch (err) {
      log.error(err.stack)
      throw err
    }
  }

  async function getPageTitle() {
    try {
      log.debug('Getting the title of the current tab.')
      return await getTitle()
    } catch (err) {
      log.error(err.stack)
      throw err
    }
  }

  async function assertPageTitle(expectedValue) {
    try {
      const actualValue = await getPageTitle()
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

  async function assertPageTitleIncludes(expectedValue) {
    try {
      const actualValue = await getPageTitle()
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

  async function genericAlertOperations(operation) {
    let retval
    if (await that.driver.wait(until.alertIsPresent())) {
      const alert = that.driver.switchTo().alert()
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

  async function acceptAlert() {
    await genericAlertOperations('accept')
    log.info('Accepted alert popup.')
  }

  async function dismissAlert() {
    await genericAlertOperations('dismiss')
    log.info('Dismissed alert popup.')
  }

  async function getAlertText() {
    log.debug('Getting text in alert popup.')
    const text = await genericAlertOperations('text')
    log.info(`${text} is displayed in the alert popup.`)
    return text
  }

  async function assertAlertText(expectedValue) {
    log.debug('Asserting text in alert popup.')
    const text = await genericAlertOperations('text')
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

  async function assertAlertTextIncludes(expectedValue) {
    log.debug('Asserting text in alert popup.')
    const text = await genericAlertOperations('text')
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

  async function dragAndDrop(
    dragElementName,
    dropElementName,
    dragReplaceText,
    dropReplaceText,
  ) {
    let From
    let To

    const fromElementName = await addDynamicElement(
      dragElementName,
      dragReplaceText,
    )
    const toElementName = await addDynamicElement(
      dropElementName,
      dropReplaceText,
    )
    await assertElementExists(fromElementName)
    await assertElementExists(toElementName)
    if (await hasElement(fromElementName)) {
      const WebElementData = await getElement(fromElementName)
      await switchFrame(WebElementData.frame)
      const WebElementObject = new WebElement(that.driver, WebElementData)
      await WebElementObject.scrollIntoView()
      From = await WebElementObject.getWebElement()
    }
    if (await hasElement(toElementName)) {
      const WebElementData = await getElement(toElementName)
      await switchFrame(WebElementData.frame)
      const WebElementObject = new WebElement(that.driver, WebElementData)
      await WebElementObject.scrollIntoView()
      To = await WebElementObject.getWebElement()
    }
    try {
      const actions = that.driver.actions({ bridge: true })
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

  that.acceptAlert = acceptAlert
  that.dismissAlert = dismissAlert
  that.getAlertText = getAlertText
  that.assertAlertText = assertAlertText
  that.assertAlertTextIncludes = assertAlertTextIncludes
  that.assertText = assertText
  that.assertTextIncludes = assertTextIncludes
  that.assertTextDoesNotInclude = assertTextDoesNotInclude
  that.assertElementDisabled = assertElementDisabled
  that.getElement = getElement
  that.hasElement = hasElement
  that.getDriver = getDriver
  that.populate = populateElement
  that.click = clickElement
  that.getAttributeValue = getAttributeValue
  that.populateFromDataTable = genericPopulateDatable
  that.populateDatatable = genericPopulateDatable
  that.checkElementExists = checkElementExists
  that.assertElementExists = assertElementExists
  that.assertElementDoesNotExist = assertElementDoesNotExist
  that.getWebElements = getWebElements
  // that.generateDataTable = generateDataTable;
  that.scrollElementIntoView = scrollElementIntoView
  that.getText = getText
  that.switchToTab = switchToTab
  that.closeTab = closeTab
  that.getCurrentURL = getCurrentURL
  that.getPageTitle = getPageTitle
  that.assertPageTitle = assertPageTitle
  that.assertPageTitleIncludes = assertPageTitleIncludes
  that.addDynamicElement = addDynamicElement
  that.waitForElementVisibility = visibilityWait
  that.waitForElementInvisibility = invisibilityWait
  that.dragAndDrop = dragAndDrop
  loadPageDefinitionFile(that.pageDefinitionFileName)
  return that
}

module.exports = PageObject
