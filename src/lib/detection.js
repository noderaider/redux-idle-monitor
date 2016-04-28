import { assert } from 'chai'
import { IS_DEV, IDLESTATUS_ACTIVE } from './constants'
import { activityBlueprint, activityDetectionBlueprint } from './blueprints'

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

export const configureStartDetection = ({ log, activeEvents, thresholds, translateBlueprints }) => stores => (dispatch, getState) => {
  const { activity
        , activityDetection
        } = translateBlueprints({ activity: activityBlueprint
                                , activityDetection: activityDetectionBlueprint
                                })

  /** One of the event listeners triggered an activity occurrence event. This gets spammed */
  const onActivity = e => {
    if (!_shouldActivityUpdate({ log, thresholds })(stores)(e))
      return
    const { idleStatus } = stores.lib.getState()
    const isTransition = idleStatus !== IDLESTATUS_ACTIVE
    const { dispatch } = stores.selectFirst('lib')
    dispatch(activity({ x: e.pageX, y: e.pageY, type: e.type, isTransition }))
  }


  log.warn('activity detection starting...')
  if(IS_DEV)
    assert.ok(!isRunning(stores), 'activity detection is already running')
  activeEvents.forEach(x => document.addEventListener(x, onActivity))
  dispatch(activityDetection(true))

  /** RETURNS DISPATCHABLE DETECTION TERMINATOR */
  return (dispatch, getState) => {
    log.info('activity detection terminating...')
    if(IS_DEV)
      assert(isRunning(stores), 'activity detection is not running')
    activeEvents.forEach(x => document.removeEventListener(x, onActivity))
    dispatch(activityDetection(false))
  }
}