'use strict';

/**
 * AuthValidation
 * ----------------------------------------------------------------
 * Pure validation helpers — no side-effects, no DB calls.
 * Returns { valid: boolean, errors: string[] } for each check.
 * ----------------------------------------------------------------
 */
class AuthValidation {

    /**
     * Validate a signup request body.
     * @param {{ name?: string, email?: string, password?: string }} body
     * @returns {{ valid: boolean, errors: string[] }}
     */
    static validateSignup(body) {
        const errors = [];
        const { name, email, password } = body || {};

        // if (!name || typeof name !== 'string' || name.trim().length < 0) {
        //     errors.push('Name required');
        // }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('A valid email address is required');
        }

        if (!password || password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }

        return { valid: errors.length === 0, errors };
    }

    /**
     * Validate a login request body.
     * @param {{ email?: string, password?: string }} body
     * @returns {{ valid: boolean, errors: string[] }}
     */
    static validateLogin(body) {
        const errors = [];
        const { email, password } = body || {};

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('A valid email address is required');
        }

        if (!password) {
            errors.push('Password is required');
        }

        return { valid: errors.length === 0, errors };
    }
}

module.exports = AuthValidation;
