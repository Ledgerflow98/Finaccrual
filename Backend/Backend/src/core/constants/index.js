module.exports = {
    QUICKBOOKS: {
        SCOPES: "com.intuit.quickbooks.accounting",
        AUTH_URL: "https://appcenter.intuit.com/connect/oauth2",
        TOKEN_URL: "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer",
        BASE_URL: "https://sandbox-quickbooks.api.intuit.com",
        SUCCESS_HTML: `
        <html>
        <body>
        <script>
            if (window.opener) {
                window.opener.postMessage("qb_connected", "*");
            }
            window.close();
        </script>
        <p>Connected successfully. You can close this window.</p>
        </body>
        </html>
        `
    },
    XERO: {
        SCOPES: "openid profile email offline_access accounting.contacts accounting.settings.read",
        AUTH_URL: "https://login.xero.com/identity/connect/authorize",
        TOKEN_URL: "https://identity.xero.com/connect/token",
        CONNECTIONS_URL: "https://api.xero.com/connections",
        CONTACTS_URL: "https://api.xero.com/api.xro/2.0/Contacts",
        ACCOUNTS_URL: "https://api.xero.com/api.xro/2.0/Accounts",
        ORGANISATION_URL: "https://api.xero.com/api.xro/2.0/Organisation",
        TRACKING_CATEGORIES_URL: "https://api.xero.com/api.xro/2.0/TrackingCategories",
        SUCCESS_HTML: `
        <html>
        <body>
        <script>
            if(window.opener){
                window.opener.postMessage("xero_connected","*");
            }
            window.close();
        </script>
        <h3>Xero Connected Successfully.</h3>
        <p>You can close this window.</p>
        </body>
        </html>
        `
    }
};
