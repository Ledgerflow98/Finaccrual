const { ValidationError } = require('../errors/AppError');

exports.validateQuickBooksState = (req, res, next) => {
    const { state } = req.query;
    const storedState = req.session?.oauth_state;

    // If the session's stored state is missing, the backend session expired
    // sometime during the OAuth redirect round-trip. Reject immediately
    // instead of silently adopting whatever state the incoming request
    // supplies — that adoption is a CSRF bypass.
    if (!storedState) {
        return next(new ValidationError('Session expired. Please reconnect QuickBooks.'));
    }

    if (state !== storedState) {
        return next(new ValidationError('Invalid OAuth state parameter.'));
    }

    next();
};

exports.validateXeroState = (req, res, next) => {
    const { code, state } = req.query;

    if (!code) {
        return next(new ValidationError('Authorization code not received from Xero.'));
    }

    const storedState = req.session?.xero_state || req.session?.oauth_state;

    if (!storedState) {
        return next(new ValidationError('Session expired. Please reconnect Xero.'));
    }

    if (state !== storedState) {
        return next(new ValidationError('Invalid OAuth state parameter.'));
    }
    next();
};
