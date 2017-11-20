"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var invariant = require("invariant");
var constants_1 = require("./constants");
var defaults_1 = require("./defaults");
var redux_blueprint_1 = require("redux-blueprint");
var validateContext = function (libContext, appContext) {
    invariant(libContext, "must pass opts to validate");
    invariant(appContext, "must pass opts to validate");
    var libName = libContext.libName, appName = libContext.appName;
    var activeEvents = appContext.activeEvents, thresholds = appContext.thresholds;
    invariant(libName, "libName must exist");
    invariant(typeof libName === "string", "libName option must be a string");
    invariant(libName.length > 0, "libName option must not be empty");
    invariant(appName, "appName must exist");
    invariant(typeof appName === "string", "appName option must be a string");
    invariant(appName.length > 0, "appName option must not be empty");
    invariant(activeEvents, "active events must exist");
    invariant(thresholds, "thresholds must exist");
    invariant(thresholds.mouse, "thresholds.mouse must exist");
    invariant(typeof thresholds.mouse === "number", "thresholds.mouse must be a number corresponding to pixels");
    invariant(typeof thresholds.phaseOffMS === "number", "thresholds.phaseOffMS must be a number corresponding to minimum milliseconds between updates to redux");
    invariant(typeof thresholds.phaseOnMS === "number", "thresholds.phaseOnMS must be a number corresponding to minimum milliseconds between updates to redux");
};
var configureInitialState = function (libContext) { return function (appContext) {
    return { idleStatus: constants_1.IDLESTATUS_ACTIVE,
        isRunning: false,
        isDetectionRunning: false,
        isIdle: false,
        lastActive: +new Date(),
        lastEvent: { x: -1, y: -1, type: null }
    };
}; };
function createContext(_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.appName // TODO: set these to defaults
    , appName = _c === void 0 ? null : _c // TODO: set these to defaults
    , _d = _b.IDLE_STATUSES, IDLE_STATUSES = _d === void 0 ? null : _d, _e = _b.idleStatusDelay, idleStatusDelay = _e === void 0 ? null : _e, _f = _b.activeStatusAction, activeStatusAction = _f === void 0 ? null : _f, _g = _b.idleStatusAction, idleStatusAction = _g === void 0 ? null : _g, _h = _b.activeEvents, activeEvents = _h === void 0 ? defaults_1.getActiveEvents() : _h, _j = _b.useFastStore, useFastStore = _j === void 0 ? defaults_1.getUseFastState() : _j, _k = _b.useLocalStore, useLocalStore = _k === void 0 ? defaults_1.getUseLocalState() : _k, _l = _b.useWebRTCState, useWebRTCState = _l === void 0 ? defaults_1.getUseWebRTCState() : _l, _m = _b.useWebSocketsState, useWebSocketsState = _m === void 0 ? defaults_1.getUseWebSocketsState() : _m, _o = _b.thresholds, thresholds = _o === void 0 ? defaults_1.getThresholds() : _o, _p = _b.level, level = _p === void 0 ? defaults_1.getLevel() : _p;
    var libName = constants_1.ROOT_STATE_KEY;
    var libOpts = { libName: libName, validateContext: validateContext, configureAppContext: function (libContext) { return function (appOpts) { return appOpts; }; }, configureInitialState: configureInitialState };
    var appOpts = { appName: appName, IDLE_STATUSES: IDLE_STATUSES, idleStatusDelay: idleStatusDelay, activeStatusAction: activeStatusAction, idleStatusAction: idleStatusAction, activeEvents: activeEvents, useFastStore: useFastStore, useLocalStore: useLocalStore, useWebRTCState: useWebRTCState, useWebSocketsState: useWebSocketsState, thresholds: thresholds, level: level };
    return configureContext(libOpts)(appOpts);
}
exports.default = createContext;
var cleanActionName = function (name) { return name.toUpperCase().replace(/-+\s+/, "_"); };
/** Validates library creators options */
var validateLibOpts = function (libOptsRaw) {
    invariant(libOptsRaw, "libOpts definition is required");
    var libName = libOptsRaw.libName, validateContext = libOptsRaw.validateContext, configureAppContext = libOptsRaw.configureAppContext, configureInitialState = libOptsRaw.configureInitialState;
    invariant(typeof libName === "string", "libName must be a string");
    invariant(libName.length > 0, "libName must not be empty");
    invariant(validateContext, "validateContext must exist");
    invariant(typeof validateContext === "function", "validateContext must be a function");
    invariant(configureAppContext, "configureAppContext must exist");
    invariant(typeof configureAppContext === "function", "configureAppContext must be a function");
    invariant(configureInitialState, "configureInitialState must exist");
    invariant(typeof configureInitialState === "function", "configureInitialState must be a function");
};
/** Validates library consumers options */
var validateAppOpts = function (appOptsRaw) {
    invariant(appOptsRaw, "appOpts are required");
    var appName = appOptsRaw.appName;
    invariant(typeof appName === "string", "appName opt must be a string");
    invariant(appName.length > 0, "appName opt must not be empty");
};
function configureContext(libOpts) {
    var isDev = process.env.NODE_ENV !== "production";
    if (isDev)
        validateLibOpts(libOpts);
    var libName = libOpts.libName, validateContext = libOpts.validateContext, configureAppContext = libOpts.configureAppContext, configureInitialState = libOpts.configureInitialState;
    return function (appOpts) {
        if (isDev)
            validateAppOpts(appOpts);
        var appName = appOpts.appName, level = appOpts.level;
        var translateBlueprintType = function (blueprintType) { return cleanActionName(libName) + "_" + cleanActionName(appName) + "_" + cleanActionName(blueprintType); };
        var translateBlueprintTypes = redux_blueprint_1.translateBlueprintTypesWith(translateBlueprintType);
        var translateBlueprints = redux_blueprint_1.translateBlueprintsWith(translateBlueprintType);
        var libContext = { log: createLogger({ libName: libName, level: level }),
            libName: libName,
            appName: appName,
            translateBlueprintTypes: translateBlueprintTypes,
            translateBlueprints: translateBlueprints
        };
        var appContext = configureAppContext(libContext)(appOpts);
        if (isDev)
            validateContext(libContext, appContext);
        return Object.assign(appContext, libContext, { get initialState() { return configureInitialState(libContext)(appContext); }
        });
    };
}
var noop = function () { };
function createLogger(_a) {
    var libName = _a.libName, level = _a.level;
    var _formatMessage = function (_a) {
        var level = _a.level, message = _a.message, obj = _a.obj;
        if (!message && typeof obj === "string") {
            message = obj;
            obj = noop();
        }
        return _formatLog(obj ? level + ": '" + message + "' => " + JSON.stringify(obj) : level + ": '" + message + "'");
    };
    var _formatLog = function (message) { return libName + " | " + message; };
    return process.env.NODE_ENV !== "production" ? ({ trace: function (obj, message) { return level === "trace" ? console.trace(_formatMessage({ level: "trace", message: message, obj: obj })) : noop(); },
        debug: function (obj, message) { return ["trace", "debug"].indexOf(level) !== -1 ? console.log(_formatMessage({ level: "debug", message: message, obj: obj })) : noop(); },
        info: function (obj, message) { return ["trace", "debug", "info"].indexOf(level) !== -1 ? console.info(_formatMessage({ level: "info", message: message, obj: obj })) : noop(); },
        warn: function (obj, message) { return ["trace", "debug", "info", "warn"].indexOf(level) !== -1 ? console.warn(_formatMessage({ level: "warn", message: message, obj: obj })) : noop(); },
        error: function (obj, message) { return ["trace", "debug", "info", "warn", "error"].indexOf(level) !== -1 ? console.error(_formatMessage({ level: "error", message: message, obj: obj })) : noop(); }
    }) : ({ trace: noop, debug: noop, info: noop, warn: noop, error: noop });
}
