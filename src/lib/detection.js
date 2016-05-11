import { assert } from 'chai'
import { IS_DEV, IDLESTATUS_ACTIVE } from './constants'
import { activityBlueprint, activityDetectionBlueprint, lastIdleStatusBlueprint } from './blueprints'

const STOP_TYPES = ['pointermove', 'MSPointerMove']
const FILTER_TYPES = ['mousemove']

/** Detects whether the activity should trigger a redux update */
const _shouldActivityUpdate = ({ log, thresholds }) => stores => ({ type, pageX, pageY }) => {
  if(STOP_TYPES.includes(type))
    return false
  if(!FILTER_TYPES.includes(type))
    return true
  const { getState } = stores.selectFirst('lib')

  /** If last event was not the same event type, trigger an update. */
  const { lastActive, lastEvent } = getState()
  if(lastEvent.type !== type)
    return true

  /** If last mouse events coordinates were not within mouse threshold, trigger an update. */
  const { x, y } = lastEvent
  if((pageX && pageY && x && y) && Math.abs(pageX - x) < thresholds.mouse && Math.abs(pageY - y) < thresholds.mouse)
    return false
  return true
}

const isRunning = stores => {
  const state = stores.lib.getState()
  return state.isDetectionRunning
}

const LOCAL_STORAGE_KEY = 'IDLEMONITOR_LAST_ACTIVE'
const localPollingFrequency = 1000


export const setLocalInit = () => localStorage[LOCAL_STORAGE_KEY] = 'INIT'
export const setLocalIdle = () => localStorage[LOCAL_STORAGE_KEY] = 'IDLE'
export const setLocalActive = () => {
  let now = Date.now()
  localStorage[LOCAL_STORAGE_KEY] = now
  return now
}
export const getLocalActive = () => localStorage[LOCAL_STORAGE_KEY]

const configureStartLocalPolling = ({ log, thresholds, activity, lastIdleStatus, getIsTransition }) => (dispatch, getState) => {
  let prevLastActive = getLocalActive()
  let localIntervalID = setInterval(() => {
    let currLastActive = getLocalActive()
    if(currLastActive == 'IDLE') {
      dispatch(lastIdleStatus())
    } else if(currLastActive != prevLastActive) {
      log.info(`local activity detected, prev=[${prevLastActive}], curr=[${currLastActive}], ${typeof currLastActive}`)
      prevLastActive = currLastActive
      dispatch(activity({ type: 'local', isTransition: getIsTransition() }))
    }
  }, localPollingFrequency)
  log.info('local activity detection starting...')
  return (dispatch, getState) => {
    log.info('local activity detection terminating...')
    clearInterval(localIntervalID)
  }
}


export const configureStartDetection = ({ log, activeEvents, thresholds, translateBlueprints }) => stores => (dispatch, getState) => {
  const { activity
        , activityDetection
        , lastIdleStatus
        } = translateBlueprints({ activity: activityBlueprint
                                , activityDetection: activityDetectionBlueprint
                                , lastIdleStatus: lastIdleStatusBlueprint
                                })

  const getIsTransition = () => stores.lib.getState().idleStatus !== IDLESTATUS_ACTIVE

  const startLocalPolling = configureStartLocalPolling({ log, activity, lastIdleStatus, getIsTransition })


  /** One of the event listeners triggered an activity occurrence event. This gets spammed */
  const onActivity = e => {
    if (!_shouldActivityUpdate({ log, thresholds })(stores)(e))
      return
    const { dispatch } = stores.selectFirst('lib')
    dispatch(activity({ x: e.pageX, y: e.pageY, type: e.type, isTransition: getIsTransition() }))
  }

  log.warn('activity detection starting...')
  if(IS_DEV)
    assert.ok(!isRunning(stores), 'activity detection is already running')
  activeEvents.forEach(x => document.addEventListener(x, onActivity))
  dispatch(activityDetection(true))
  const stopLocalPolling = dispatch(startLocalPolling)

  /** RETURNS DISPATCHABLE DETECTION TERMINATOR */
  return (dispatch, getState) => {
    log.info('activity detection terminating...')
    if(IS_DEV)
      assert(isRunning(stores), 'activity detection is not running')
    dispatch(stopLocalPolling)
    activeEvents.forEach(x => document.removeEventListener(x, onActivity))
    dispatch(activityDetection(false))
  }
}
