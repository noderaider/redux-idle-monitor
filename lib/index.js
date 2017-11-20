"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var context_1 = require("./context");
var reducer_1 = require("./reducer");
var blueprints_1 = require("./blueprints");
var middleware_1 = require("./middleware");
function configure(appOpts) {
    var context = context_1.default(appOpts);
    var translateBlueprints = context.translateBlueprints;
    var actions = translateBlueprints(blueprints_1.publicBlueprints);
    return {
        reducer: reducer_1.createReducer(context),
        middleware: middleware_1.createMiddleware(context),
        actions: actions
    };
}
exports.default = configure;
