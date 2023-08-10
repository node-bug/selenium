const { By } = require('selenium-webdriver')
const Selectors = require('../selectors')

class ElementLocator extends Selectors {
  get driver() {
    return this._driver
  }

  set driver(value) {
    this._driver = value
  }

  async findChildElements(parent, childData) {
    const c = []
    await this.driver.switchTo().defaultContent()
    if (parent.frame >= 0) {
      await this.driver.switchTo().frame(parent.frame)
    }
    const elements = await parent.findElements(By.xpath(this.getSelectors(childData.id, childData.exact)[childData.type]))
    if (elements.length > 0) {
      for (let j = 0; j < elements.length; j++) {
        elements[j].frame = parent.frame
      }
      const matches = await Promise.all(
        elements.map((element) => this.addQualifiers(element)),
      )
      c.push(...matches.filter((e) => e.rect.height > 0 && e.rect.width > 0))
    }

    return c
  }

  async relativeSearch(item, rel, relativeElement) {
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
            const matches = await this.findChildElements(relativeElement, item)
            if (matches.length > 0) {
              // eslint-disable-next-line no-param-reassign
              item.matches = matches
            }
          }
          elements = item.matches.filter((element) => {
            return (
              relativeElement.rect.left <= element.rect.midx &&
              relativeElement.rect.right >= element.rect.midx &&
              relativeElement.rect.top <= element.rect.midy &&
              relativeElement.rect.bottom >= element.rect.midy
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

  async addQualifiers(locator) {
    const element = locator
    element.rect = await this.driver.executeScript(
      'return arguments[0].getBoundingClientRect();',
      element,
    )
    element.rect.midx = element.rect.x + element.rect.width / 2
    element.rect.midy = element.rect.y + element.rect.height / 2
    element.tagName = (await element.getTagName()).toLowerCase()
    return element
  }

  async nearestElement(element, type = null) {
    const elements = await element.findElements(By.xpath(this.selectors[type]))
    if (elements.length === 0) {
      return element
    } else {
      await Promise.all(
        elements.map(async (e) => {
          let ele = await this.addQualifiers(e)
          ele.frame = element.frame
          ele.distance = Math.sqrt(
            (ele.rect.midx - element.rect.midx) ** 2 +
            (ele.rect.y - element.rect.y) ** 2,
          )
          return ele
        }),
      )
      elements.sort(function swap(a, b) {
        return parseFloat(a.distance) - parseFloat(b.distance)
      })
      elements[0].distance = undefined
      return elements[0]
    }
  }

  async findElements(elementData) {
    const c = []
    await this.driver.switchTo().defaultContent()
    const frames = await this.driver.findElements(
      By.xpath('//iframe'),
    )

    /* eslint-disable no-await-in-loop */
    for (let i = -1; i < frames.length; i++) {
      await this.driver.switchTo().defaultContent()
      if (i > -1) {
        try {
          await this.driver.switchTo().frame(i)
        } catch (err) {
          if (err.name !== 'NoSuchFrameError') {
            throw err
          }
        }
      }
      const elements = await this.driver.findElements(By.xpath(this.getSelectors(elementData.id, elementData.exact)[elementData.type]))
      if (elements.length > 0) {
        for (let j = 0; j < elements.length; j++) {
          elements[j].frame = i
        }
        await Promise.all(
          elements.map(async (element) => this.addQualifiers(element)),
        )
        if (elementData.hidden) {
          c.push(...elements.filter((e) => e.rect.height < 1 || e.rect.width < 1))
        } else {
          c.push(...elements.filter((e) => e.rect.height > 0 && e.rect.width > 0))
        }

      }
    }
    /* eslint-enable no-await-in-loop */

    if (!(c.length > 0) && elementData.type !== 'element') {
      await this.driver.switchTo().defaultContent()
      const frames = await this.driver.findElements(
        By.xpath('//iframe'),
      )

      /* eslint-disable no-await-in-loop */
      for (let i = -1; i < frames.length; i++) {
        await this.driver.switchTo().defaultContent()
        if (i > -1) {
          try {
            await this.driver.switchTo().frame(i)
          } catch (err) {
            if (err.name !== 'NoSuchFrameError') {
              throw err
            }
          }
        }

        const elements = await this.driver.findElements(By.xpath(this.getSelectors(elementData.id, elementData.exact)['element']))
        if (elements.length > 0) {
          for (let j = 0; j < elements.length; j++) {
            elements[j].frame = i
          }
          await Promise.all(
            elements.map(async (element) => this.addQualifiers(element)),
          )
          const matches = await Promise.all(
            elements.map(async (element) => this.nearestElement(element, elementData.type)),
          )
          if (elementData.hidden) {
            c.push(...matches.filter((e) => e.rect.height < 1 || e.rect.width < 1))
          } else {
            c.push(...matches.filter((e) => e.rect.height > 0 && e.rect.width > 0))
          }
        }
      }
      /* eslint-enable no-await-in-loop */
    }

    return c
  }

  async resolveElements(stack) {
    const items = []

    /* eslint-disable no-await-in-loop */
    // eslint-disable-next-line no-restricted-syntax
    for (let i = 0; i < stack.length; i++) {
      const item = { ...stack[i] }
      if (
        [
          'element',
          'button',
          'radio',
          'textbox',
          'checkbox',
          'image',
          // 'row',
          // 'column',
          'toolbar',
          'tab',
          'link',
          'dialog',
          'file',
        ].includes(item.type) &&
        item.matches.length < 1
      ) {
        item.matches = await this.findElements(item)
      }
      items.push(item)
    }
    /* eslint-enable no-await-in-loop */
    return items
  }

  async find(stack, action = null) {
    const data = await this.resolveElements(stack)

    let element = null
    /* eslint-disable no-await-in-loop */
    for (let i = data.length - 1; i > -1; i--) {
      const item = data[i]
      if (
        [
          'element',
          'button',
          'radio',
          'textbox',
          'checkbox',
          'image',
          // 'row',
          // 'column',
          'toolbar',
          'tab',
          'link',
          'dialog',
          'file',
        ].includes(item.type)
      ) {
        const elements = await this.relativeSearch(item)
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
        const elements = await this.relativeSearch(data[i], item, element)
        if (data[i].index !== false) {
          element = elements[data[i].index - 1]
        } else {
          ;[element] = elements
        }
        if ([undefined, null, ''].includes(element)) {
          throw new ReferenceError(
            `'${data[i].id}' ${item.located} '${data[i + 2].id
            }' has no matching elements on page.`,
          )
        }
      }
    }
    /* eslint-enable no-await-in-loop */
    // await this.driver.executeScript("arguments[0].setAttribute('style', 'background: blue; border: 2px solid red;');", element);

    await this.driver.switchTo().defaultContent()
    if (element.frame >= 0) {
      await this.driver.switchTo().frame(element.frame)
    }
    return element
  }

  async findAll(stack) {
    const data = await this.resolveElements(stack)

    let element = null
    let elements = []
    /* eslint-disable no-await-in-loop */
    for (let i = data.length - 1; i > -1; i--) {
      const item = data[i]
      if (
        [
          'element',
          'button',
          'radio',
          'textbox',
          'checkbox',
          'image',
          // 'row',
          // 'column',
          'toolbar',
          'tab',
          'link',
          'dialog',
          'file',
        ].includes(item.type)
      ) {
        elements = await this.relativeSearch(item)
        if (elements.length < 1) {
          throw new ReferenceError(
            `'${item.id}' has no matching elements on page.`,
          )
        }
      } else if (item.type === 'location') {
        i -= 1
        elements = await this.relativeSearch(data[i], item, element)
        if (elements.length < 1) {
          throw new ReferenceError(
            `'${data[i].id}' ${item.located} '${data[i + 2].id
            }' has no matching elements on page.`,
          )
        }
      }
      // await this.driver.executeScript("arguments[0].setAttribute('style', 'background: blue; border: 2px solid red;');", element);
    }
    /* eslint-enable no-await-in-loop */
    return elements
  }
}

module.exports = ElementLocator
