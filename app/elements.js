const { By, until } = require('selenium-webdriver')

const attributes = [
  'placeholder',
  'value',
  'data-test-id',
  'id',
  'resource-id',
  'name',
  'aria-label',
  'class',
  'hint',
  'title',
  'tooltip',
  'alt',
  'src',
]

function getXPath(obj, action) {
  let xpath = '//*['
  if (obj.match !== 'exact') {
    attributes.forEach((attribute) => {
      xpath += `contains(@${attribute},'${obj.element}') or `
    })
    xpath += ` contains(normalize-space(text()),'${obj.element}')]`
  } else {
    attributes.forEach((attribute) => {
      xpath += `@${attribute}='${obj.element}' or `
    })
    xpath += ` normalize-space(.)='${obj.element}']`
  }

  if (action === 'write') {
    xpath += `/following::*[self::input or self::textarea]`
  } else if (action === 'select') {
    xpath += '/following::select'
  } else if (action === 'check') {
    xpath += '/preceding-sibling::input'
  }
  return xpath
}

async function search(item, location, relativeElement) {
  let elements
  if (![undefined, null, ''].includes(location)) {
    if (![undefined, null, ''].includes(relativeElement)) {
      switch (location) {
        case 'above':
          elements = item.matches.filter((element) => {
            return relativeElement.rect.top >= element.rect.bottom
          })
          break
        case 'below':
          elements = item.matches.filter((element) => {
            return relativeElement.rect.bottom <= element.rect.top
          })
          break
        case 'toLeftOf':
          elements = item.matches.filter((element) => {
            return relativeElement.rect.left >= element.rect.right
          })
          break
        case 'toRightOf':
          elements = item.matches.filter((element) => {
            return relativeElement.rect.right <= element.rect.left
          })
          break
        default:
          throw new ReferenceError(`Location '${location}' is not supported`)
      }
    } else {
      throw new ReferenceError(
        `Location '${location}' cannot be found as relative element is '${relativeElement}'`,
      )
    }
  } else {
    elements = item.matches
  }
  return elements[0]
}

exports.WebElement = class {
  constructor(driver) {
    this.driver = driver
  }

  async getRect(element) {
    return this.driver.executeScript(
      'return arguments[0].getBoundingClientRect();',
      element,
    )
  }

  async findElementsByXpath(obj, action) {
    const xpath = getXPath(obj, action)
    const elements = await this.driver.findElements(By.xpath(xpath))
    const promises = elements.map(async (e) => {
      return {
        element: e,
        tagName: await e.getTagName(),
        rect: await this.getRect(e),
        frame: null,
      }
    })
    const all = await Promise.all(promises)
    return all.filter((e) => e.rect.height > 0)
  }

  async resolveElements(stack) {
    const promises = stack.map(async (item) => {
      const obj = { ...item }
      if (Object.prototype.hasOwnProperty.call(obj, 'element')) {
        obj.matches = await this.findElementsByXpath(obj)
      }
      return obj
    })
    return Promise.all(promises)
  }

  async find(stack, action) {
    await this.driver.switchTo().defaultContent()
    const data = await this.resolveElements(stack)
    for (let i = 0; i < data.length; i++) {
      /* eslint-disable no-await-in-loop */
      if (
        Object.prototype.hasOwnProperty.call(data[i], 'matches') &&
        data[i].matches.length < 1
      ) {
        const frames = (await this.driver.findElements(By.xpath('//iframe')))
          .length
        for (let frame = 0; frame < frames; frame++) {
          await this.driver.wait(until.ableToSwitchToFrame(frame))
          data[i].matches = await this.findElementsByXpath(data[i], action)
          if (data[i].matches.length > 0) {
            data[i].matches = data[i].matches.map((obj) => ({
              ...obj,
              frame,
            }))
            break
          }
        }
        if (data[i].matches.length < 1) {
          throw new ReferenceError(
            `'${data[i].element}' has no matching elements on page.`,
          )
        }
      }
      /* eslint-enable no-await-in-loop */
    }

    if (['select', 'write', 'check'].includes(action)) {
      let matches = data[0].matches.filter((e) => {
        if (action === 'select' && ['select'].includes(e.tagName)) {
          return true
        }
        if (action === 'write' && ['input', 'textarea'].includes(e.tagName)) {
          return true
        }
        if (action === 'check' && ['input'].includes(e.tagName)) {
          return true
        }
        return false
      })
      if (matches.length < 1) {
        matches = await this.findElementsByXpath(data[0], action)
      }
      if (matches.length !== 0) {
        data[0].matches = matches
      }
    }

    let element = null
    for (let i = data.length - 1; i > -1; i--) {
      const item = data[i]
      if (Object.prototype.hasOwnProperty.call(item, 'element')) {
        // eslint-disable-next-line no-await-in-loop
        element = await search(item)
        if (element === null) {
          throw new ReferenceError(
            `'${item.element}' has no matching elements on page.`,
          )
        }
      } else if (Object.prototype.hasOwnProperty.call(item, 'location')) {
        i -= 1
        // eslint-disable-next-line no-await-in-loop
        element = await search(data[i], item.location, element)
        if (element === null) {
          throw new ReferenceError(
            `'${data[i].element}' ${item.location} '${
              data[i + 2].element
            }' has no matching elements on page.`,
          )
        }
      }
      // await this.driver.executeScript("arguments[0].setAttribute('style', 'background: yellow; border: 2px solid red;');", element.element);
    }
    return element
  }
}