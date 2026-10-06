/**
 * Interface representing concurrency control for Token Refreshes.
 * @interface
 */
class ILockManager {
    /**
     * Acquire a mutual exclusion lock for refreshing a specific account token.
     * If a lock is already held, blocks and resolves when the lock is released.
     * @param {string} accountId 
     * @returns {Promise<function>} A release function to free the lock
     */
    async acquire(accountId) {
        throw new Error('Method not implemented.');
    }
}

module.exports = ILockManager;
