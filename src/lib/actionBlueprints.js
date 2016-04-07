import { createActionBlueprint } from 'redux-addons/lib/actionBlueprint'
import { START, STOP, RESET, ACTIVITY, ACTIVITY_DETECTION, USER_ACTIVE } from './constants'

/** Allows end user to define an idle state transition action */
export const createIdleActionBlueprint = (actionName, nextActionName, delay) => createActionBlueprint(actionName, () => { nextActionName }, () => { delay })

export const startBlueprint = createActionBlueprint(START)
export const stopBlueprint = createActionBlueprint(STOP)
export const resetBlueprint = createActionBlueprint(RESET)

export const activityBlueprint = createActionBlueprint(ACTIVITY, (x, y) => ({ lastActive: +new Date(), lastEvent: { x, y } }))
export const activityDetectionBlueprint = createActionBlueprint(ACTIVITY_DETECTION, isDetectionRunning => ({ isDetectionRunning }))

export const userActiveBlueprint = createActionBlueprint(USER_ACTIVE)

export const publicBlueprints = { startAction: startBlueprint, stopAction: stopBlueprint, resetAction: resetBlueprint }
