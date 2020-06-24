const { log } = require('@nodebug/logger')
const config = require('@nodebug/config')('boilerplatejs')

log.debug(JSON.stringify(config))
