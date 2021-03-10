const { log } = require('@nodebug/logger')
const imagemin = require('imagemin')
const pngquant = require('imagemin-pngquant')

async function compressBase64(image) {
  try {
    return (
      await imagemin.buffer(Buffer.from(image, 'base64'), {
        plugins: [
          pngquant({
            quality: [0.1, 0.4],
          }),
        ],
      })
    ).toString('base64')
  } catch (err) {
    log.error(err.stack)
    return image
  }
}

module.exports = {
  compressBase64,
}
