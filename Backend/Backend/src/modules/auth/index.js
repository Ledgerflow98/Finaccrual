'use strict';

/**
 * Auth Module Entry Point
 * ----------------------------------------------------------------
 * Exports the public API of this module so that the rest of the
 * application only depends on this file, not on internal details.
 * ----------------------------------------------------------------
 */
const routes     = require('./auth.routes');
const controller = require('./auth.controller');
const service    = require('./auth.service');
const middleware = require('./auth.middleware');

module.exports = { routes, controller, service, middleware };
