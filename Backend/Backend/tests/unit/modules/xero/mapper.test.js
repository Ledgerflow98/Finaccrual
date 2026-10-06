const XeroMapper = require('../../../../src/modules/xero/mapper');

describe('XeroMapper', () => {
    describe('toContactDTO', () => {
        it('should correctly map raw Xero contact data', () => {
            const rawContact = {
                ContactID: 'X123',
                Name: 'Jane Doe',
                EmailAddress: 'jane@example.com',
                Phones: [{ PhoneType: 'DEFAULT', PhoneNumber: '123-456-7890' }],
                IsCustomer: true,
                IsSupplier: false
            };

            const dto = XeroMapper.toContactDTO(rawContact);

            expect(dto).toEqual({
                id: 'X123',
                name: 'Jane Doe',
                email: 'jane@example.com',
                phone: '123-456-7890',
                isCustomer: true,
                isSupplier: false,
                isNew: false,
                isUpdated: false
            });
        });

        it('should handle missing fields gracefully', () => {
            const rawContact = { ContactID: 'X124' };
            const dto = XeroMapper.toContactDTO(rawContact);

            expect(dto).toEqual({
                id: 'X124',
                name: '',
                email: '',
                phone: '',
                isCustomer: false,
                isSupplier: false,
                isNew: false,
                isUpdated: false
            });
        });

        it('should mark isNew=true when UpdatedDateUTC (ISO) is after lastSyncedAt', () => {
            const rawContact = {
                ContactID: 'X125',
                Name: 'New Contact',
                UpdatedDateUTC: '2024-06-15T10:00:00.000Z'
            };
            const dto = XeroMapper.toContactDTO(rawContact, '2024-06-01T00:00:00.000Z');

            expect(dto.isNew).toBe(true);
        });

        it('should mark isNew=true when UpdatedDateUTC (.NET date format) is after lastSyncedAt', () => {
            const rawContact = {
                ContactID: 'X126',
                Name: 'New Contact Net Date',
                UpdatedDateUTC: '/Date(1718443200000+0000)/' // 2024-06-15T10:40:00Z
            };
            const dto = XeroMapper.toContactDTO(rawContact, '2024-06-01T00:00:00.000Z');

            expect(dto.isNew).toBe(true);
        });

        it('should mark isNew=false when there is no prior sync to compare against', () => {
            const rawContact = {
                ContactID: 'X127',
                Name: 'First Pull Contact',
                UpdatedDateUTC: '2024-06-15T10:00:00.000Z'
            };
            const dto = XeroMapper.toContactDTO(rawContact, null);

            expect(dto.isNew).toBe(false);
        });

        it('should always report isUpdated=false (Xero has no separate creation timestamp to distinguish new vs. updated)', () => {
            const rawContact = {
                ContactID: 'X128',
                Name: 'Changed Contact',
                UpdatedDateUTC: '2024-06-15T10:00:00.000Z'
            };
            const dto = XeroMapper.toContactDTO(rawContact, '2024-06-01T00:00:00.000Z');

            expect(dto.isNew).toBe(true);
            expect(dto.isUpdated).toBe(false);
        });
    });

    describe('toAccountDTO', () => {
        it('should correctly map raw Xero account data', () => {
            const rawAccount = {
                AccountID: 'A2',
                Code: '200',
                Name: 'Sales',
                Type: 'REVENUE',
                Status: 'ACTIVE',
                Description: 'Product Sales'
            };

            const dto = XeroMapper.toAccountDTO(rawAccount);

            expect(dto).toEqual({
                id: 'A2',
                code: '200',
                name: 'Sales',
                type: 'REVENUE',
                status: 'Active',
                active: 'Active',
                description: 'Product Sales',
                classification: 'Revenue',
                fullyQualifiedName: 'Sales',
                isNew: false,
                isUpdated: false
            });
        });
    });
});
