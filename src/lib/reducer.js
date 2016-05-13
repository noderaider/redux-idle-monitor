import createContext from './context'
import  { IS_DEV, IDLESTATUS_ACTIVE, START_BLUEPRINT, STOP_BLUEPRINT, GOTO_IDLE_STATUS_BLUEPRINT, ACTIVITY_BLUEPRINT, ACTIVITY_DETECTION_BLUEPRINT, NEXT_IDLE_STATUS_BLUEPRINT, LAST_IDLE_STATUS_BLUEPRINT } from './constants'

/** When context has already been created, it can be shared to middleware component. */
export const createReducer = context => {
  const { initialState, translateBlueprintTypes, IDLE_STATUSES } = context

  const IDLESTATUS_LAST = IDLE_STATUSES.slice(-1)[0]

  const { START
        , STOP
        , GOTO_IDLE_STATUS
        , ACTIVITY
        , ACTIVITY_DETECTION
        , NEXT_IDLE_STATUS
        , LAST_IDLE_STATUS
        } = translateBlueprintTypes({ START: START_BLUEPRINT
                                    , STOP: STOP_BLUEPRINT
                                    , GOTO_IDLE_STATUS: GOTO_IDLE_STATUS_BLUEPRINT
                                    , ACTIVITY: ACTIVITY_BLUEPRINT
                                    , ACTIVITY_DETECTION: ACTIVITY_DETECTION_BLUEPRINT
                                    , NEXT_IDLE_STATUS: NEXT_IDLE_STATUS_BLUEPRINT
                                    , LAST_IDLE_STATUS: LAST_IDLE_STATUS_BLUEPRINT
                                    })


  return (state = initialState, action = {}) => {
    const { type, payload } = action
    switch(type) {
      case START:
        return Object.assign({}, state, selectStartPayload(payload))
      case STOP:
        return Object.assign({}, state, selectStopPayload(payload))
      case GOTO_IDLE_STATUS:
        return Object.assign({}, state, selectGotoIdleStatusPayload(payload))
      case ACTIVITY:
        return Object.assign({}, state, selectActivityPayload(payload))
      case ACTIVITY_DETECTION:
        return Object.assign({}, state, selectActivityDetectionPayload(payload))
      case NEXT_IDLE_STATUS:
        return Object.assign({}, state, selectNextIdleStatusPayload(payload))
      case LAST_IDLE_STATUS:
        return Object.assign({}, state, selectLastIdleStatusPayload({ lastIdleStatus: IDLESTATUS_LAST }))
      default:
        return state
    }
  }
}

const selectStartPayload = () => ({ isRunning: true })
const selectStopPayload = () => ({ isRunning: false })
const selectGotoIdleStatusPayload = ({ idleStatus }) => ({ idleStatus, isIdle: true })
const selectActivityPayload = ({ activeStatus, lastActive, lastEvent, timeoutID }) => ({ idleStatus: activeStatus, lastActive, lastEvent, timeoutID, isIdle: false })
const selectActivityDetectionPayload = ({ isDetectionRunning }) => ({ isDetectionRunning })
const selectNextIdleStatusPayload = ({ nextIdleStatus }) => ({ idleStatus: nextIdleStatus, isIdle: true })
const selectLastIdleStatusPayload = ({ lastIdleStatus }) => ({ idleStatus: lastIdleStatus, isIdle: true })

/** Creates reducer from opts including validation in development */
export default function configureReducer (opts) { return createReducer(createContext(opts)) }
