// Empty module to stub out Node.js modules not available in React Native
// This prevents Metro from trying to bundle server-only code

const noop = () => {};
const emptyObject = {};

module.exports = emptyObject;
module.exports.default = emptyObject;

// Common exports that might be accessed
module.exports.createServer = noop;
module.exports.request = noop;
module.exports.get = noop;
module.exports.Server = class {};
module.exports.WebSocket = class {};
module.exports.WebSocketServer = class {};
