import createContext from './context'
import  { IS_DEV, ACTIVITY, ACTIVITY_DETECTION } from './constants'

/** When context has already been created, it can be shared to middleware component. */
export const createReducer = context => {
  const { log, actionBlueprints, initialState, createActionType, useFastStore, useLocalStore, useWebRTCState, useWebSocketsState } = context

  const  ACTIVITY_ACTION = createActionType(ACTIVITY)
  const  ACTIVITY_DETECTION_ACTION = createActionType(ACTIVITY_DETECTION)
  return (state = initialState, action = {}) => {
    const { type, payload } = action
    switch(type) {
      case ACTIVITY_ACTION:
        return Object.assign({}, state, getActivityPayload(payload))

      case ACTIVITY_DETECTION_ACTION:
        return Object.assign({}, state, getActivityDetectionPayload(payload))

      case 'IDLEMONITOR_JS_USER_ACTIVE':
        return Object.assign({}, state, { actionName: 'ACTIVE', isIdle: false, isPaused: false })
      case 'IDLEMONITOR_JS_USER_INACTIVE':
        return Object.assign({}, state, { actionName: 'INACTIVE', isIdle: false, isPaused: false })
      case 'IDLEMONITOR_JS_USER_EXPIRED':
        return Object.assign({}, state, { actionName: 'EXPIRED', isIdle: true, isPaused: true })
      default:
        return state
    }
  }
}

const getActivityPayload = ({ lastActive, lastEvent, timeoutID }) => ({ lastActive, lastEvent, timeoutID })
const getActivityDetectionPayload = ({ isDetectionRunning }) => ({ isDetectionRunning })

/** Creates reducer from opts including validation in development */
export default function configureReducer (opts) { return createReducer(createContext(opts)) }
