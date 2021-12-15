const { By } = require('selenium-webdriver')

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
  'role',
]

function WebElement(webdriver) {
  const driver = webdriver

  function transform(text) {
    let txt
    if (text.includes("'")) {
      txt = `concat('${text.replace(`'`, `',"'",'`)}')`
    } else {
      txt = `'${text}'`
    }
    return txt
  }

  function getSelector(obj) {
    let selector = ''
    if (obj.exact) {
      attributes.forEach((attribute) => {
        selector += `@${attribute}=${transform(obj.id)} or `
      })
      selector += `normalize-space(.)=${transform(obj.id)} `
      selector += `and not(.//*[normalize-space(.)=${transform(obj.id)}])`
    } else {
      attributes.forEach((attribute) => {
        selector += `contains(@${attribute},${transform(obj.id)}) or `
      })
      selector += `contains(normalize-space(.),${transform(obj.id)}) `
      selector += `and not(.//*[contains(normalize-space(.),${transform(
        obj.id,
      )})])`
    }

    selector = `//*[${selector}]`
    return By.xpath(selector)
  }

  function getSelectorForRow(obj) {
    let selector = ''
    let t = ''
    if (obj.exact) {
      attributes.forEach((attribute) => {
        selector += `@${attribute}=${transform(obj.id)} or `
      })
      selector += `normalize-space(.)=${transform(obj.id)} `
    } else {
      attributes.forEach((attribute) => {
        selector += `contains(@${attribute},${transform(obj.id)}) or `
      })
      selector += `contains(normalize-space(.),${transform(obj.id)}) `
    }

    selector = `//*[${selector}]`
    if (obj.table !== undefined) {
      attributes.forEach((attribute) => {
        t += `contains(@${attribute},${transform(obj.table)}) or `
      })
      t += `contains(normalize-space(.),${transform(obj.table)}) `
      selector = `//table[${t}]/tbody/tr[(.${selector})]` // additional for row
    } else {
      selector = `//tbody/tr[(.${selector})]` // additional for row
    }
    return By.xpath(selector)
  }

  function getSelectorForColumn(obj) {
    let selector = ''
    let t = ''
    if (obj.exact) {
      attributes.forEach((attribute) => {
        selector += `@${attribute}=${transform(obj.id)} or `
      })
      selector += `normalize-space(.)=${transform(obj.id)} `
    } else {
      attributes.forEach((attribute) => {
        selector += `contains(@${attribute},${transform(obj.id)}) or `
      })
      selector += `contains(normalize-space(.),${transform(obj.id)}) `
    }

    selector = `[${selector}]` // additional for column
    if (obj.table !== undefined) {
      attributes.forEach((attribute) => {
        t += `contains(@${attribute},${transform(obj.table)}) or `
      })
      t += `contains(normalize-space(.),${transform(obj.table)}) `
      selector = `//table[${t}]/tbody/tr/*[count(//table[${t}]/thead//th${selector}/preceding-sibling::th)+1]`
      // additional for column
    } else {
      selector = `//tbody/tr/*[count(//thead//th${selector}/preceding-sibling::th)+1]`
      // additional for column
    }
    return By.xpath(selector)
  }

  function toSelector(obj) {
    if (obj.type === 'row') {
      return getSelectorForRow(obj)
    }
    if (obj.type === 'column') {
      return getSelectorForColumn(obj)
    }
    return getSelector(obj)
  }

  async function addQualifiers(locator) {
    const element = locator
    element.rect = await driver.executeScript(
      'return arguments[0].getBoundingClientRect();',
      element,
    )
    element.rect.midx = element.rect.x + element.rect.width / 2
    element.rect.midy = element.rect.y + element.rect.height / 2
    element.tagName = await element.getTagName()
    return element
  }

  async function findChildElements(parent, childData) {
    const c = []
    await driver.switchTo().defaultContent()
    if (parent.frame >= 0) {
      await driver.switchTo().frame(parent.frame)
    }

    const selector = toSelector(childData)
    selector.value = `.${selector.value}`
    const elements = await parent.findElements(selector)
    if (elements.length > 0) {
      for (let j = 0; j < elements.length; j++) {
        elements[j].frame = parent.frame
      }
      const matches = await Promise.all(
        elements.map((element) => addQualifiers(element)),
      )
      c.push(...matches.filter((e) => e.rect.height > 0 && e.rect.width > 0))
    }

    return c
  }

  async function findElements(elementData) {
    const c = []
    await driver.switchTo().defaultContent()
    const frames = await driver.findElements(
      By.xpath('//iframe[not(contains(@style,"display: none;"))]'),
    )

    /* eslint-disable no-await-in-loop */
    for (let i = -1; i < frames.length; i++) {
      if (i > -1) {
        try {
          await driver.switchTo().frame(i)
        } catch (ex) {
          if (ex.name !== 'NoSuchFrameError') {
            throw ex
          }
        }
      }
      const elements = await driver.findElements(toSelector(elementData))
      if (elements.length > 0) {
        for (let j = 0; j < elements.length; j++) {
          elements[j].frame = i
        }
        const matches = await Promise.all(
          elements.map((element) => addQualifiers(element)),
        )
        c.push(...matches.filter((e) => e.rect.height > 0 && e.rect.width > 0))
      }
    }
    /* eslint-enable no-await-in-loop */

    return c
  }

  async function relativeSearch(item, rel, relativeElement) {
    if ([undefined, null, ''].includes(rel)) {
      return item.matches
    }
    if ([undefined, null, ''].includes(rel.located)) {
      return item.matches
    }

    let elements
    if (![undefined, null, ''].includes(relativeElement)) {
      switch (rel.located) {
        case 'above':
          if (rel.exactly === true) {
            elements = item.matches.filter((element) => {
              return (
                relativeElement.rect.top >= element.rect.bottom &&
                relativeElement.rect.left - 5 <= element.rect.left &&
                relativeElement.rect.right + 5 >= element.rect.right
              )
            })
          } else {
            elements = item.matches.filter((element) => {
              return relativeElement.rect.top >= element.rect.bottom
            })
          }
          break
        case 'below':
          if (rel.exactly === true) {
            elements = item.matches.filter((element) => {
              return (
                relativeElement.rect.bottom <= element.rect.top &&
                relativeElement.rect.left - 5 <= element.rect.left &&
                relativeElement.rect.right + 5 >= element.rect.right
              )
            })
          } else {
            elements = item.matches.filter((element) => {
              return relativeElement.rect.bottom <= element.rect.top
            })
          }
          break
        case 'toLeftOf':
          if (rel.exactly === true) {
            elements = item.matches.filter((element) => {
              return (
                relativeElement.rect.left >= element.rect.right &&
                relativeElement.rect.top - 5 <= element.rect.top &&
                relativeElement.rect.bottom + 5 >= element.rect.bottom
              )
            })
          } else {
            elements = item.matches.filter((element) => {
              return relativeElement.rect.left >= element.rect.right
            })
          }
          break
        case 'toRightOf':
          if (rel.exactly === true) {
            elements = item.matches.filter((element) => {
              return (
                relativeElement.rect.right <= element.rect.left &&
                relativeElement.rect.top - 5 <= element.rect.top &&
                relativeElement.rect.bottom + 5 >= element.rect.bottom
              )
            })
          } else {
            elements = item.matches.filter((element) => {
              return relativeElement.rect.right <= element.rect.left
            })
          }
          break
        case 'within':
          if (item.type === 'element') {
            const matches = await findChildElements(relativeElement, item)
            if (matches.length > 0) {
              // eslint-disable-next-line no-param-reassign
              item.matches = matches
            }
          }
          elements = item.matches.filter((element) => {
            return (
              relativeElement.rect.left <= element.rect.left + 5 &&
              relativeElement.rect.right + 5 >= element.rect.right &&
              relativeElement.rect.top <= element.rect.top + 5 &&
              relativeElement.rect.bottom + 5 >= element.rect.bottom
            )
          })
          break
        default:
          throw new ReferenceError(`Location '${rel.located}' is not supported`)
      }
    } else {
      throw new ReferenceError(
        `Location '${rel.located}' cannot be found as relative element is '${relativeElement}'`,
      )
    }

    return elements
  }

  async function nearestWriteElement(locator) {
    if (locator.tagName === 'input') {
      const inputType = await locator.getAttribute('type')
      if (!['radio', 'checkbox', 'submit', 'file'].includes(inputType)) {
        return locator
      }
    }
    if (locator.tagName === 'textarea') {
      return locator
    }
    const inputs = await driver.findElements(
      By.xpath(
        `//input[not(@type='radio') and not(@type='checkbox') and not(@type='submit') and not(@type='file')]`,
      ),
    )
    const textareas = await driver.findElements(By.xpath(`//textarea`))
    const contentEditables = await driver.findElements(
      By.xpath(`//*[@contenteditable]`),
    )
    const rest = await driver.findElements(
      By.xpath(
        `//*[contains(@class, 'ace_text') or contains(@class,'input') or contains(@class,'editable')]`,
      ),
    )
    const elements = [...inputs, ...textareas, ...contentEditables, ...rest]

    await Promise.all(
      elements.map(async (ele) => {
        let e = ele
        e = await addQualifiers(e)
        e.frame = locator.frame
        e.distance = Math.sqrt(
          (e.rect.midx - locator.rect.midx) ** 2 +
            (e.rect.y - locator.rect.y) ** 2,
        )
        return e
      }),
    )

    elements.sort(function swap(a, b) {
      return parseFloat(a.distance) - parseFloat(b.distance)
    })
    return elements[0]
  }

  async function resolveElements(stack) {
    const items = []

    /* eslint-disable no-await-in-loop */
    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < stack.length; i++) {
      const item = { ...stack[i] }
      if (
        [
          'element',
          'radio',
          'checkbox',
          'button',
          'textbox',
          'row',
          'column',
        ].includes(item.type) &&
        item.matches.length < 1
      ) {
        item.matches = await findElements(item)
      }
      items.push(item)
    }
    /* eslint-enable no-await-in-loop */
    return items
  }

  async function nearestElement(locator, type) {
    let elements = []
    const tagName = await locator.getTagName()
    if (type === 'button') {
      if (tagName === 'button') {
        return locator
      }
      if (tagName === 'input') {
        const inputType = await locator.getAttribute('type')
        if (inputType === 'submit' || inputType === 'button') {
          return locator
        }
      }
      const buttons = await driver.findElements(By.xpath(`//button`))
      const inputs = await driver.findElements(
        By.xpath(`//input[@type='submit' or @type='button']`),
      )
      const rest = await driver.findElements(
        By.xpath(
          `//*[contains(@class,'button') or contains(@data-test-id,'button')]`,
        ),
      )
      elements = [...buttons, ...inputs, ...rest]
    }
    if (type === 'textbox') {
      if (tagName === 'input') {
        const inputType = await locator.getAttribute('type')
        if (!['radio', 'checkbox', 'submit', 'file'].includes(inputType)) {
          return locator
        }
      }
      if (tagName === 'textarea') {
        return locator
      }
      const inputs = await driver.findElements(
        By.xpath(
          `//input[not(@type='radio') and not(@type='checkbox') and not(@type='submit') and not(@type='file')]`,
        ),
      )
      const textareas = await driver.findElements(By.xpath(`//textarea`))
      elements = [...inputs, ...textareas]
    } else if (type === 'radio') {
      if (tagName === 'input') {
        const inputType = await locator.getAttribute('type')
        if (inputType === 'radio') {
          return locator
        }
      }
      elements = await driver.findElements(By.xpath(`//input[@type='radio']`))
    } else if (type === 'checkbox') {
      if (tagName === 'input') {
        const inputType = await locator.getAttribute('type')
        if (inputType === 'checkbox') {
          return locator
        }
      }
      elements = await driver.findElements(
        By.xpath(`//input[@type='checkbox']`),
      )
    } else if (type === 'select') {
      if (tagName === 'select') {
        return locator
      }
      elements = await driver.findElements(By.xpath(`//select`))
    }

    await Promise.all(
      elements.map(async (ele) => {
        let e = ele
        e = await addQualifiers(e)
        e.frame = locator.frame
        e.distance = Math.sqrt(
          (e.rect.midx - locator.rect.midx) ** 2 +
            (e.rect.midy - locator.rect.midy) ** 2,
        )
        return e
      }),
    )

    elements.sort(function swap(a, b) {
      return parseFloat(a.distance) - parseFloat(b.distance)
    })
    return elements[0]
  }

  async function find(stack, action = null) {
    const data = await resolveElements(stack)

    let element = null
    /* eslint-disable no-await-in-loop */
    for (let i = data.length - 1; i > -1; i--) {
      const item = data[i]
      if (
        [
          'element',
          'radio',
          'checkbox',
          'button',
          'textbox',
          'row',
          'column',
        ].includes(item.type)
      ) {
        const elements = await relativeSearch(item)
        if (item.index !== false) {
          element = elements[item.index - 1]
        } else {
          ;[element] = elements
        }
        if ([undefined, null, ''].includes(element)) {
          throw new ReferenceError(
            `'${item.id}' has no matching elements on page.`,
          )
        }
      } else if (item.type === 'location') {
        i -= 1
        const elements = await relativeSearch(data[i], item, element)
        if (data[i].index !== false) {
          element = elements[data[i].index - 1]
        } else {
          ;[element] = elements
        }
        if ([undefined, null, ''].includes(element)) {
          throw new ReferenceError(
            `'${data[i].id}' ${item.located} '${
              data[i + 2].id
            }' has no matching elements on page.`,
          )
        }
      }
    }
    /* eslint-enable no-await-in-loop */
    // await driver.executeScript("arguments[0].setAttribute('style', 'background: blue; border: 2px solid red;');", element);

    await driver.switchTo().defaultContent()
    if (element.frame >= 0) {
      await driver.switchTo().frame(element.frame)
    }
    if (['radio', 'textbox', 'checkbox', 'button'].includes(stack[0].type)) {
      element = await nearestElement(element, stack[0].type)
    } else if (action === 'select') {
      element = await nearestElement(element, action)
    } else if (action === 'check') {
      element = await nearestElement(element, 'checkbox')
    } else if (['write'].includes(action)) {
      element = await nearestWriteElement(element)
    }
    return element
  }

  async function findAll(stack) {
    const data = await resolveElements(stack)

    let element = null
    let elements = []
    /* eslint-disable no-await-in-loop */
    for (let i = data.length - 1; i > -1; i--) {
      const item = data[i]
      if (
        [
          'element',
          'radio',
          'textbox',
          'checkbox',
          'button',
          'row',
          'column',
        ].includes(item.type)
      ) {
        elements = await relativeSearch(item)
        if (elements.length < 1) {
          throw new ReferenceError(
            `'${item.id}' has no matching elements on page.`,
          )
        }
      } else if (item.type === 'location') {
        i -= 1
        elements = await relativeSearch(data[i], item, element)
        if (elements.length < 1) {
          throw new ReferenceError(
            `'${data[i].id}' ${item.located} '${
              data[i + 2].id
            }' has no matching elements on page.`,
          )
        }
      }
      if (i !== 0) {
        ;[element] = elements
      }
      // await driver.executeScript("arguments[0].setAttribute('style', 'background: blue; border: 2px solid red;');", element);
    }
    /* eslint-enable no-await-in-loop */
    return elements
  }

  return {
    find,
    findAll,
  }
}

module.exports = WebElement
