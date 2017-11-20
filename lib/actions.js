"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var invariant = require("invariant");
var blueprints_1 = require("./blueprints");
var constants_1 = require("./constants");
var localsync_1 = require("localsync");
var STOP_TYPES = ["pointermove", "MSPointerMove"];
var FILTER_TYPES = ["mousemove"];
var isBrowser = function () { return typeof window === "object"; };
/** Detects whether the activity should trigger a redux update */
var createShouldActivityUpdate = function (_a) {
    var log = _a.log, thresholds = _a.thresholds;
    return function (store) { return function (_a) {
        var type = _a.type, pageX = _a.pageX, pageY = _a.pageY;
        if (STOP_TYPES.indexOf(type) !== -1)
            return false;
        if (FILTER_TYPES.indexOf(type) !== -1)
            return true;
        /** If last event was not the same event type, trigger an update. */
        var _b = selectIdleState(store.getState()), lastActive = _b.lastActive, lastEvent = _b.lastEvent;
        if (lastEvent.type !== type)
            return true;
        /** If last mouse events coordinates were not within mouse threshold, trigger an update. */
        var x = lastEvent.x, y = lastEvent.y;
        if ((pageX && pageY && x && y) && Math.abs(pageX - x) < thresholds.mouse && Math.abs(pageY - y) < thresholds.mouse)
            return false;
        return true;
    }; };
};
var selectIdleState = function (state) {
    var idle = state.idle;
    if (constants_1.IS_DEV) {
        invariant(idle, "idle monitor state should have idle value");
        invariant(typeof idle === "object", "idle monitor state should have type object");
    }
    return idle;
};
var isRunning = function (dispatch, getState) {
    var isDetectionRunning = selectIdleState(getState()).isDetectionRunning;
    if (constants_1.IS_DEV) {
        invariant(isDetectionRunning, "idle monitor state should have isDetectionRunning defined");
        invariant(typeof isDetectionRunning === "boolean", "isDetectionRunning should be type boolean");
    }
    return isDetectionRunning;
};
var createLocalSync = function (_a) {
    var log = _a.log, activity = _a.activity, getIsTransition = _a.getIsTransition;
    return function (store) {
        var action = function (isActive) {
            if (isActive)
                return { isActive: isActive, lastActive: Date.now() };
            else
                return { isActive: isActive };
        };
        var handler = function (value, old, url) {
            log.info({ value: value, old: old, url: url }, "local sync");
            if (value.isActive)
                store.dispatch(activity({ type: "local", isTransition: getIsTransition() }));
        };
        return localsync_1.default("idlemonitor", action, handler);
    };
};
var createActivityDetection = function (_a) {
    var log = _a.log, thresholds = _a.thresholds, activeEvents = _a.activeEvents, activity = _a.activity, activityDetection = _a.activityDetection, getIsTransition = _a.getIsTransition;
    return function (store) {
        var dispatch = store.dispatch;
        var shouldActivityUpdate = createShouldActivityUpdate({ log: log, thresholds: thresholds })(store);
        /** One of the event listeners triggered an activity occurrence event. This gets spammed */
        var onActivity = function (e) {
            if (!shouldActivityUpdate(e))
                return;
            dispatch(activity({ x: e.pageX, y: e.pageY, type: e.type, isTransition: getIsTransition() }));
        };
        var startActivityDetection = function () {
            if (isBrowser())
                activeEvents.forEach(function (x) { return document.addEventListener(x, onActivity); });
            dispatch(activityDetection(true));
        };
        var stopActivityDetection = function () {
            if (isBrowser())
                activeEvents.forEach(function (x) { return document.removeEventListener(x, onActivity); });
            dispatch(activityDetection(false));
        };
        return { startActivityDetection: startActivityDetection, stopActivityDetection: stopActivityDetection };
    };
};
exports.createDetection = function (_a) {
    var log = _a.log, activeEvents = _a.activeEvents, thresholds = _a.thresholds, translateBlueprints = _a.translateBlueprints;
    return function (store) {
        var _a = translateBlueprints({ activity: blueprints_1.activityBlueprint,
            activityDetection: blueprints_1.activityDetectionBlueprint
        }), activity = _a.activity, activityDetection = _a.activityDetection;
        var getIsTransition = function () { return selectIdleState(store.getState()).idleStatus !== constants_1.IDLESTATUS_ACTIVE; };
        var _b = createActivityDetection({ log: log, thresholds: thresholds, activeEvents: activeEvents, activity: activity, activityDetection: activityDetection, getIsTransition: getIsTransition })(store), startActivityDetection = _b.startActivityDetection, stopActivityDetection = _b.stopActivityDetection;
        var localSync = createLocalSync({ log: log, activity: activity, getIsTransition: getIsTransition })(store);
        invariant(startActivityDetection, "startActivityDetection should be a return property of createActivityDetection");
        invariant(stopActivityDetection, "stopActivityDetection should be a return property of createActivityDetection");
        invariant(localSync, "localSync should exist");
        invariant(localSync.start, "localSync.start should exist");
        invariant(localSync.stop, "localSync.stop should exist");
        invariant(localSync.trigger, "localSync.trigger should exist");
        log.info("activity detection starting");
        return { startActivityDetection: startActivityDetection, stopActivityDetection: stopActivityDetection, localSync: localSync };
    };
};
