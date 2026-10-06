'use strict';

const EventEmitter = require('events');

/**
 * Global Event Bus
 * ------------------------------------------------------------------
 * Used for completely decoupled cross-module communication.
 * E.g., Billing module emits 'user.downgraded', accounting modules
 * listen to it to clear/truncate their respective token tables.
 * ------------------------------------------------------------------
 */
class EventBus extends EventEmitter {}

module.exports = new EventBus();
