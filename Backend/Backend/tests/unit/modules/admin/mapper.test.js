const AdminMapper = require('../../../../src/modules/admin/mapper');

describe('AdminMapper', () => {
    describe('toAdminDTO', () => {
        it('should strip password and return safe admin DTO', () => {
            const rawAdmin = {
                id: 1,
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'hashed_password_123',
                createdAt: new Date()
            };

            const dto = AdminMapper.toAdminDTO(rawAdmin);

            expect(dto).toEqual({
                id: 1,
                name: 'Admin User',
                email: 'admin@example.com'
            });
            
            // Explicitly ensure password is gone
            expect(dto.password).toBeUndefined();
        });
    });
});
