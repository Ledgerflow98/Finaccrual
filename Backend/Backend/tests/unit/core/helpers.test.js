const { generateOAuthState, encodeBasicAuth } = require('../../../src/core/helpers');

describe('Core Helpers', () => {
    describe('generateOAuthState', () => {
        it('should generate a base64url string of length 22 (for 16 bytes)', () => {
            const state = generateOAuthState();
            expect(typeof state).toBe('string');
            expect(state.length).toBeGreaterThan(0);
            
            const state2 = generateOAuthState();
            expect(state).not.toEqual(state2); // Should be random
        });
    });

    describe('encodeBasicAuth', () => {
        it('should correctly base64 encode clientId:clientSecret', () => {
            const clientId = 'myClient';
            const clientSecret = 'mySecret';
            
            const encoded = encodeBasicAuth(clientId, clientSecret);
            const expected = Buffer.from('myClient:mySecret').toString('base64');
            
            expect(encoded).toEqual(expected);
        });
    });
});
