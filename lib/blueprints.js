"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var invariant = require("invariant");
var redux_blueprint_1 = require("redux-blueprint");
var constants_1 = require("./constants");
exports.startBlueprint = redux_blueprint_1.createBlueprint(constants_1.START_BLUEPRINT);
exports.stopBlueprint = redux_blueprint_1.createBlueprint(constants_1.STOP_BLUEPRINT);
exports.gotoIdleStatusBlueprint = redux_blueprint_1.createBlueprint(constants_1.GOTO_IDLE_STATUS_BLUEPRINT, function (idleStatus) { return ({ idleStatus: idleStatus }); });
exports.activityBlueprint = redux_blueprint_1.createBlueprint(constants_1.ACTIVITY_BLUEPRINT, function (_a) {
    var x = _a.x, y = _a.y, type = _a.type, isTransition = _a.isTransition;
    return ({ activeStatus: constants_1.IDLESTATUS_ACTIVE, lastActive: +new Date(), lastEvent: { x: x, y: y, type: type }, isTransition: isTransition });
});
exports.activityDetectionBlueprint = redux_blueprint_1.createBlueprint(constants_1.ACTIVITY_DETECTION_BLUEPRINT, function (isDetectionRunning) { return ({ isDetectionRunning: isDetectionRunning }); });
exports.publicBlueprints = { start: exports.startBlueprint, stop: exports.stopBlueprint, gotoIdleStatus: exports.gotoIdleStatusBlueprint };
exports.nextIdleStatusBlueprint = redux_blueprint_1.createBlueprint(constants_1.NEXT_IDLE_STATUS_BLUEPRINT, function (nextIdleStatus) {
    invariant(nextIdleStatus, "nextIdleStatus must be defined");
    return { nextIdleStatus: nextIdleStatus };
});
exports.lastIdleStatusBlueprint = redux_blueprint_1.createBlueprint(constants_1.LAST_IDLE_STATUS_BLUEPRINT);
