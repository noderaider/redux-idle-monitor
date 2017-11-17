/** Lib Constants */
export const LIB_NAME = "redux-idle-monitor";

/** Redux state root level key */
export const ROOT_STATE_KEY = "idle";

export const ACTION_PREFIX = "IDLEMONITOR";

/** Action Blueprint Name Constants */
export const START_BLUEPRINT = "START";
export const STOP_BLUEPRINT = "STOP";
export const GOTO_IDLE_STATUS_BLUEPRINT = "GOTO_IDLE_STATUS";

export const ACTIVITY_BLUEPRINT = "ACTIVITY";
export const ACTIVITY_DETECTION_BLUEPRINT = "ACTIVITY_DETECTION";

export const NEXT_IDLE_STATUS_BLUEPRINT = "NEXT_IDLE_STATUS";
export const LAST_IDLE_STATUS_BLUEPRINT = "LAST_IDLE_STATUS";

/** INITIAL IDLE STATUS */
export const IDLESTATUS_ACTIVE = "ACTIVE";

export const IS_DEV = process.env.NODE_ENV !== "production";
