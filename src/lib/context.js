import { assert } from 'chai'
import  { ROOT_STATE_KEY, ACTION_PREFIX, IDLESTATUS_ACTIVE } from './constants'
import { getActiveEvents, getUseFastState, getUseLocalState, getUseWebRTCState, getUseWebSocketsState, getThresholds, getLevel } from './defaults'

import configureContext from 'redux-addons/lib/context'
import  { createLogger } from 'redux-addons/lib/log'
const noop = () => {}

const validateContext = (libContext, appContext) => {
  assert.ok(libContext, 'must pass opts to validate')
  assert.ok(appContext, 'must pass opts to validate')

  const { libName, appName, libActions } = libContext
  const { activeEvents, useFastStore, useLocalStore, thresholds } = appContext

  assert.ok(libName, 'libName must exist')
  assert(typeof libName === 'string', 'libName opt must be a string')
  assert(libName.length > 0, 'libName opt must not be empty')
  assert.ok(appName, 'appName must exist')
  assert(typeof appName === 'string', 'appName opt must be a string')
  assert(appName.length > 0, 'appName opt must not be empty')
  assert.ok(activeEvents, 'active events must exist')
}

const configureInitialState = libContext => appContext => {
  return  { idleStatus: IDLESTATUS_ACTIVE
          , isIdle: false
          , isPaused: false
          , isDetectionRunning: false
          , lastActive: +new Date()
          , lastEvent: { x: -1, y: -1 }
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
  const libName = 'idlemonitor'
  const libOpts = { libName, validateContext, configureAppContext: libContext => appOpts => appOpts, configureInitialState }
  const appOpts = { appName, IDLE_STATUSES, idleStatusDelay, activeStatusAction, idleStatusAction, activeEvents, useFastStore, useLocalStore, useWebRTCState, useWebSocketsState, thresholds, level }
  return configureContext(libOpts)(appOpts)
}
