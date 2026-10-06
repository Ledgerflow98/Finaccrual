'use strict';

/**
 * Billing Module — Public API barrel
 * ------------------------------------------------------------------
 * External code must only import from this file, never from internal
 * files directly.  This keeps the module boundary explicit and makes
 * refactoring (e.g. moving to a microservice) isolated to one place.
 * ------------------------------------------------------------------
 */
const routes     = require('./billing.routes');
const service    = require('./billing.service');
const controller = require('./billing.controller');

module.exports = { routes, service, controller };
