const request = require('supertest');
const app = require('../../src/app');
const AdminService = require('../../src/modules/admin/service');

// Mock the service layer so we don't hit the DB
jest.mock('../../src/modules/admin/service');

const { AuthenticationError } = require('../../src/core/errors/AppError');

describe('Admin Routes Integration', () => {
    describe('POST /api/admin/login', () => {
        it('should return 400 if email or password is missing', async () => {
            const res = await request(app)
                .post('/api/admin/login')
                .send({ email: 'admin@example.com' }); // Missing password

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('required');
        });

        it('should return 200 and safe admin DTO on successful login', async () => {
            // Mock a successful service response
            const mockAdminDTO = { id: 1, name: 'Admin', email: 'admin@example.com' };
            AdminService.login.mockResolvedValue(mockAdminDTO);

            const res = await request(app)
                .post('/api/admin/login')
                .send({ email: 'admin@example.com', password: 'password123' });

            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.admin).toEqual(mockAdminDTO);
        });

        it('should return 401 on invalid credentials', async () => {
            AdminService.login.mockRejectedValue(new AuthenticationError('Invalid Password'));

            const res = await request(app)
                .post('/api/admin/login')
                .send({ email: 'admin@example.com', password: 'wrong' });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid Password');
        });
    });

    afterAll(async () => {
        const { sequelize } = require('../../src/core/database');
        await sequelize.close();
    });
});
