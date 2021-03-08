const { log } = require('@nodebug/logger')
const path = require('path')
const fs = require('fs')
const resemble = require('resemblejs/compareImages')
const config = require('@nodebug/config')('visual')
const Gif = require('@nodebug/gifencoder')

class Visual {
  static capture(screenshot, filename) {
    const dir = path.dirname(filename)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    fs.writeFileSync(filename, screenshot, 'base64')
  }

  static async perform(screenshot, filename, size) {
    if (!fs.existsSync(filename)) {
      throw new ReferenceError(`Old snapshot not found at path ${filename}`)
    }
    const contents = fs.readFileSync(filename, { encoding: 'base64' })
    const result = await resemble(
      `data:image/png;base64,${contents}`,
      `data:image/png;base64,${screenshot}`,
    )

    if (result.misMatchPercentage > 0.01) {
      result.expected = contents
      result.actual = screenshot
      const gif = new Gif(size.width, size.height)
      await gif.addBuffer(contents)
      await gif.addBuffer(screenshot)
      result.gif = await gif.save()
      result.status = 'failed'
      log.info(
        `Actual and expected images mismatch by ${result.misMatchPercentage}%`,
      )
    } else {
      log.info('Actual and expected images match.')
      result.status = 'passed'
    }

    return result
  }

  static async compare(browser, os, size, screenshot, file) {
    const filename = `${file}/${os}_${browser}_${size.width}_${size.height}.png`
    if (config.capture !== false) {
      Visual.capture(screenshot, filename)
    }

    if (config.compare !== false) {
      return Visual.perform(screenshot, filename, size)
    }
    log.info('Not comparing as Compare flag is set to false in config file.')
    return { status: 'none', gif: screenshot }
  }
}

module.exports = Visual
