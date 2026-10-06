const ILockManager = require('../interfaces/ILockManager');

class LocalLockManager extends ILockManager {
    constructor() {
        super();
        // Maps accountId -> Promise resolving when the active refresh completes
        this.activeRefreshes = new Map();
    }

    async acquire(accountId) {
        // If there is an active refresh for this account, wait for it to complete
        if (this.activeRefreshes.has(accountId)) {
            await this.activeRefreshes.get(accountId);
            // Re-acquire lock to verify state or allow nested locks to evaluate
            return this.acquire(accountId);
        }

        let resolveLock;
        const lockPromise = new Promise((resolve) => {
            resolveLock = resolve;
        });

        this.activeRefreshes.set(accountId, lockPromise);

        // Return the release function
        return () => {
            this.activeRefreshes.delete(accountId);
            resolveLock();
        };
    }
}

// Singleton for monolithic execution
module.exports = new LocalLockManager();
