"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var invariant = require("invariant");
var context_1 = require("./context");
var constants_1 = require("./constants");
var redux_mux_1 = require("redux-mux");
var blueprints_1 = require("./blueprints");
var actions_1 = require("./actions");
var states_1 = require("./states");
/** When context has already been created, it can be shared to middleware component. */
exports.createMiddleware = function (context) {
    var log = context.log, activeStatusAction = context.activeStatusAction, idleStatusAction = context.idleStatusAction, translateBlueprintTypes = context.translateBlueprintTypes, translateBlueprints = context.translateBlueprints, IDLE_STATUSES = context.IDLE_STATUSES, idleStatusDelay = context.idleStatusDelay, thresholds = context.thresholds;
    var _a = translateBlueprints(blueprints_1.publicBlueprints), start = _a.start, stop = _a.stop;
    var _b = translateBlueprints({
        nextIdleStatusAction: blueprints_1.nextIdleStatusBlueprint,
        lastIdleStatusAction: blueprints_1.lastIdleStatusBlueprint
    }), nextIdleStatusAction = _b.nextIdleStatusAction, lastIdleStatusAction = _b.lastIdleStatusAction;
    var _c = translateBlueprintTypes({
        START: constants_1.START_BLUEPRINT,
        STOP: constants_1.STOP_BLUEPRINT,
        NEXT_IDLE_STATUS: constants_1.NEXT_IDLE_STATUS_BLUEPRINT,
        LAST_IDLE_STATUS: constants_1.LAST_IDLE_STATUS_BLUEPRINT,
        ACTIVITY: constants_1.ACTIVITY_BLUEPRINT
    }), START = _c.START, STOP = _c.STOP, NEXT_IDLE_STATUS = _c.NEXT_IDLE_STATUS, LAST_IDLE_STATUS = _c.LAST_IDLE_STATUS, ACTIVITY = _c.ACTIVITY;
    var idleStatuses = [constants_1.IDLESTATUS_ACTIVE].concat(IDLE_STATUSES);
    var getNextIdleStatus = states_1.getNextIdleStatusIn(idleStatuses);
    var IDLESTATUS_FIRST = getNextIdleStatus(constants_1.IDLESTATUS_ACTIVE);
    var IDLESTATUS_LAST = IDLE_STATUSES.slice(-1)[0];
    var nextTimeoutID = null;
    var startDetectionID = null;
    var isStarted = false;
    return function (store) {
        var idleStore = redux_mux_1.bisectStore(constants_1.ROOT_STATE_KEY)(store);
        var _a = actions_1.createDetection(context)(store), startActivityDetection = _a.startActivityDetection, stopActivityDetection = _a.stopActivityDetection, localSync = _a.localSync;
        if (constants_1.IS_DEV) {
            invariant(startActivityDetection, "createDetection should return startActivityDetection");
            invariant(stopActivityDetection, "createDetection should return stopActivityDetection");
            invariant(localSync, "localSync should exist");
        }
        return function (next) { return function (action) {
            var dispatch = store.dispatch, getState = store.getState;
            if (!action.type)
                return next(action);
            var type = action.type, payload = action.payload;
            var scheduleTransition = function (idleStatus) {
                clearTimeout(nextTimeoutID);
                var delay = dispatch(idleStatusDelay(idleStatus));
                invariant(delay, "must return an idle status delay for idleStatus === '" + idleStatus + "'");
                invariant(typeof delay === "number", "idle status delay must be a number type for idleStatus === '" + idleStatus + "'");
                var lastActive = new Date().toTimeString();
                var nextMessage = NEXT_IDLE_STATUS + " action continuing after " + delay + " MS delay, lastActive: " + new Date().toTimeString();
                var nextCancelMessage = function (cancelledAt) { return NEXT_IDLE_STATUS + " action cancelled before " + delay + " MS delay by dispatcher, lastActive: " + new Date().toTimeString() + ", cancelledAt: " + cancelledAt; };
                var nextIdleStatus = getNextIdleStatus(idleStatus);
                nextTimeoutID = setTimeout(function () {
                    next(action);
                    dispatch(idleStatusAction(idleStatus));
                    if (nextIdleStatus) {
                        dispatch(nextIdleStatusAction(nextIdleStatus));
                    }
                    else {
                        localSync.trigger(false);
                    }
                }, delay);
                return function cancel() {
                    clearTimeout(nextTimeoutID);
                };
            };
            if (type === START) {
                if (!isStarted) {
                    startActivityDetection();
                    localSync.start();
                    isStarted = true;
                }
                var result = next(action);
                dispatch(nextIdleStatusAction(IDLESTATUS_FIRST));
                return result;
            }
            if (type === STOP) {
                clearTimeout(nextTimeoutID);
                clearTimeout(startDetectionID);
                if (isStarted) {
                    localSync.stop();
                    stopActivityDetection();
                    isStarted = false;
                }
            }
            if (type === NEXT_IDLE_STATUS) {
                return scheduleTransition(payload.nextIdleStatus);
            }
            if (type === LAST_IDLE_STATUS) {
                clearTimeout(nextTimeoutID);
                dispatch(idleStatusAction(IDLESTATUS_LAST));
            }
            if (type === ACTIVITY) {
                if (thresholds.phaseOffMS) {
                    localSync.stop();
                    stopActivityDetection();
                    startDetectionID = setTimeout(function () {
                        startActivityDetection();
                        localSync.start();
                    }, thresholds.phaseOffMS);
                }
                var result = next(action);
                if (payload.type !== "local") {
                    log.info("Setting local tab to active");
                    localSync.trigger(true);
                }
                if (payload.isTransition) {
                    dispatch(activeStatusAction);
                }
                dispatch(nextIdleStatusAction(IDLESTATUS_FIRST));
                return result;
            }
            return next(action);
        }; };
    };
};
/** Creates middleware from opts including validation in development */
function configureMiddleware(opts) {
    return exports.createMiddleware(context_1.default(opts));
}
exports.default = configureMiddleware;
