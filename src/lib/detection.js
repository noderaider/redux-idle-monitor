import { assert } from 'chai'
import { IS_DEV, IDLESTATUS_ACTIVE } from './constants'
import { activityBlueprint, activityDetectionBlueprint } from './blueprints'

/** Detects whether the activity should trigger a redux update */
const _shouldActivityUpdate = ({ log, thresholds }) => stores => ({ type, pageX, pageY }) => {
  if(type !== 'mousemove'){
    console.warn('type is actually => ', type)
    return true
  }


  const { lastActive, lastEvent: { x, y } } = stores.selectFirst('lib').getState()

  if (typeof pageX === 'undefined' || typeof pageY === 'undefined')
    return false
  if(Math.abs(pageX - x) < thresholds.mouse && Math.abs(pageY - y) < thresholds.mouse)
    return false

  // SKIP UPDATE IF ITS UNDER THE THRESHOLD MS FROM THE LAST UPDATE
  let elapsedMS = (+new Date()) - lastActive
  if (elapsedMS < thresholds.elapsedMS)
    return false
  if(IS_DEV)
    log.trace(`_shouldActivityUpdate: E[${elapsedMS}] >= T[${thresholds.elapsedMS}], lastActive => ${lastActive}`)
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
    stores.selectFirst('lib').dispatch(activity({ x: e.pageX, y: e.pageY, isTransition }))
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
