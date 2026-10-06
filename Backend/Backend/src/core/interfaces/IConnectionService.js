'use strict';

/**
 * IConnectionService
 * ------------------------------------------------------------------
 * Interface that the billing module uses to interact with integration
 * connection records.  The billing module must NEVER import QuickBooks
 * or Xero DB models directly — all such work goes through this contract.
 *
 * Swap the concrete implementation (e.g. move to gRPC call in a
 * microservice) without touching any billing code.
 * ------------------------------------------------------------------
 * @interface
 */
class IConnectionService {
    /**
     * Permanently delete all QB + Xero connection tokens for a user.
     * Called after a plan downgrade so the user stays within tier limits.
     * @param {string} email
     * @returns {Promise<void>}
     */
    async clearConnectionsByMail(email) {
        throw new Error('IConnectionService.clearConnectionsByMail() not implemented');
    }
}

module.exports = IConnectionService;
