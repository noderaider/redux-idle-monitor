import { startBlueprint, stopBlueprint, resetIdleStatusBlueprint, activityBlueprint, activityDetectionBlueprint } from './blueprints'
import { IS_DEV, IDLESTATUS_ACTIVE, USER_ACTIVE, NEXT_IDLE_STATUS, RESET_IDLE_STATUS } from './constants'
import ls from 'local-storage'
const should = require('chai').should()

const STOP_TYPES = ['pointermove', 'MSPointerMove']
const FILTER_TYPES = ['mousemove']

const isBrowser = () => typeof window === 'object'

/** Detects whether the activity should trigger a redux update */
const createShouldActivityUpdate = ({ log, thresholds }) => store => ({ type, pageX, pageY }) => {

  if(STOP_TYPES.includes(type))
    return false
  if(!FILTER_TYPES.includes(type))
    return true
  /** If last event was not the same event type, trigger an update. */
  const { lastActive, lastEvent } = selectIdleState(store.getState())
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

const createLocalSync = ({ log, activity, getIsTransition }) => store => {
  const handleSync = (value, old, url) => {
    log.info({ value, old, url }, 'local sync')
    store.dispatch(activity({ type: 'local', isTransition: getIsTransition() }))
  }
  const startLocalSync = () => {
    log.info('starting local sync')
    ls.on(LOCAL_STORAGE_KEY, handleSync)
  }
  const stopLocalSync = () => {
    log.info('stopping local sync')
    ls.off(LOCAL_STORAGE_KEY, handleSync)
  }
  return { startLocalSync, stopLocalSync }
}


const createActivityDetection = ({ log, thresholds, activeEvents, activity, activityDetection, getIsTransition }) => store => {
  const { dispatch } = store
  const shouldActivityUpdate = createShouldActivityUpdate({ log, thresholds })(store)
  /** One of the event listeners triggered an activity occurrence event. This gets spammed */
  const onActivity = e => {
    if (!shouldActivityUpdate(e))
      return
    dispatch(activity({ x: e.pageX, y: e.pageY, type: e.type, isTransition: getIsTransition() }))
  }

  const startActivityDetection = () => {
    if(isBrowser()) activeEvents.forEach(x => document.addEventListener(x, onActivity))
    dispatch(activityDetection(true))
  }
  const stopActivityDetection = () => {
    if(isBrowser()) activeEvents.forEach(x => document.removeEventListener(x, onActivity))
    dispatch(activityDetection(false))
  }
  return { startActivityDetection, stopActivityDetection }
}


export const createDetection = ({ log, activeEvents, thresholds, translateBlueprints }) => store => {
  const { activity
        , activityDetection
        } = translateBlueprints({ activity: activityBlueprint
                                , activityDetection: activityDetectionBlueprint
                                })


  const getIsTransition = () => selectIdleState(store.getState()).idleStatus !== IDLESTATUS_ACTIVE

  const { startActivityDetection, stopActivityDetection } = createActivityDetection({ log, thresholds, activeEvents, activity, activityDetection, getIsTransition })(store)
  const { startLocalSync, stopLocalSync } = createLocalSync({ log, activity, getIsTransition })(store)

  should.exist(startActivityDetection, 'startActivityDetection should be a return property of createActivityDetection')
  should.exist(stopActivityDetection, 'stopActivityDetection should be a return property of createActivityDetection')
  should.exist(startLocalSync, 'startLocalSync should be a return property of createLocalSync')
  should.exist(stopLocalSync, 'stopLocalSync should be a return property of createLocalSync')


  log.info('activity detection starting')

  return { startActivityDetection, stopActivityDetection, startLocalSync, stopLocalSync }

/*
  startActivityDetection()
  startLocalSync()

  const startDetection = () => {
    startActivityDetection()
    startLocalSync()
  }
  const stopDetection = () => {
    stopLocalSync()
    stopActivityDetection()
  }

  return () => {
    log.info('activity detection terminating')
    stopLocalSync()
    stopActivityDetection()
  }
  */
}
