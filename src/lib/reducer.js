import createContext from './context'
import  { IS_DEV, IDLESTATUS_ACTIVE, ACTIVITY_BLUEPRINT, ACTIVITY_DETECTION_BLUEPRINT, NEXT_IDLE_STATUS_BLUEPRINT } from './constants'
import { getNextIdleStatusIn } from './states'

/** When context has already been created, it can be shared to middleware component. */
export const createReducer = context => {
  const { log, blueprints, IDLE_STATUSES, initialState, translateBlueprintTypes, useFastStore, useLocalStore, useWebRTCState, useWebSocketsState } = context

  const { ACTIVITY
        , ACTIVITY_DETECTION
        , NEXT_IDLE_STATUS
        } = translateBlueprintTypes({ ACTIVITY: ACTIVITY_BLUEPRINT
                                    , ACTIVITY_DETECTION: ACTIVITY_DETECTION_BLUEPRINT
                                    , NEXT_IDLE_STATUS: NEXT_IDLE_STATUS_BLUEPRINT
                                    })

  const getNextIdleStatus = getNextIdleStatusIn([IDLESTATUS_ACTIVE, ...IDLE_STATUSES])

  return (state = initialState, action = {}) => {
    const { type, payload } = action
    switch(type) {
      case ACTIVITY:
        console.info(`REDUCER: ${ACTIVITY} => CURRENT[${state.idleStatus}]`)
        return Object.assign({}, state, getActivityPayload(payload))

      case ACTIVITY_DETECTION:
        console.info(`REDUCER: ${ACTIVITY_DETECTION} => CURRENT[${state.idleStatus}]`)
        return Object.assign({}, state, getActivityDetectionPayload(payload))

      case NEXT_IDLE_STATUS:
        console.info(`REDUCER: ${NEXT_IDLE_STATUS} => CURRENT[${state.idleStatus}], NEXT[${payload.nextIdleStatus}]`)
        if(payload.nextIdleStatus)
          return Object.assign({}, state, { idleStatus: payload.nextIdleStatus, isIdle: true, isPaused: false })
        console.info('REDUCER NO NEXT IDLE STATUS')
        return Object.assign({}, state, { isIdle: true, isPaused: true })

      default:
        return state
    }
  }
}

const getActivityPayload = ({ activeStatus, lastActive, lastEvent, timeoutID }) => ({ idleStatus: activeStatus, lastActive, lastEvent, timeoutID, isIdle: false })
const getActivityDetectionPayload = ({ isDetectionRunning }) => ({ isDetectionRunning })

/** Creates reducer from opts including validation in development */
export default function configureReducer (opts) { return createReducer(createContext(opts)) }
