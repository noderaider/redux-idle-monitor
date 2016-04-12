import createContext from './context'
import  { IS_DEV, IDLESTATUS_ACTIVE, START_BLUEPRINT, STOP_BLUEPRINT, ACTIVITY_BLUEPRINT, ACTIVITY_DETECTION_BLUEPRINT, NEXT_IDLE_STATUS_BLUEPRINT } from './constants'

/** When context has already been created, it can be shared to middleware component. */
export const createReducer = context => {
  const { initialState, translateBlueprintTypes } = context

  const { START
        , STOP
        , ACTIVITY
        , ACTIVITY_DETECTION
        , NEXT_IDLE_STATUS
        } = translateBlueprintTypes({ START: START_BLUEPRINT
                                    , STOP: STOP_BLUEPRINT
                                    , ACTIVITY: ACTIVITY_BLUEPRINT
                                    , ACTIVITY_DETECTION: ACTIVITY_DETECTION_BLUEPRINT
                                    , NEXT_IDLE_STATUS: NEXT_IDLE_STATUS_BLUEPRINT
                                    })


  return (state = initialState, action = {}) => {
    const { type, payload } = action
    switch(type) {
      case START:
        return Object.assign({}, state, selectStartPayload(payload))
      case STOP:
        return Object.assign({}, state, selectStopPayload(payload))
      case ACTIVITY:
        return Object.assign({}, state, selectActivityPayload(payload))
      case ACTIVITY_DETECTION:
        return Object.assign({}, state, selectActivityDetectionPayload(payload))
      case NEXT_IDLE_STATUS:
        return Object.assign({}, state, selectNextIdleStatusPayload(payload))
      default:
        return state
    }
  }
}

const selectStartPayload = () => ({ isRunning: true })
const selectStopPayload = () => ({ isRunning: false })
const selectActivityPayload = ({ activeStatus, lastActive, lastEvent, timeoutID }) => ({ idleStatus: activeStatus, lastActive, lastEvent, timeoutID, isIdle: false })
const selectActivityDetectionPayload = ({ isDetectionRunning }) => ({ isDetectionRunning })
const selectNextIdleStatusPayload = ({ nextIdleStatus }) => ({ idleStatus: nextIdleStatus, isIdle: true })

/** Creates reducer from opts including validation in development */
export default function configureReducer (opts) { return createReducer(createContext(opts)) }
