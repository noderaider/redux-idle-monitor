import { assert } from 'chai'
import { startBlueprint, stopBlueprint, resetIdleStatusBlueprint, activityBlueprint, activityDetectionBlueprint, lastIdleStatusBlueprint } from './blueprints'
import { IS_DEV, IS_BROWSER, IDLESTATUS_ACTIVE, USER_ACTIVE, NEXT_IDLE_STATUS, RESET_IDLE_STATUS } from './constants'

const STOP_TYPES = ['pointermove', 'MSPointerMove']
const FILTER_TYPES = ['mousemove']

/** Detects whether the activity should trigger a redux update */
const _shouldActivityUpdate = ({ log, thresholds }) => ({ type, pageX, pageY }) => (dispatch, getState) => {
  if(STOP_TYPES.includes(type))
    return false
  if(!FILTER_TYPES.includes(type))
    return true
  /** If last event was not the same event type, trigger an update. */
  const { lastActive, lastEvent } = selectIdleState(getState())
  if(lastEvent.type !== type)
    return true

  /** If last mouse events coordinates were not within mouse threshold, trigger an update. */
  const { x, y } = lastEvent
  if((pageX && pageY && x && y) && Math.abs(pageX - x) < thresholds.mouse && Math.abs(pageY - y) < thresholds.mouse)
    return false
  return true
}

const selectIdleState = state => {
  if(IS_DEV) assert.typeOf(state.idle, 'object')
  return state.idle
}

const isRunning = (dispatch, getState) => {
  const { isDetectionRunning } = selectIdleState(getState())
  if(IS_DEV) assert.isBoolean(isDetectionRunning)
  return isDetectionRunning
}

const LOCAL_STORAGE_KEY = 'IDLEMONITOR_LAST_ACTIVE'
const localPollingFrequency = 1000


export const setLocalInit = () => {
  if(IS_BROWSER)
    localStorage[LOCAL_STORAGE_KEY] = 'INIT'
}
export const setLocalIdle = () => {
  if(IS_BROWSER)
    localStorage[LOCAL_STORAGE_KEY] = 'IDLE'
}
export const setLocalActive = () => {
  let now = Date.now()
  if(IS_BROWSER)
    localStorage[LOCAL_STORAGE_KEY] = now
  return now
}
export const getLocalActive = () => IS_BROWSER ? localStorage[LOCAL_STORAGE_KEY] : false

const createStartLocalPolling = ({ log, thresholds, activity, lastIdleStatus, getIsTransition }) => (dispatch, getState) => {
  let prevLastActive = getLocalActive()
  let localIntervalID = setInterval(() => {
    let currLastActive = getLocalActive()
    if(currLastActive == 'IDLE') {
      dispatch(lastIdleStatus())
    } else if(currLastActive != prevLastActive) {
      log.debug(`local activity detected, prev=[${prevLastActive}], curr=[${currLastActive}], ${typeof currLastActive}`)
      prevLastActive = currLastActive
      dispatch(activity({ type: 'local', isTransition: getIsTransition() }))
    }
  }, localPollingFrequency)
  return (dispatch, getState) => {
    clearInterval(localIntervalID)
  }
}


export const createStartDetection = ({ log, activeEvents, thresholds, translateBlueprints }) => (dispatch, getState) => {
  const { activity
        , activityDetection
        , lastIdleStatus
        } = translateBlueprints({ activity: activityBlueprint
                                , activityDetection: activityDetectionBlueprint
                                , lastIdleStatus: lastIdleStatusBlueprint
                                })


  const getIsTransition = () => selectIdleState(getState()).idleStatus !== IDLESTATUS_ACTIVE


  /** One of the event listeners triggered an activity occurrence event. This gets spammed */
  const onActivity = e => {
    if (!dispatch(_shouldActivityUpdate({ log, thresholds })(e)))
      return
    dispatch(activity({ x: e.pageX, y: e.pageY, type: e.type, isTransition: getIsTransition() }))
  }

  log.info('activity detection starting')
  //if(IS_DEV) assert.ok(!dispatch(isRunning), 'activity detection is already running')
  if(IS_BROWSER) activeEvents.forEach(x => document.addEventListener(x, onActivity))
  dispatch(activityDetection(true))

  const startLocalPolling = createStartLocalPolling({ log, activity, lastIdleStatus, getIsTransition })
  const stopLocalPolling = dispatch(startLocalPolling)

  /** RETURNS DISPATCHABLE DETECTION TERMINATOR */
  return (dispatch, getState) => {
    log.info('activity detection terminating')
    //if(IS_DEV) assert(dispatch(isRunning), 'activity detection is not running')
    dispatch(stopLocalPolling)
    if(IS_BROWSER) activeEvents.forEach(x => document.removeEventListener(x, onActivity))
    dispatch(activityDetection(false))
  }
}
