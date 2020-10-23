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

function WebElement(dr) {
  const driver = dr

  function getXPathForElement(obj, action) {
    let attributecollection = ''
    if (obj.exact) {
      attributes.forEach((attribute) => {
        attributecollection += `@${attribute}='${obj.id}' or `
      })
      attributecollection += `normalize-space(.)='${obj.id}' `
      attributecollection += `and not(.//*[normalize-space(.)='${obj.id}'])`
    } else {
      attributes.forEach((attribute) => {
        attributecollection += `contains(@${attribute},'${obj.id}') or `
      })
      attributecollection += `contains(normalize-space(.),'${obj.id}') `
      attributecollection += `and not(.//*[contains(normalize-space(.),'${obj.id}')])`
    }

    let xpath = `//*[${attributecollection}]`
    if (obj.index) {
      xpath = `(${xpath})[${obj.index}]`
    }
    if (action === 'write') {
      // eslint-disable-next-line max-len
      xpath += `/following::*[`
      xpath += `self::input[@type='text' or @type='password'] or `
      xpath += `self::textarea or `
      xpath += `self::*[@contenteditable='true']`
      xpath += `]`
    } else if (action === 'check') {
      xpath += `/preceding-sibling::input[@type='checkbox']`
    } else if (action === 'select') {
      xpath += '/following::select'
    }

    return xpath
  }

  function getXPathForRow(obj) {
    let attributecollection = ''
    if (obj.exact) {
      attributes.forEach((attribute) => {
        attributecollection += `@${attribute}='${obj.id}' or `
      })
      attributecollection += `normalize-space(.)='${obj.id}' `
    } else {
      attributes.forEach((attribute) => {
        attributecollection += `contains(@${attribute},'${obj.id}') or `
      })
      attributecollection += `contains(normalize-space(.),'${obj.id}') `
    }

    let xpath = `//*[${attributecollection}]`
    xpath = `//tbody/tr[(.${xpath})]`
    if (obj.index) {
      xpath = `(${xpath})[${obj.index}]`
    }
    return xpath
  }

  function getXPathForColumn(obj) {
    let attributecollection = ''
    if (obj.exact) {
      attributes.forEach((attribute) => {
        attributecollection += `@${attribute}='${obj.id}' or `
      })
      attributecollection += `normalize-space(.)='${obj.id}' `
    } else {
      attributes.forEach((attribute) => {
        attributecollection += `contains(@${attribute},'${obj.id}') or `
      })
      attributecollection += `contains(normalize-space(.),'${obj.id}') `
    }

    let xpath = `[${attributecollection}]`
    xpath = `//tbody/tr/*[count(//thead//th${xpath}/preceding-sibling::th)+1]`
    return xpath
  }

  function getXPath(obj, action) {
    if (obj.type === 'row') {
      return getXPathForRow(obj)
    }
    if (obj.type === 'column') {
      return getXPathForColumn(obj)
    }
    return getXPathForElement(obj, action)
  }

  async function relativeSearch(item, location, relativeElement) {
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
          case 'within':
            elements = item.matches.filter((element) => {
              return (
                relativeElement.rect.left <= element.rect.left &&
                relativeElement.rect.right >= element.rect.right &&
                relativeElement.rect.top <= element.rect.top &&
                relativeElement.rect.bottom >= element.rect.bottom
              )
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

  async function getRect(element) {
    return driver.executeScript(
      'return arguments[0].getBoundingClientRect();',
      element,
    )
  }

  async function findElementsByXpath(obj, action) {
    const xpath = getXPath(obj, action)
    const elements = await driver.findElements(By.xpath(xpath))
    const promises = elements.map(async (e) => {
      const ce1 = await e.getAttribute('contenteditable')
      const ce2 = await e
        .findElement(By.xpath('./..'))
        .getAttribute('contenteditable')
      return {
        element: e,
        tagName: await e.getTagName(),
        rect: await getRect(e),
        frame: null,
        contenteditable: ce1 || ce2 || null,
      }
    })
    const all = await Promise.all(promises)
    return all.filter((e) => e.rect.height > 0)
  }

  async function findActionElement(obj, action) {
    const all = await findElementsByXpath(obj)
    let matches = all
    if (['write', 'check'].includes(action)) {
      matches = matches.filter(
        (e) => e.tagName === 'input' || e.contenteditable === 'true',
      )
      if (matches.length < 1) {
        matches = await findElementsByXpath(obj, action)
      }
    } else if (['select'].includes(action)) {
      matches = matches.filter((e) => e.tagName === 'select')
      if (matches.length < 1) {
        matches = await findElementsByXpath(obj, action)
      }
    }

    if (matches.length < 1) {
      matches = all
    }
    return matches
  }

  async function resolveElements(stack, action) {
    const promises = stack.map(async (item, index) => {
      const obj = { ...item }
      if (
        ['element', 'row', 'column'].includes(obj.type) &&
        obj.matches.length < 1
      ) {
        if (index === 0) {
          obj.matches = await findActionElement(obj, action)
        } else {
          obj.matches = await findElementsByXpath(obj)
        }
      }
      return obj
    })
    return Promise.all(promises)
  }

  async function findElements(stack, action) {
    await driver.switchTo().defaultContent()
    let data = await resolveElements(stack, action)
    for (let i = 0; i < data.length; i++) {
      /* eslint-disable no-await-in-loop */
      if (
        ['element', 'row', 'column'].includes(data[i].type) &&
        data[i].matches.length < 1
      ) {
        const frames = (await driver.findElements(By.xpath('//iframe'))).length
        for (let frame = 0; frame < frames; frame++) {
          await driver.wait(until.ableToSwitchToFrame(frame))
          data = await resolveElements(data, action)
        }
        if (data[i].matches.length < 1) {
          throw new ReferenceError(
            `'${data[i].id}' has no matching elements on page.`,
          )
        }
      }
      /* eslint-enable no-await-in-loop */
    }
    return data
  }

  async function find(stack, action) {
    const data = await findElements(stack, action)

    let element = null
    for (let i = data.length - 1; i > -1; i--) {
      const item = data[i]
      if (['element', 'row', 'column'].includes(item.type)) {
        // eslint-disable-next-line no-await-in-loop
        element = await relativeSearch(item)
        if (element === null) {
          throw new ReferenceError(
            `'${item.id}' has no matching elements on page.`,
          )
        }
      }
      if (item.type === 'location') {
        i -= 1
        // eslint-disable-next-line no-await-in-loop
        element = await relativeSearch(data[i], item.located, element)
        if (element === null) {
          throw new ReferenceError(
            `'${data[i].id}' ${item.located} '${
              data[i + 2].id
            }' has no matching elements on page.`,
          )
        }
      }
      // await driver.executeScript("arguments[0].setAttribute('style', 'background: blue; border: 2px solid red;');", element.element);
    }
    return element
  }

  return {
    find,
  }
}

module.exports = WebElement
