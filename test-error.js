const { createLogger, config } = require('winston')
const winstonPlus = require('./dist/index.js').default

// Initialize the logger
const logger = winstonPlus.init(
  createLogger({
    levels: config.syslog.levels,
    level: 'debug',
    transports: winstonPlus.transport({
      showTimestamps: false,
      addLineSeparation: true,
      logLevels: config.syslog.levels,
    }),
  })
)

// Test the .on() method to verify EventEmitter is working
logger.on('error', (error) => {
  console.log('Caught error event:', error)
})

// Function that throws an error
function throwError() {
  throw new Error('This is a test error that was thrown!')
}

// Try to catch and log the error
try {
  throwError()
} catch (error) {
  error.message += '\n'
  // Log the error using the logger
  logger.error('Caught an error:', error)

  // Also test logging with error object directly
  logger.emerg(error)
}

// Test logging a regular message
logger.info('Test script completed')
