const crypto = require('crypto');

exports.generateOAuthState = () => crypto.randomBytes(16).toString('base64url');

exports.encodeBasicAuth = (clientId, clientSecret) => {
    return Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
};

/**
 * Renders the standalone HTML page shown inside the OAuth popup when an
 * authorization attempt is refused (plan limit reached, wrong company
 * picked on a reconnect, ...).
 *
 * The popup is a bare browser window with no access to the task pane's
 * stylesheets, and it deliberately does NOT postMessage a success signal
 * back to the opener — the task pane must keep treating the attempt as
 * unfinished, so the user sees the reason here and closes the window
 * themselves.
 *
 * @param {object}  opts
 * @param {string}  opts.title    Headline, e.g. 'Connection Limit Reached'.
 * @param {string[]} opts.lines   Body paragraphs, already plain text.
 * @param {string}  [opts.icon]   Emoji shown above the headline.
 */
exports.renderOAuthBlockedPage = ({ title, lines = [], icon = '⚠️', errorPayload = null }) => `
        <html>
            <body style="font-family:sans-serif; text-align:center; padding: 40px; background:#fff1f2; color:#9f1239;">
                <div style="font-size: 50px; margin-bottom: 20px;">${icon}</div>
                <h2>${title}</h2>
                ${lines.map(l => `<p style="font-size: 14px; color: #4b5563;">${l}</p>`).join('\n                ')}
                <button onclick="window.close()" style="margin-top: 20px; padding:10px 20px; background:#be123c; color:white; border:none; border-radius:5px; cursor:pointer; font-weight: bold;">Close Window</button>
                <script>
                    ${errorPayload ? `if (window.opener) { window.opener.postMessage(${JSON.stringify(errorPayload)}, '*'); }` : ''}
                </script>
            </body>
        </html>
    `;
