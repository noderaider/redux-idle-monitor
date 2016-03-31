import { LIB_NAME } from './constants'

const _formatMessage = ({ message, obj }) => obj ? `message: '${message}', obj: ${obj.toJSON()}`  : `message: '${message}'`
const _formatWarn = ({ message, err }) => err ? `warn: '${message}', inner: ${err.toString()}`  : `error: '${message.toString()}'`
const _formatError = ({ message, err }) => err ? `error: '${message}', inner: ${err.toString()}`  : `error: '${message.toString()}'`
const _formatLog = ({ message, obj, err }) =>`${LIB_NAME} | ${err ? _formatError({ message, err }) : _formatMessage({ message, obj })}`
const noop = () => {}

export const createLogger = () => process.env.NODE_ENV !== 'production' ? (
  { trace: (message, obj) => console.trace(_formatLog(message, obj))
  , debug: (message, obj) => console.log(_formatLog(message, obj))
  , info: (message, obj) => console.info(_formatLog(message, obj))
  , warn: (message, err) => console.warn(_formatLog(message, err))
  , error: (message, err) => console.error(_formatLog(message, err))
  }
) : ({ trace: noop, debug: noop, info: noop, warn: noop, error: noop })
