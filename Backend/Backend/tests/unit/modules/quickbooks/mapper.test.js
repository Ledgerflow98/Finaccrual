const QuickBooksMapper = require('../../../../src/modules/quickbooks/mapper');

describe('QuickBooksMapper', () => {
    describe('toCustomerDTO', () => {
        it('should correctly map raw customer data', () => {
            const rawCustomer = {
                Id: '123',
                DisplayName: 'Your Name',
                CompanyName: 'Doe Corp',
                PrimaryEmailAddr: { Address: 'Your Name@example.com' },
                Balance: 150.50
            };

            const dto = QuickBooksMapper.toCustomerDTO(rawCustomer);

            expect(dto).toEqual({
                id: '123',
                name: 'Your Name',
                companyName: 'Doe Corp',
                email: 'Your Name@example.com',
                balance: 150.50,
                active: 'Active',
                isNew: false,
                isUpdated: false
            });
        });

        it('should handle missing fields gracefully', () => {
            const rawCustomer = { Id: '124' };
            const dto = QuickBooksMapper.toCustomerDTO(rawCustomer);

            expect(dto).toEqual({
                id: '124',
                name: '',
                companyName: '',
                email: '',
                balance: 0,
                active: 'Active',
                isNew: false,
                isUpdated: false
            });
        });

        it('should mark isNew=true when CreateTime is after lastSyncedAt', () => {
            const rawCustomer = {
                Id: '125',
                DisplayName: 'New Customer',
                MetaData: { CreateTime: '2024-06-15T10:00:00-00:00' }
            };
            const dto = QuickBooksMapper.toCustomerDTO(rawCustomer, '2024-06-01T00:00:00-00:00');

            expect(dto.isNew).toBe(true);
        });

        it('should mark isNew=false when CreateTime is before lastSyncedAt', () => {
            const rawCustomer = {
                Id: '126',
                DisplayName: 'Old Customer',
                MetaData: { CreateTime: '2024-05-01T10:00:00-00:00' }
            };
            const dto = QuickBooksMapper.toCustomerDTO(rawCustomer, '2024-06-01T00:00:00-00:00');

            expect(dto.isNew).toBe(false);
        });

        it('should mark isNew=false when there is no prior sync to compare against', () => {
            const rawCustomer = {
                Id: '127',
                DisplayName: 'First Pull Customer',
                MetaData: { CreateTime: '2024-06-15T10:00:00-00:00' }
            };
            const dto = QuickBooksMapper.toCustomerDTO(rawCustomer, null);

            expect(dto.isNew).toBe(false);
        });

        it('should mark isUpdated=true when a pre-existing record was modified after lastSyncedAt', () => {
            const rawCustomer = {
                Id: '128',
                DisplayName: 'Modified Customer',
                MetaData: {
                    CreateTime: '2024-01-01T00:00:00-00:00',
                    LastUpdatedTime: '2024-06-15T10:00:00-00:00'
                }
            };
            const dto = QuickBooksMapper.toCustomerDTO(rawCustomer, '2024-06-01T00:00:00-00:00');

            expect(dto.isNew).toBe(false);
            expect(dto.isUpdated).toBe(true);
        });

        it('should mark isUpdated=false for an unchanged pre-existing record', () => {
            const rawCustomer = {
                Id: '129',
                DisplayName: 'Untouched Customer',
                MetaData: {
                    CreateTime: '2024-01-01T00:00:00-00:00',
                    LastUpdatedTime: '2024-01-02T00:00:00-00:00'
                }
            };
            const dto = QuickBooksMapper.toCustomerDTO(rawCustomer, '2024-06-01T00:00:00-00:00');

            expect(dto.isNew).toBe(false);
            expect(dto.isUpdated).toBe(false);
        });

        it('should never mark a brand-new record as isUpdated', () => {
            const rawCustomer = {
                Id: '130',
                DisplayName: 'New Customer',
                MetaData: {
                    CreateTime: '2024-06-15T10:00:00-00:00',
                    LastUpdatedTime: '2024-06-15T10:00:00-00:00'
                }
            };
            const dto = QuickBooksMapper.toCustomerDTO(rawCustomer, '2024-06-01T00:00:00-00:00');

            expect(dto.isNew).toBe(true);
            expect(dto.isUpdated).toBe(false);
        });
    });

    describe('toVendorDTO', () => {
        it('should correctly map raw vendor data', () => {
            const rawVendor = {
                Id: 'V1',
                DisplayName: 'Acme Supply',
                CompanyName: 'Acme Corp',
                PrimaryEmailAddr: { Address: 'billing@acme.com' },
                Balance: 500
            };

            const dto = QuickBooksMapper.toVendorDTO(rawVendor);

            expect(dto).toEqual({
                id: 'V1',
                name: 'Acme Supply',
                companyName: 'Acme Corp',
                email: 'billing@acme.com',
                balance: 500,
                active: 'Active',
                isNew: false,
                isUpdated: false
            });
        });
    });

    describe('toAccountDTO', () => {
        it('should correctly map raw account data', () => {
            const rawAccount = {
                Id: 'A1',
                AcctNum: '1000',
                Name: 'Checking',
                AccountType: 'Bank',
                AccountSubType: 'Checking',
                CurrentBalance: 10000
            };

            const dto = QuickBooksMapper.toAccountDTO(rawAccount);

            expect(dto).toEqual({
                id: 'A1',
                acctNum: '1000',
                name: 'Checking',
                accountType: 'Bank',
                accountSubType: 'Checking',
                classification: 'Asset',
                fullyQualifiedName: 'Checking',
                active: 'Active',
                currentBalance: 10000,
                isNew: false,
                isUpdated: false
            });
        });
    });
});
