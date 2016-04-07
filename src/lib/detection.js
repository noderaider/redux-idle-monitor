import { assert } from 'chai'
import { IS_DEV } from './constants'
import { activityBlueprint, activityDetectionBlueprint, userActiveBlueprint } from './actionBlueprints'

/** Detects whether the activity should trigger a redux update */
const _shouldActivityUpdate = ({ log, thresholds }) => stores => ({ type, pageX, pageY }) => {
  if(type !== 'mousemove') return true

  const { lastActive, lastEvent: { x, y } } = stores.selectFirst('fast', 'lib').getState()

  if (typeof pageX === 'undefined' || typeof pageY === 'undefined')
    return false
  if(Math.abs(pageX - x) < thresholds.mouse && Math.abs(pageY - y) < thresholds.mouse)
    return false

  // SKIP UPDATE IF ITS UNDER THE THRESHOLD MS FROM THE LAST UPDATE
  let elapsedMS = (+new Date()) - lastActive
  if (elapsedMS < thresholds.elapsedMS)
    return false
  if(IS_DEV)
    log.trace(`_shouldActivityUpdate: elapsed vs threshold => E[${elapsedMS}] >= T[${thresholds.elapsedMS}], lastActive => ${lastActive}`)
  return true
}

const isRunning = stores => {
  const state = stores.lib.getState()
  return state.isDetectionRunning
}

export const configureStartDetection = ({ log, activeEvents, thresholds, translateBlueprints }) => stores => (dispatch, getState) => {

  const { activityAction, activityDetectionAction, userActiveAction } = translateBlueprints({ activityAction: activityBlueprint, activityDetectionAction: activityDetectionBlueprint, userActiveAction: userActiveBlueprint })

  /** One of the event listeners triggered an activity occurrence event. This gets spammed */
  const onActivity = e => {
    if (!_shouldActivityUpdate({ log, thresholds })(stores)(e))
      return

    log.warn('DETECTOR ACTIVITY')

    const { actionName } = stores.lib.getState()
    /*
    const { actionName } = stores.lib.getState()
    if(actionName !== initialActionName) {
      dispatchAction(initialActionName, { dispatch, getState, context })
      console.warn('RESET', actionName, initialActionName)
      //return dispatch(actions.reset)
    }
    */
    //console.warn('SKIP RESTART', actionName, initialActionName)
    stores.dispatch(activityAction(e.pageX, e.pageY))

    //stores.dispatch(actions.userActive, { x: e.pageX, y: e.pageY})
    /** THIS WILL BE ROUTED TO FAST OR LOCAL STATE IF ENABLED */
  }

  log.warn('activity detection starting...')
  if(IS_DEV)
    assert.ok(!isRunning(stores), 'activity detection is already running')
  activeEvents.forEach(x => document.addEventListener(x, onActivity))
  dispatch(activityDetectionAction(true))

  /** RETURNS DISPATCHABLE DETECTION TERMINATOR */
  return (dispatch, getState) => {
    log.warn('activity detection terminating...')
    if(IS_DEV)
      assert(isRunning(stores), 'activity detection is not running')
    activeEvents.forEach(x => document.removeEventListener(x, onActivity))
    dispatch(activityDetectionAction(false))
  }
}
