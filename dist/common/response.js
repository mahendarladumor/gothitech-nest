"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.fail = fail;
function ok(data, message) {
    return { success: true, data, message, timestamp: new Date().toISOString() };
}
function fail(error) {
    return { success: false, error, timestamp: new Date().toISOString() };
}
//# sourceMappingURL=response.js.map