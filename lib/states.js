"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNextIdleStatusIn = function (idleStatuses) { return function (idleStatus) {
    var nextIdleStatusIndex = idleStatuses.indexOf(idleStatus) + 1;
    if (nextIdleStatusIndex < idleStatuses.length)
        return idleStatuses[nextIdleStatusIndex];
}; };
