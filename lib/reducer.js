"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("./context");
var constants_1 = require("./constants");
/** When context has already been created, it can be shared to middleware component. */
exports.createReducer = function (context) {
    var initialState = context.initialState, translateBlueprintTypes = context.translateBlueprintTypes, IDLE_STATUSES = context.IDLE_STATUSES;
    var IDLESTATUS_LAST = IDLE_STATUSES.slice(-1)[0];
    var _a = translateBlueprintTypes({
        START: constants_1.START_BLUEPRINT,
        STOP: constants_1.STOP_BLUEPRINT,
        GOTO_IDLE_STATUS: constants_1.GOTO_IDLE_STATUS_BLUEPRINT,
        ACTIVITY: constants_1.ACTIVITY_BLUEPRINT,
        ACTIVITY_DETECTION: constants_1.ACTIVITY_DETECTION_BLUEPRINT,
        NEXT_IDLE_STATUS: constants_1.NEXT_IDLE_STATUS_BLUEPRINT,
        LAST_IDLE_STATUS: constants_1.LAST_IDLE_STATUS_BLUEPRINT
    }), START = _a.START, STOP = _a.STOP, GOTO_IDLE_STATUS = _a.GOTO_IDLE_STATUS, ACTIVITY = _a.ACTIVITY, ACTIVITY_DETECTION = _a.ACTIVITY_DETECTION, NEXT_IDLE_STATUS = _a.NEXT_IDLE_STATUS, LAST_IDLE_STATUS = _a.LAST_IDLE_STATUS;
    return function (state, action) {
        if (state === void 0) { state = initialState; }
        if (action === void 0) { action = {}; }
        var type = action.type, payload = action.payload;
        switch (type) {
            case START:
                return Object.assign({}, state, selectStartPayload(payload));
            case STOP:
                return Object.assign({}, state, selectStopPayload(payload));
            case GOTO_IDLE_STATUS:
                return Object.assign({}, state, selectGotoIdleStatusPayload(payload));
            case ACTIVITY:
                return Object.assign({}, state, selectActivityPayload(payload));
            case ACTIVITY_DETECTION:
                return Object.assign({}, state, selectActivityDetectionPayload(payload));
            case NEXT_IDLE_STATUS:
                return Object.assign({}, state, selectNextIdleStatusPayload(payload));
            case LAST_IDLE_STATUS:
                return Object.assign({}, state, selectLastIdleStatusPayload({
                    lastIdleStatus: IDLESTATUS_LAST
                }));
            default:
                return state;
        }
    };
};
var selectStartPayload = function (payload) { return ({
    isRunning: true
}); };
var selectStopPayload = function (payload) { return ({
    isRunning: false
}); };
var selectGotoIdleStatusPayload = function (_a) {
    var idleStatus = _a.idleStatus;
    return ({
        idleStatus: idleStatus,
        isIdle: true
    });
};
var selectActivityPayload = function (_a) {
    var activeStatus = _a.activeStatus, lastActive = _a.lastActive, lastEvent = _a.lastEvent, timeoutID = _a.timeoutID;
    return ({
        idleStatus: activeStatus,
        lastActive: lastActive,
        lastEvent: lastEvent,
        timeoutID: timeoutID,
        isIdle: false
    });
};
var selectActivityDetectionPayload = function (_a) {
    var isDetectionRunning = _a.isDetectionRunning;
    return ({
        isDetectionRunning: isDetectionRunning
    });
};
var selectNextIdleStatusPayload = function (_a) {
    var nextIdleStatus = _a.nextIdleStatus;
    return ({
        idleStatus: nextIdleStatus,
        isIdle: true
    });
};
var selectLastIdleStatusPayload = function (_a) {
    var lastIdleStatus = _a.lastIdleStatus;
    return ({
        idleStatus: lastIdleStatus,
        isIdle: true
    });
};
/** Creates reducer from opts including validation in development */
function configureReducer(opts) {
    return exports.createReducer(context_1.default(opts));
}
exports.default = configureReducer;
