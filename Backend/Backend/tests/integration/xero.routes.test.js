const request = require('supertest');
const app = require('../../src/app');
const XeroService = require('../../src/modules/xero/service');
const XeroTokenRepository = require('../../src/modules/xero/repository');

jest.mock('../../src/modules/auth/auth.middleware', () => ({
    authenticate: (req, res, next) => {
        req.user = { userId: 'FIN202612345', id: 'FIN202612345', email: 'user@example.com', role: 'user', name: 'Test User' };
        next();
    }
}));

jest.mock('../../src/core/database', () => {
    const original = jest.requireActual('../../src/core/database');
    return {
        ...original,
        XeroToken: {
            findOne: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0)
        }
    };
});

jest.mock('../../src/modules/xero/service');
jest.mock('../../src/modules/xero/repository');

describe('Xero Routes Integration', () => {
    describe('GET /api/xero/connect', () => {
        it('should generate OAuth URL and redirect', async () => {
            const res = await request(app).get('/api/xero/connect');
            expect(res.status).toBe(302); // Redirect
            expect(res.header.location).toContain('login.xero.com/identity/connect/authorize');
        });
    });

    describe('GET /api/xero/contacts', () => {
        it('should return 200 and a list of mapped contacts', async () => {
            const mockContacts = [
                { id: '1', name: 'Jane Doe', email: 'jane@example.com', isCustomer: true }
            ];
            XeroService.getContacts.mockResolvedValue(mockContacts);

            const res = await request(app).get('/api/xero/contacts');
            expect(res.status).toBe(200);
            expect(res.body.contacts).toEqual(mockContacts);
        });

        it('should return 500 if service throws an error', async () => {
            XeroService.getContacts.mockRejectedValue(new Error('API Error'));

            const res = await request(app).get('/api/xero/contacts');
            expect(res.status).toBe(500);
            expect(res.body.details).toBe('API Error');
        });
    });

    describe('POST /api/xero/disconnect', () => {
        it('should clear tokens and return success', async () => {
            XeroTokenRepository.clearTokens.mockResolvedValue();

            const res = await request(app).post('/api/xero/disconnect');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Xero tokens cleared successfully.');
            expect(XeroTokenRepository.clearTokens).toHaveBeenCalledTimes(1);
        });
    });

    afterAll(async () => {
        const { sequelize } = require('../../src/core/database');
        await sequelize.close();
    });
});
