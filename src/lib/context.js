import { assert } from 'chai'
import  { ROOT_STATE_KEY, ACTION_PREFIX, IDLESTATUS_ACTIVE } from './constants'
import { getActiveEvents, getUseFastState, getUseLocalState, getUseWebRTCState, getUseWebSocketsState, getThresholds, getLevel } from './defaults'
import { translateBlueprintsWith, translateBlueprintTypesWith } from 'redux-blueprint'

const validateContext = (libContext, appContext) => {
  assert.ok(libContext, 'must pass opts to validate')
  assert.ok(appContext, 'must pass opts to validate')

  const { libName, appName } = libContext
  const { activeEvents, thresholds } = appContext

  assert.ok(libName, 'libName must exist')
  assert(typeof libName === 'string', 'libName option must be a string')
  assert(libName.length > 0, 'libName option must not be empty')
  assert.ok(appName, 'appName must exist')
  assert(typeof appName === 'string', 'appName option must be a string')
  assert(appName.length > 0, 'appName option must not be empty')
  assert.ok(activeEvents, 'active events must exist')
  assert.ok(thresholds, 'thresholds must exist')
  assert.ok(thresholds.mouse, 'thresholds.mouse must exist')
  assert(typeof thresholds.mouse === 'number', 'thresholds.mouse must be a number corresponding to pixels')
  assert(typeof thresholds.phaseOffMS === 'number', 'thresholds.phaseOffMS must be a number corresponding to minimum milliseconds between updates to redux')
  assert(typeof thresholds.phaseOnMS === 'number', 'thresholds.phaseOnMS must be a number corresponding to minimum milliseconds between updates to redux')
}

const configureInitialState = libContext => appContext => {
  return  { idleStatus: IDLESTATUS_ACTIVE
          , isRunning: false
          , isDetectionRunning: false
          , isIdle: false
          , lastActive: +new Date()
          , lastEvent: { x: -1, y: -1, type: null }
          }
}

export default function createContext({ appName
                                      , IDLE_STATUSES
                                      , idleStatusDelay
                                      , activeStatusAction
                                      , idleStatusAction
                                      , activeEvents = getActiveEvents()
                                      , useFastStore = getUseFastState()
                                      , useLocalStore = getUseLocalState()
                                      , useWebRTCState = getUseWebRTCState()
                                      , useWebSocketsState = getUseWebSocketsState()
                                      , thresholds = getThresholds()
                                      , level = getLevel()
                                      } = {}) {
  const libName = ROOT_STATE_KEY
  const libOpts = { libName, validateContext, configureAppContext: libContext => appOpts => appOpts, configureInitialState }
  const appOpts = { appName, IDLE_STATUSES, idleStatusDelay, activeStatusAction, idleStatusAction, activeEvents, useFastStore, useLocalStore, useWebRTCState, useWebSocketsState, thresholds, level }
  return configureContext(libOpts)(appOpts)
}

const cleanActionName = name => name.toUpperCase().replace(/-+\s+/, '_')

/** Validates library creators options */
const validateLibOpts = libOptsRaw => {
  assert.ok(libOptsRaw, 'libOpts definition is required')
  const { libName, validateContext, configureAppContext, configureInitialState } = libOptsRaw
  assert(typeof libName === 'string', 'libName must be a string')
  assert(libName.length > 0, 'libName must not be empty')

  assert.ok(validateContext, 'validateContext must exist')
  assert(typeof validateContext === 'function', 'validateContext must be a function')

  assert.ok(configureAppContext, 'configureAppContext must exist')
  assert(typeof configureAppContext === 'function', 'configureAppContext must be a function')

  assert.ok(configureInitialState, 'configureInitialState must exist')
  assert(typeof configureInitialState === 'function', 'configureInitialState must be a function')
}

/** Validates library consumers options */
const validateAppOpts = appOptsRaw => {
  assert.ok(appOptsRaw, 'appOpts are required')
  const { appName } = appOptsRaw

  assert(typeof appName === 'string', 'appName opt must be a string')
  assert(appName.length > 0, 'appName opt must not be empty')
}

function configureContext(libOpts) {
  const isDev = process.env.NODE_ENV !== 'production'
  if(isDev) validateLibOpts(libOpts)
  const { libName, validateContext, configureAppContext, configureInitialState } = libOpts
  return appOpts => {
    if(isDev) validateAppOpts(appOpts)
    const { appName, level } = appOpts

    const translateBlueprintType =  blueprintType => `${cleanActionName(libName)}_${cleanActionName(appName)}_${cleanActionName(blueprintType)}`
    const translateBlueprintTypes = translateBlueprintTypesWith(translateBlueprintType)
    const translateBlueprints = translateBlueprintsWith(translateBlueprintType)

    const libContext =  { log: createLogger({ libName, level })
                        , libName
                        , appName
                        , translateBlueprintTypes
                        , translateBlueprints
                        }

    const appContext = configureAppContext(libContext)(appOpts)
    if(isDev) validateContext(libContext, appContext)

    return Object.assign( appContext, libContext, { get initialState() { return configureInitialState(libContext)(appContext) }
                                                  })
  }
}


const noop = () => {}

function createLogger ({ libName, level }) {
  const _formatMessage = ({ level, message, obj }) => {
    if(!message && typeof obj === 'string') {
      message = obj
      obj = noop()
    }
    return _formatLog(obj ? `${level}: '${message}' => ${JSON.stringify(obj)}`  : `${level}: '${message}'`)
  }

  const _formatLog = message =>`${libName} | ${message}`

  return process.env.NODE_ENV !== 'production' ? (
    { trace: (obj, message) => level === 'trace' ? console.trace(_formatMessage({ level: 'trace', message, obj })): noop()
    , debug: (obj, message) => [ 'trace', 'debug' ].includes(level) ? console.log(_formatMessage({ level: 'debug', message, obj })) : noop()
    , info: (obj, message) => [ 'trace', 'debug', 'info' ].includes(level) ? console.info(_formatMessage({ level: 'info', message, obj })) : noop()
    , warn: (obj, message) => [ 'trace', 'debug', 'info', 'warn' ].includes(level) ? console.warn(_formatMessage({ level: 'warn', message, obj })) : noop()
    , error: (obj, message) => [ 'trace', 'debug', 'info', 'warn', 'error' ].includes(level) ? console.error(_formatMessage({ level: 'error', message, obj })) : noop()
    }
  ) : ({ trace: noop, debug: noop, info: noop, warn: noop, error: noop })
}
