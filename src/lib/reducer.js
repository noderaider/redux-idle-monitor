import createContext from './context'
import  { ACTIVITY, ACTIVITY_DETECTION } from './constants'

/** When context has already been created, it can be shared to middleware component. */
export const createReducer = context => {
  const { log, initialState, actionNames, actionTypes, getActionType, useFastStore, useLocalStore, useWebRTCState, useWebSocketsState } = context
  const  ACTIVITY_ACTION = getActionType(ACTIVITY)
  const  ACTIVITY_DETECTION_ACTION = getActionType(ACTIVITY_DETECTION)
  return (state = initialState, action = {}) => {
    if(!actionTypes.includes(action.type)) {
      return state
    }
    console.warn('REDUCING', action.type)
    const { type, payload } = action
    if(type === ACTIVITY_ACTION) {
      /*
      if(useFastStore)
        return state
      */
      const { lastActive, lastEvent, timeoutID, isDetectionRunning } = payload
      return Object.assign({}, state, { lastActive, lastEvent, timeoutID, isDetectionRunning })
    }

    if(type === ACTIVITY_DETECTION_ACTION) {
      const { lastActive, lastEvent, timeoutID, isDetectionRunning } = payload
      return Object.assign({}, state, { lastActive, lastEvent, timeoutID, isDetectionRunning })
    }


    //const { actionName, isIdle, isPaused, lastActive, lastEvent, timeoutID, isDetectionRunning } = payload
    if(type === 'IDLEMONITOR_JS_ACTIVE')
      return Object.assign({}, state, { actionName: 'ACTIVE', isIdle: false, isPaused: false })
    if(type === 'IDLEMONITOR_JS_INACTIVE')
      return Object.assign({}, state, { actionName: 'INACTIVE', isIdle: false, isPaused: false })
    if(type === 'IDLEMONITOR_JS_EXPIRED')
      return Object.assign({}, state, { actionName: 'EXPIRED', isIdle: true, isPaused: true })
  }
}

/** Creates reducer from opts including validation in development */
export default function configureReducer (opts) { return createReducer(createContext(opts)) }
