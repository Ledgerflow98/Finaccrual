'use strict';

const eventBus = require('../../core/events');
const { AppError, ValidationError } = require('../../core/errors/AppError');

/**
 * BillingService
 * ------------------------------------------------------------------
 * Pure domain layer for the billing bounded context.
 *
 * Rules:
 *  - No direct DB imports.
 *  - No direct HTTP imports (axios, etc.).
 *
 * This makes the service fully unit-testable with mocks and ready to
 * move into a standalone microservice without changes.
 * ------------------------------------------------------------------
 */
class BillingService {

    static PLAN_WEIGHTS = { basic: 1, standard: 2, pro: 3 };

    static ALLOWED_PLANS = ['Basic', 'Standard', 'Pro'];

    /**
     * @param {object} userRepository - implements findById, findByEmail, update
     */
    constructor(userRepository) {
        this.userRepository = userRepository;
    }

    // ----------------------------------------------------------------
    // Plan helpers
    // ----------------------------------------------------------------

    getPlanWeight(plan) {
        return BillingService.PLAN_WEIGHTS[plan?.toLowerCase()] ?? 0;
    }

    isDowngrade(oldPlan, newPlan) {
        return this.getPlanWeight(newPlan) < this.getPlanWeight(oldPlan);
    }

    isValidPlan(plan) {
        return BillingService.ALLOWED_PLANS.includes(plan);
    }

    // ----------------------------------------------------------------
    // Use-cases
    // ----------------------------------------------------------------

    /**
     * Change a user's subscription plan by user ID.
     * Emits a downgrade event if plan tier decreases.
     *
     * @param {string|number} userId
     * @param {string}        newPlan
     * @returns {Promise<{ isDowngrade: boolean, oldPlan: string, newPlan: string }>}
     */
    async upgradePlanById(userId, newPlan) {
        if (!this.isValidPlan(newPlan)) {
            throw new ValidationError(`Invalid plan: ${newPlan}.`);
        }

        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new AppError('The requested resource was not found.', 404, 'ERR_NOT_FOUND', 'User not found.');
        }

        // No prior plan means this is the user's first-ever plan
        // selection, which can never count as a downgrade.
        const oldPlan    = user.plan || null;
        const downgraded = oldPlan !== null && this.isDowngrade(oldPlan, newPlan);

        await this.userRepository.update(userId, { plan: newPlan });

        if (downgraded) {
            eventBus.emit('user.downgraded', { userId: user.id, email: user.email, plan: newPlan });
        }

        return { isDowngrade: downgraded, oldPlan, newPlan };
    }

    /**
     * Change a user's subscription plan by email address.
     * Emits a downgrade event if plan tier decreases.
     *
     * @param {string} email
     * @param {string} newPlan
     * @returns {Promise<{ isDowngrade: boolean, oldPlan: string, newPlan: string }>}
     */
    async upgradePlanByEmail(email, newPlan) {
        if (!this.isValidPlan(newPlan)) {
            throw new ValidationError(`Invalid plan: ${newPlan}.`);
        }

        const user = await this.userRepository.findByEmail(email);
        if (!user) {
            throw new AppError('The requested resource was not found.', 404, 'ERR_NOT_FOUND', 'User not found.');
        }

        // No prior plan means this is the user's first-ever plan
        // selection, which can never count as a downgrade.
        const oldPlan    = user.plan || null;
        const downgraded = oldPlan !== null && this.isDowngrade(oldPlan, newPlan);

        await this.userRepository.update(user.id, { plan: newPlan });

        if (downgraded) {
            eventBus.emit('user.downgraded', { userId: user.id, email, plan: newPlan });
        }

        return { isDowngrade: downgraded, oldPlan, newPlan };
    }
}

module.exports = BillingService;
