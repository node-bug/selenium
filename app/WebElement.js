const { log } = require('@nodebug/logger')
const { By, until } = require('selenium-webdriver')

const that = {}

function WebElement(driver, element) {
  const my = {}
  my.driver = driver
  my.name = element.name
  my.byType = element.byType.toLowerCase()
  my.definition = element ? element.definition : null

  function getBy() {
    let byReturn = null
    const type = my.byType.toLowerCase().trim()
    log.debug(`Getting element ${my.name} By: ${type} for ${my.definition}`)
    switch (type) {
      case 'xpath':
        byReturn = By.xpath(my.definition)
        break
      case 'css':
        byReturn = By.css(my.definition)
        break
      case 'id':
        byReturn = By.id(my.definition)
        break
      case 'name':
        byReturn = By.name(my.definition)
        break
      case 'linktext':
        byReturn = By.linkText(my.definition)
        break
      case 'classname':
        byReturn = By.className(my.definition)
        break
      case 'partiallinktext':
        byReturn = By.partialLinkText(my.definition)
        break
      case 'tagname':
        byReturn = By.tagName(my.definition)
        break
      default:
        /* eslint-disable max-len */
        log.error(
          `The data asked to identify the element ${my.name}  by the type ${type} and that type is not valid.  Please review the data and try again.`,
        )
        log.error(
          'Valid types are [xpath, cssSelector, id, name, linkText, partialLinkText, className, tagName]',
        )
      /* eslint-enable max-len */
    }
    return byReturn
  }

  if (my.definition !== null) {
    my.definition = getBy()
  } else {
    log.error(`Please fix. Definition is null for element ${my.name}`)
  }

  that.getWebElement = async () => my.driver.findElement(my.definition)

  that.getWebElements = async () => my.driver.findElements(my.definition)

  that.elementDisplayed = async () =>
    my.driver.findElement(my.definition).isDisplayed()

  that.focus = async () =>
    my.driver.executeScript('arguments[0].focus();', await that.getWebElement())

  that.scrollIntoView = async () =>
    my.driver.executeScript(
      'arguments[0].scrollIntoView(); window.scrollBy(0, -window.innerHeight / 4);',
      await that.getWebElement(),
    )

  that.elementDisabled = async () =>
    my.driver.wait(until.elementIsDisabled(await that.getWebElement()), 3000)

  that.hide = async () =>
    that
      .getWebElements()
      .then((elements) =>
        elements.forEach((e) =>
          my.driver.executeScript('return arguments[0].style.opacity=0', e),
        ),
      )

  that.unhide = async () =>
    that
      .getWebElements()
      .then((elements) =>
        elements.forEach((e) =>
          my.driver.executeScript('return arguments[0].style.opacity=1', e),
        ),
      )

  that.waitForVisibility = async (timeoutInSeconds) => {
    const { implicit } = await my.driver.manage().getTimeouts()
    await my.driver.manage().setTimeouts({ implicit: 5000 })
    let visibility = false
    const timer = Date.now()
    while ((Date.now() - timer) / 1000 < timeoutInSeconds) {
      // eslint-disable-next-line no-await-in-loop
      const elements = await that.getWebElements()
      if (elements.length > 0) {
        visibility = true
        break
      }
    }
    await my.driver.manage().setTimeouts({ implicit })
    return visibility
  }

  that.waitForInvisibility = async (timeoutInSeconds) => {
    const { implicit } = await my.driver.manage().getTimeouts()
    await my.driver.manage().setTimeouts({ implicit: 5000 })
    let invisibility = false
    const timer = Date.now()
    while ((Date.now() - timer) / 1000 < timeoutInSeconds) {
      // eslint-disable-next-line no-await-in-loop
      const elements = await that.getWebElements()
      if (elements.length < 1) {
        invisibility = true
        break
      }
    }
    await my.driver.manage().setTimeouts({ implicit })
    return invisibility
  }

  return that
}

module.exports = WebElement
