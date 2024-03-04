const { log } = require('@nodebug/logger')
const sharp = require('sharp')

async function compressBase64(image) {
  try {
    const compressed = await sharp(Buffer.from(image, 'base64'))
      .png({ quality: 55, compression: 9 })
      .toBuffer()
    return compressed.toString('base64')
  } catch (err) {
    log.error(err.stack)
    return image
  }
}

module.exports = {
  compressBase64,
}
