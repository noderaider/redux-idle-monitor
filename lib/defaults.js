"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeStamp = function () { return new Date().toTimeString(); };
exports.getActiveEvents = function () { return ["mousemove", "keydown", "wheel", "DOMMouseScroll", "mouseWheel", "mousedown", "touchstart", "touchmove", "MSPointerDown", "MSPointerMove"]; };
exports.getUseFastState = function () { return true; };
exports.getUseLocalState = function () { return true; };
exports.getUseWebRTCState = function () { return true; };
exports.getUseWebSocketsState = function () { return true; };
exports.getThresholds = function (_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.mouse, mouse = _c === void 0 ? 20 : _c, _d = _b.phaseOffMS, phaseOffMS = _d === void 0 ? 2000 : _d, _e = _b.phaseOnMS, phaseOnMS = _e === void 0 ? 0 : _e;
    return ({ mouse: mouse, phaseOffMS: phaseOffMS, phaseOnMS: phaseOnMS });
};
exports.getLevel = function () { return "error"; };
