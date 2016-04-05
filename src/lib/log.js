import { LIB_NAME } from './constants'

const _formatMessage = ({ level, message, obj }) => {
  if(!message && typeof obj === 'string') {
    message = obj
    obj = noop()
  }
  return _formatLog(obj ? `${level}: '${message}' => ${JSON.stringify(obj)}`  : `${level}: '${message}'`)
}

const _formatLog = message =>`${LIB_NAME} | ${message}`
const noop = () => {}

export const createLogger = ({ level = 'info' } = {}) => process.env.NODE_ENV !== 'production' ? (
  { trace: (obj, message) => level === 'trace' ? console.trace(_formatMessage({ level: 'trace', message, obj })): noop()
  , debug: (obj, message) => ['trace','debug'].includes(level) ? console.log(_formatMessage({ level: 'debug', message, obj })) : noop()
  , info: (obj, message) => ['trace','debug','info'].includes(level) ? console.info(_formatMessage({ level: 'info', message, obj })) : noop()
  , warn: (obj, message) => ['trace','debug','info','warn'].includes(level) ? console.warn(_formatMessage({ level: 'warn', message, obj })) : noop()
  , error: (obj, message) => ['trace','debug','info','warn','error'].includes(level) ? console.error(_formatMessage({ level: 'error', message, obj })) : noop()
  }
) : ({ trace: noop, debug: noop, info: noop, warn: noop, error: noop })
