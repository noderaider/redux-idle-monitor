import { startBlueprint, stopBlueprint, resetIdleStatusBlueprint, activityBlueprint, activityDetectionBlueprint } from './blueprints'
import { IS_DEV, IDLESTATUS_ACTIVE, USER_ACTIVE, NEXT_IDLE_STATUS, RESET_IDLE_STATUS } from './constants'
import ls from 'local-storage'
const should = require('chai').should()

const STOP_TYPES = ['pointermove', 'MSPointerMove']
const FILTER_TYPES = ['mousemove']

const isBrowser = () => typeof window === 'object'

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
  const { idle } = state
  if(IS_DEV) {
    should.exist(idle, 'idle monitor state should have idle value')
    state.idle.should.be.an('object')
  }
  return idle
}

const isRunning = (dispatch, getState) => {
  const { isDetectionRunning } = selectIdleState(getState())
  if(IS_DEV) {
    should.exist('isDetectionRunning', 'idle monitor state should have idDetectionRunning defined')
    isDetectionRunning.should.be.a('boolean')
  }
  return isDetectionRunning
}

const LOCAL_STORAGE_KEY = 'IDLEMONITOR_LAST_ACTIVE'

export const setLocalInit = () => ls(LOCAL_STORAGE_KEY, 'INIT')
export const setLocalIdle = () => ls(LOCAL_STORAGE_KEY, 'IDLE')
export const setLocalActive = () => {
  let now = Date.now()
  ls(LOCAL_STORAGE_KEY, now)
  return now
}
export const getLocalActive = () => ls(LOCAL_STORAGE_KEY)

const createStartLocalSync = ({ log, thresholds, activity, getIsTransition }) => (dispatch, getState) => {
  log.info('starting local sync')
  const onStorage = (value, old, url) => {
    log.info({ value, old, url }, 'local sync')
    dispatch(activity({ type: 'local', isTransition: getIsTransition() }))
  }
  ls.on(LOCAL_STORAGE_KEY, onStorage)
  log.info('stopping local sync')
  return (dispatch, getState) => ls.off(LOCAL_STORAGE_KEY)
}


export const createStartDetection = ({ log, activeEvents, thresholds, translateBlueprints }) => (dispatch, getState) => {
  const { activity
        , activityDetection
        } = translateBlueprints({ activity: activityBlueprint
                                , activityDetection: activityDetectionBlueprint
                                })


  const getIsTransition = () => selectIdleState(getState()).idleStatus !== IDLESTATUS_ACTIVE


  /** One of the event listeners triggered an activity occurrence event. This gets spammed */
  const onActivity = e => {
    if (!dispatch(_shouldActivityUpdate({ log, thresholds })(e)))
      return
    dispatch(activity({ x: e.pageX, y: e.pageY, type: e.type, isTransition: getIsTransition() }))
  }

  log.info('activity detection starting')
  if(IS_DEV) dispatch(isRunning).should.be(false, 'activity detection is already running')
  if(isBrowser()) activeEvents.forEach(x => document.addEventListener(x, onActivity))
  dispatch(activityDetection(true))

  const stopLocalSync = dispatch(createStartLocalSync({ log, activity, getIsTransition }))
  should.exist(stopLocalSync, 'dispatching start local sync should return a disposer action')
  stopLocalSync.should.be.an('object')

  /** RETURNS DISPATCHABLE DETECTION TERMINATOR */
  return (dispatch, getState) => {
    log.info('activity detection terminating')
    if(IS_DEV) dispatch(isRunning).should.be(true, 'activity detection is not running')
    dispatch(stopLocalSync)
    if(isBrowser()) activeEvents.forEach(x => document.removeEventListener(x, onActivity))
    dispatch(activityDetection(false))
  }
}
