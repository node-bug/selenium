const { log } = require('@nodebug/logger')
const config = require('@nodebug/config')('selenium')

log.debug(JSON.stringify(config))
