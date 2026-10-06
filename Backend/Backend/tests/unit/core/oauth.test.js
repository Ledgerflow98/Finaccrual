const TokenManager = require('../../../src/core/oauth/TokenManager');
const LocalLockManager = require('../../../src/core/oauth/locking/LocalLockManager');
const { OAuthTokenRevokedError, OAuthTokenRefreshError } = require('../../../src/core/oauth/errors/OAuthErrors');
const IOAuthClient = require('../../../src/core/oauth/interfaces/IOAuthClient');
const IOAuthTokenRepository = require('../../../src/core/oauth/interfaces/IOAuthTokenRepository');

describe('OAuth Token Management System', () => {
    let mockClient;
    let mockRepository;
    let tokenManager;

    beforeEach(() => {
        // Create mock implementations of the interfaces
        mockClient = {
            refreshTokens: jest.fn()
        };
        mockRepository = {
            getToken: jest.fn(),
            saveToken: jest.fn(),
            markDisconnected: jest.fn()
        };

        // Reset LocalLockManager mapping
        LocalLockManager.activeRefreshes.clear();

        tokenManager = new TokenManager('test-provider', mockClient, mockRepository, LocalLockManager);
    });

    describe('TokenManager.getValidToken', () => {
        it('should return token immediately if it is valid and not expiring soon', async () => {
            const validTokenRecord = {
                accessToken: 'valid_access_token_123',
                refreshToken: 'refresh_token_123',
                expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes in the future
            };
            mockRepository.getToken.mockResolvedValue(validTokenRecord);

            const token = await tokenManager.getValidToken('account_1');

            expect(token).toBe('valid_access_token_123');
            expect(mockRepository.getToken).toHaveBeenCalledTimes(1);
            expect(mockClient.refreshTokens).not.toHaveBeenCalled();
            expect(mockRepository.saveToken).not.toHaveBeenCalled();
        });

        it('should perform refresh, save and return new token if token is expiring soon (less than 1 min)', async () => {
            const expiringTokenRecord = {
                accessToken: 'expiring_access_token',
                refreshToken: 'refresh_token_123',
                expiresAt: new Date(Date.now() + 30 * 1000) // 30 seconds (expiring soon < 1min)
            };
            const refreshedTokens = {
                accessToken: 'new_access_token_456',
                refreshToken: 'new_refresh_token_789',
                expiresIn: 3600
            };

            mockRepository.getToken.mockResolvedValue(expiringTokenRecord);
            mockClient.refreshTokens.mockResolvedValue(refreshedTokens);

            const token = await tokenManager.getValidToken('account_1');

            expect(token).toBe('new_access_token_456');
            expect(mockClient.refreshTokens).toHaveBeenCalledWith('refresh_token_123');
            expect(mockRepository.saveToken).toHaveBeenCalledWith('account_1', expect.objectContaining({
                accessToken: 'new_access_token_456',
                refreshToken: 'new_refresh_token_789'
            }));
        });

        it('should throw OAuthTokenRevokedError and mark disconnected when refresh returns invalid_grant revocation error', async () => {
            const expiredTokenRecord = {
                accessToken: 'expired_access_token',
                refreshToken: 'revoked_refresh_token',
                expiresAt: new Date(Date.now() - 1000) // expired
            };

            mockRepository.getToken.mockResolvedValue(expiredTokenRecord);
            
            const revocationError = new Error('Invalid grant');
            revocationError.response = {
                status: 400,
                data: { error: 'invalid_grant', error_description: 'Token has been revoked.' }
            };
            mockClient.refreshTokens.mockRejectedValue(revocationError);

            await expect(tokenManager.getValidToken('account_1')).rejects.toThrow(OAuthTokenRevokedError);
            expect(mockRepository.markDisconnected).toHaveBeenCalledWith('account_1');
        });

        it('should throw OAuthTokenRefreshError for transient connection errors and not mark disconnected', async () => {
            const expiredTokenRecord = {
                accessToken: 'expired_access_token',
                refreshToken: 'refresh_token',
                expiresAt: new Date(Date.now() - 1000) // expired
            };

            mockRepository.getToken.mockResolvedValue(expiredTokenRecord);
            mockClient.refreshTokens.mockRejectedValue(new Error('Network Timeout'));

            await expect(tokenManager.getValidToken('account_1')).rejects.toThrow(OAuthTokenRefreshError);
            expect(mockRepository.markDisconnected).not.toHaveBeenCalled();
        });
    });

    describe('LocalLockManager Concurrency Control', () => {
        it('should queue concurrent token refreshes and perform only one network refresh call', async () => {
            const expiringTokenRecord = {
                accessToken: 'expiring_access_token',
                refreshToken: 'refresh_token_123',
                expiresAt: new Date(Date.now() + 30 * 1000) // expiring soon (< 1 min)
            };
            const refreshedTokens = {
                accessToken: 'new_access_token_456',
                refreshToken: 'new_refresh_token_789',
                expiresIn: 3600
            };

            mockRepository.getToken
                .mockResolvedValueOnce(expiringTokenRecord) // First call to getToken before lock
                .mockResolvedValueOnce(expiringTokenRecord) // Second call to getToken before lock (request 2)
                .mockResolvedValueOnce(expiringTokenRecord) // Inside lock check (request 1)
                // Once request 1 saves the new token, request 2's inside lock check gets the updated valid token:
                .mockResolvedValue({
                    accessToken: 'new_access_token_456',
                    refreshToken: 'new_refresh_token_789',
                    expiresAt: new Date(Date.now() + 3600 * 1000)
                });

            // Delay the mock client refresh call to simulate network latency
            mockClient.refreshTokens.mockImplementation(async () => {
                await new Promise(r => setTimeout(r, 100));
                return refreshedTokens;
            });

            // Fire two concurrent getValidToken calls
            const [token1, token2] = await Promise.all([
                tokenManager.getValidToken('account_1'),
                tokenManager.getValidToken('account_1')
            ]);

            expect(token1).toBe('new_access_token_456');
            expect(token2).toBe('new_access_token_456');
            
            // Should call client refresh tokens exactly ONCE
            expect(mockClient.refreshTokens).toHaveBeenCalledTimes(1);
            expect(mockRepository.saveToken).toHaveBeenCalledTimes(1);
        });
    });
});
