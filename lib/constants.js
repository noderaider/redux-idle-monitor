"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Lib Constants */
exports.LIB_NAME = "redux-idle-monitor";
/** Redux state root level key */
exports.ROOT_STATE_KEY = "idle";
exports.ACTION_PREFIX = "IDLEMONITOR";
/** Action Blueprint Name Constants */
exports.START_BLUEPRINT = "START";
exports.STOP_BLUEPRINT = "STOP";
exports.GOTO_IDLE_STATUS_BLUEPRINT = "GOTO_IDLE_STATUS";
exports.ACTIVITY_BLUEPRINT = "ACTIVITY";
exports.ACTIVITY_DETECTION_BLUEPRINT = "ACTIVITY_DETECTION";
exports.NEXT_IDLE_STATUS_BLUEPRINT = "NEXT_IDLE_STATUS";
exports.LAST_IDLE_STATUS_BLUEPRINT = "LAST_IDLE_STATUS";
/** INITIAL IDLE STATUS */
exports.IDLESTATUS_ACTIVE = "ACTIVE";
exports.IS_DEV = process.env.NODE_ENV !== "production";
