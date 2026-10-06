'use strict';

/**
 * Xero Module Entry Point
 * -----------------------------------------------------------------
 * Exports the public API of this module so that the rest of the
 * application only depends on this file, not on internal details.
 * -----------------------------------------------------------------
 */
const routes     = require('./routes');
const service    = require('./service');
const mapper     = require('./mapper');
const repository = require('./repository');

module.exports = { routes, service, mapper, repository };
