const request = require('supertest');
const app = require('../../src/app');
const QuickBooksService = require('../../src/modules/quickbooks/service');
const QuickBooksTokenRepository = require('../../src/modules/quickbooks/repository');

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
        QuickBooksToken: {
            findOne: jest.fn().mockResolvedValue(null),
            count: jest.fn().mockResolvedValue(0)
        }
    };
});

jest.mock('../../src/modules/quickbooks/service');
jest.mock('../../src/modules/quickbooks/repository');

describe('QuickBooks Routes Integration', () => {
    describe('GET /api/quickbooks/connect', () => {
        it('should generate OAuth URL and redirect', async () => {
            const res = await request(app).get('/api/quickbooks/connect');
            expect(res.status).toBe(302); // Redirect
            expect(res.header.location).toContain('appcenter.intuit.com/connect/oauth2');
        });
    });

    describe('GET /api/quickbooks/customers', () => {
        it('should return 200 and a list of mapped customers', async () => {
            const mockCustomers = [
                { id: '1', name: 'Your Name', email: 'Your Name@example.com', balance: 100 }
            ];
            QuickBooksService.getCustomers.mockResolvedValue(mockCustomers);

            const res = await request(app).get('/api/quickbooks/customers');
            expect(res.status).toBe(200);
            expect(res.body.customers).toEqual(mockCustomers);
        });

        it('should return 500 if service throws an error', async () => {
            QuickBooksService.getCustomers.mockRejectedValue(new Error('API Error'));

            const res = await request(app).get('/api/quickbooks/customers');
            expect(res.status).toBe(500);
            expect(res.body.details).toBe('API Error');
        });
    });

    describe('POST /api/quickbooks/disconnect', () => {
        it('should clear tokens and return success', async () => {
            QuickBooksTokenRepository.clearTokens.mockResolvedValue();

            const res = await request(app).post('/api/quickbooks/disconnect');
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('QuickBooks tokens cleared successfully.');
            expect(QuickBooksTokenRepository.clearTokens).toHaveBeenCalledTimes(1);
        });
    });

    describe('GET /api/pull-master-data', () => {
        it('should return master data as JSON when streaming is not requested', async () => {
            const mockAggregated = {
                company: [{ id: '123', name: 'Test Co' }],
                customers: [],
                vendors: [],
                accounts: [],
                classes: [],
                locations: [],
                isFirstSync: true
            };
            QuickBooksService.pullMasterDataMultithreaded = jest.fn().mockResolvedValue(mockAggregated);

            const res = await request(app).get('/api/pull-master-data?companyId=123&platform=quickbooks&tier=basic');
            expect(res.status).toBe(200);
            expect(res.body.company).toEqual(mockAggregated.company[0]);
            expect(res.headers['content-type']).toContain('application/json');
        });

        it('should send appropriate SSE headers including X-Accel-Buffering: no when stream=true', async () => {
            const mockAggregated = {
                company: [{ id: '123', name: 'Test Co' }],
                customers: [],
                vendors: [],
                accounts: [],
                classes: [],
                locations: [],
                isFirstSync: true
            };
            QuickBooksService.pullMasterDataMultithreaded = jest.fn().mockResolvedValue(mockAggregated);

            const res = await request(app).get('/api/pull-master-data?companyId=123&platform=quickbooks&tier=basic&stream=true');
            expect(res.status).toBe(200);
            expect(res.headers['content-type']).toContain('text/event-stream');
            expect(res.headers['x-accel-buffering']).toBe('no');
        });
    });

    afterAll(async () => {
        const { sequelize } = require('../../src/core/database');
        await sequelize.close();
    });
});
