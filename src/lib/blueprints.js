import { assert } from 'chai'
import { createBlueprint } from 'redux-blueprint'
import { IDLESTATUS_ACTIVE, START_BLUEPRINT, STOP_BLUEPRINT, RESET_BLUEPRINT, ACTIVITY_BLUEPRINT, ACTIVITY_DETECTION_BLUEPRINT, NEXT_IDLE_STATUS_BLUEPRINT } from './constants'

export const startBlueprint = createBlueprint(START_BLUEPRINT)
export const stopBlueprint = createBlueprint(STOP_BLUEPRINT)
export const resetBlueprint = createBlueprint(RESET_BLUEPRINT)

export const activityBlueprint = createBlueprint(ACTIVITY_BLUEPRINT, ({ x, y, type, isTransition }) => ({ activeStatus: IDLESTATUS_ACTIVE, lastActive: +new Date(), lastEvent: { x, y, type }, isTransition }))
export const activityDetectionBlueprint = createBlueprint(ACTIVITY_DETECTION_BLUEPRINT, isDetectionRunning => ({ isDetectionRunning }))


export const publicBlueprints = { start: startBlueprint, stop: stopBlueprint, reset: resetBlueprint }

export const nextIdleStatusBlueprint = createBlueprint(NEXT_IDLE_STATUS_BLUEPRINT, nextIdleStatus => {
  assert.ok(nextIdleStatus, 'nextIdleStatus must be defined')
  return { nextIdleStatus }
})

