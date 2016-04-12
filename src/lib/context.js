import { assert } from 'chai'
import  { ROOT_STATE_KEY, ACTION_PREFIX, IDLESTATUS_ACTIVE } from './constants'
import { getActiveEvents, getUseFastState, getUseLocalState, getUseWebRTCState, getUseWebSocketsState, getThresholds, getLevel } from './defaults'

import configureContext from 'redux-addons/lib/context'
import  { createLogger } from 'redux-addons/lib/log'
const noop = () => {}

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
  assert.ok(thresholds.elapsedMS, 'thresholds.elapsedMS must exist')
  assert(typeof thresholds.elapsedMS === 'number', 'thresholds.elapsedMS must be a number corresponding to minimum milliseconds between updates to redux')
}

const configureInitialState = libContext => appContext => {
  return  { idleStatus: IDLESTATUS_ACTIVE
          , isIdle: false
          , isPaused: false
          , isDetectionRunning: false
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
