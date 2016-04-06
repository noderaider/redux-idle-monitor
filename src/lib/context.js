import { assert } from 'chai'
import  { ROOT_STATE_KEY, ACTION_PREFIX } from './constants'
import { getActions, getActiveEvents, getUseFastState, getUseLocalState, getUseWebRTCState, getUseWebSocketsState, getThresholds, getLevel } from './defaults'

import { configureActivityEvent, configureStart, configureStop, configureReset, createActionDispatchers, activityAction, activityDetectionAction } from './actions'

import configureContext from 'redux-addons/lib/context'
import  { createLogger } from './log'

const noop = () => {}
const sanitizeActions = actions => actions.map(x => [createActionName(x[0]), x[1]])
const createActionName = rawName => `${ACTION_PREFIX}_${rawName.toUpperCase().replace(/-+\s+/, '_')}`


const validateContext = (libContext, appContext) => {
  assert.ok(libContext, 'must pass opts to validate')
  assert.ok(appContext, 'must pass opts to validate')

  const { libName, appName, libActions, appActions } = libContext
  const { activeEvents, useFastStore, useLocalStore, thresholds } = appContext

  assert.ok(libName, 'libName must exist')
  assert(typeof libName === 'string', 'libName opt must be a string')
  assert(libName.length > 0, 'libName opt must not be empty')
  assert.ok(appName, 'appName must exist')
  assert(typeof appName === 'string', 'appName opt must be a string')
  assert(appName.length > 0, 'appName opt must not be empty')


  assert.ok(appActions, 'actions must exist')
  assert(Array.isArray(appActions), 'actions must be an array')
  assert(appActions.every(x => Array.isArray(x)), 'actions must be an array of an array')
  assert(appActions.every(x => x.length === 2), 'every actions must have length 2')
  assert(appActions.every(x => typeof x[0] === 'string'), 'every action must have first ordinal type string event name')
  assert(appActions.every(x => typeof x[1] === 'object'), 'every action must have second ordinal type object')
  assert(appActions.every(x => typeof x[1].action !== 'undefined'), 'every action must have second ordinal action function defined')
  assert(appActions.every(x => {
    const type = typeof x[1].timeoutMS
    return type === 'number' || type === 'function'
  }), 'every action must have second ordinal timeoutMS number or function defined')
  assert.ok(activeEvents, 'active events must exist')
}

const configureAppContext = libContext => {
  const { appName
        , libName
        , libActions
        , libActionMap
        , libActionNames
        , appActions
        , appActionMap
        , appActionNames
        , actions
        , actionMap
        , createActionType
        , typedLibActions
        , typedAppActions
        , libActionTypes
        , appActionTypes
        , typedActions
        , typedActionMap
        , getActionContextByName
        , getActionContextByType
        , getLibActionContextByOrdinal
        , getAppActionContextByOrdinal
        } = libContext
  return appOpts => {
    const { appActions, appActionMap, appActionNames, activeEvents, useFastStore, useLocalStore, thresholds } = appOpts

    const initialActionName = appActions[0][0]
    const initialAction = appActions[0][1].action
    const initialTimeoutMS = appActions[0][1].timeoutMS
    const initialLastEvent = { x: 0, y: 0 }
    const actionNames = appActions.map(x => x[0])


    const context = { getNextActionName: actionName => {
                        let hitCurrent = false
                        for(let current of appActionNames) {
                          if(hitCurrent)
                            return current
                          if(current === actionName)
                            hitCurrent = true
                        }
                      }
                    , getNextActionType: actionType => {
                        let hitCurrent = false
                        for(let current of appActionTypes) {
                          if(hitCurrent)
                            return current
                          if(current === actionType)
                            hitCurrent = true
                        }
                      }
                    , initialActionName
                    , initialAction
                    , initialTimeoutMS
                    , initialLastEvent
                    , getAction: actionName => appActionMap.get(actionName).action
                    , getTimeoutMS: actionName => appActionMap.get(actionName).timeoutMS
                    , activeEvents
                    , useFastStore
                    , useLocalStore
                    , thresholds
                    }
    return { ...context, childActions: createActionDispatchers(context) }
  }
}

const configureInitialState = libContext => appContext => {
  return  { actionName: appContext.initialActionName
          , isIdle: false
          , isPaused: false
          , lastActive: +new Date()
          , lastEvent: appContext.initialLastEvent
          //, timeoutID
          }
}

export default function createContext({ appName
                                      , appActions = getActions()
                                      , activeEvents = getActiveEvents()
                                      , useFastStore = getUseFastState()
                                      , useLocalStore = getUseLocalState()
                                      , useWebRTCState = getUseWebRTCState()
                                      , useWebSocketsState = getUseWebSocketsState()
                                      , thresholds = getThresholds()
                                      , level = getLevel()
                                      } = {}) {


  const libName = 'idlemonitor'
  const libActions = [activityAction, activityDetectionAction]


  const libOpts = { libName, libActions, validateContext, configureAppContext, configureInitialState }
  const appOpts = { appName, appActions, activeEvents, useFastStore, useLocalStore, useWebRTCState, useWebSocketsState, thresholds, level }

  return configureContext(libOpts)(appOpts)





  /*
  if(process.env.NODE_ENV !== 'production')
    validate(opts)
  const actions = sanitizeActions(opts.libActions)
  const log = createLogger({ level })

  const actionMap = new Map(actions)

  const initialActionName = actions[0][0]
  const initialAction = actions[0][1].action
  const initialTimeoutMS = actions[0][1].timeoutMS
  const initialLastEvent = { x: 0, y: 0 }
  const actionNames = actions.map(x => x[0])

  const createFullState = ( { actionName = initialActionName
                            , isIdle = false
                            , isPaused = false
                            , lastActive = +new Date()
                            , lastEvent = initialLastEvent
                            , timeoutID
                            } = {}) => {
    return  { actionName, actionNames, isIdle, isPaused, lastActive, lastEvent, timeoutID }
  }

  const getNextActionName = actionName => {
    let hitCurrent = false
    for(let name of actions.map(x => x[0])) {
      if(hitCurrent)
        return name
      if(name === actionName)
        hitCurrent = true
    }
  }
  const context = { log
                  , get initialState() { return createFullState({ actionName: initialActionName }) }
                  , getNextActionName
                  , initialActionName
                  , initialAction
                  , initialTimeoutMS
                  , initialLastEvent
                  , activeEvents
                  , get actionNames() { return actionNames }
                  , getAction: actionName => actionMap.get(actionName).action
                  , getTimeoutMS: actionName => actionMap.get(actionName).timeoutMS
                  , get useFastStore() { return useFastStore }
                  , get useLocalStore() { return useLocalStore }
                  , get useWebRTCState() { return useWebRTCState }
                  , get useWebSocketsState() { return useWebSocketsState }
                  , get thresholds() { return thresholds }
                  }
  return { ...context, childActions: createActions(context) }
  */

}




