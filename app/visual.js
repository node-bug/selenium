const resemble = require('resemblejs/compareImages')
const config = require('@nodebug/config')('visual')
const fs = require('fs')
const path = require('path')

function Visual() {
  const { capture } = config
  const { compare } = config

  async function perform(oldSnapPath, newSnap) {
    const baseline = path.resolve(oldSnapPath)
    const file = `${baseline}/image.png`

    if (capture !== false) {
      if (!fs.existsSync(file)) {
        fs.mkdirSync(baseline, { recursive: true })
        fs.writeFileSync(file, newSnap, 'base64')
      }
    }

    if (compare !== false) {
      if (!fs.existsSync(file)) {
        throw new ReferenceError(`Old snapshot not found at path ${baseline}`)
      }
      const contents = fs.readFileSync(file, { encoding: 'base64' })
      const data = await resemble(
        `data:image/png;base64,${contents}`,
        `data:image/png;base64,${newSnap}`,
      )
      const buffer = data.getBuffer()

      // console.log(data.isSameDimensions)
      // console.log(data.misMatchPercentage)
      return buffer
    }
    return false
  }

  return { perform }
}

module.exports = Visual
