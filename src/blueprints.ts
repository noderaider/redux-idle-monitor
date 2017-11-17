import * as invariant from "invariant";
import { createBlueprint } from "redux-blueprint";
import { IDLESTATUS_ACTIVE, START_BLUEPRINT, STOP_BLUEPRINT, GOTO_IDLE_STATUS_BLUEPRINT, ACTIVITY_BLUEPRINT, ACTIVITY_DETECTION_BLUEPRINT, NEXT_IDLE_STATUS_BLUEPRINT, LAST_IDLE_STATUS_BLUEPRINT } from "./constants";

export const startBlueprint = createBlueprint(START_BLUEPRINT);
export const stopBlueprint = createBlueprint(STOP_BLUEPRINT);
export const gotoIdleStatusBlueprint = createBlueprint(GOTO_IDLE_STATUS_BLUEPRINT, idleStatus => ({ idleStatus }));

export const activityBlueprint = createBlueprint(ACTIVITY_BLUEPRINT, ({ x, y, type, isTransition }) => ({ activeStatus: IDLESTATUS_ACTIVE, lastActive: +new Date(), lastEvent: { x, y, type }, isTransition }));
export const activityDetectionBlueprint = createBlueprint(ACTIVITY_DETECTION_BLUEPRINT, isDetectionRunning => ({ isDetectionRunning }));

export const publicBlueprints = { start: startBlueprint, stop: stopBlueprint, gotoIdleStatus: gotoIdleStatusBlueprint };

export const nextIdleStatusBlueprint = createBlueprint(NEXT_IDLE_STATUS_BLUEPRINT, nextIdleStatus => {
  invariant(nextIdleStatus, "nextIdleStatus must be defined");
  return { nextIdleStatus };
});

export const lastIdleStatusBlueprint = createBlueprint(LAST_IDLE_STATUS_BLUEPRINT);
