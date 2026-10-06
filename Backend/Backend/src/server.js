const dns = require('dns');

if (typeof dns.setDefaultResultOrder === 'function') {
    dns.setDefaultResultOrder('ipv4first');
}

const fs   = require('fs');
const http  = require('http');
const https = require('https');
const os   = require('os');
const path  = require('path');

// ---------------------------------------------------------------------------
// Dev-HTTPS detection  (must run BEFORE requiring app.js)
// ---------------------------------------------------------------------------
// On macOS, Safari/WKWebView enforces strict mixed-content rules: an HTTPS
// taskpane (webpack dev server at https://localhost:3001) cannot fetch from
// an HTTP backend.  In dev mode we reuse the TLS certs that
// office-addin-dev-certs already generated for the webpack dev server.
// The certs live at ~/.office-addin-dev-certs/ on both macOS and Windows.
//
// We detect availability HERE — before app.js is loaded — so that
// app.js can read process.env.BACKEND_HTTPS and set session cookie
// `secure` correctly.  On Windows the certs may also exist but we only
// enable HTTPS when NOT in production AND certs are present.
//
// Windows note: Edge WebView2 allows http→HTTPS taskpane fetches to
// http://localhost, so the backend can stay HTTP there.  If you also
// have certs on Windows the backend will use HTTPS, which is fine.
// ---------------------------------------------------------------------------
function tryLoadDevCerts() {
    // Only needed on macOS — Safari/WKWebView blocks HTTPS→HTTP fetches
    // (mixed-content). Windows uses Edge WebView2 which allows
    // http://localhost from an HTTPS context, so the backend stays plain
    // HTTP there and OAuth redirect URIs registered with providers
    // (http://localhost:8000) keep working without any changes.
    if (process.env.NODE_ENV === 'production') return null;
    if (process.platform !== 'darwin') return null;
    try {
        const certDir = path.join(os.homedir(), '.office-addin-dev-certs');
        const ca   = fs.readFileSync(path.join(certDir, 'ca.crt'));
        const cert = fs.readFileSync(path.join(certDir, 'localhost.crt'));
        const key  = fs.readFileSync(path.join(certDir, 'localhost.key'));
        return { ca, cert, key };
    } catch (_) {
        return null;
    }
}

const devCerts = tryLoadDevCerts();

// Stamp the flag so app.js (loaded below) can configure cookies correctly.
// In production this is always true (TLS is handled by the reverse-proxy /
// load-balancer in front of Node).  In dev it is true only when HTTPS certs
// are present.
process.env.BACKEND_HTTPS = (
    process.env.NODE_ENV === 'production' || devCerts !== null
) ? 'true' : 'false';

// ---------------------------------------------------------------------------
// Load the rest of the app (after env flags are set)
// ---------------------------------------------------------------------------
const app    = require('./app');
const { sequelize } = require('./core/database');
const { startNotificationCleanupJob } = require('./modules/notifications');
const config = require('./core/config');
const logger = require('./core/logger');

const shouldAlter = process.env.DB_SYNC_ALTER === 'true';

if (shouldAlter) {
    logger.info(
        'DB_SYNC_ALTER=true — syncing with { alter: true }. Turn this off once your schema is stable.'
    );
}

function startServer() {
    const port = config.PORT;

    if (devCerts) {
        https.createServer(devCerts, app).listen(port, '0.0.0.0', () => {
            logger.info(`Node.js backend running on https://localhost:${port} (dev HTTPS via office-addin-dev-certs)`);
        });
        return;
    }

    if (process.env.NODE_ENV !== 'production') {
        logger.warn(
            'office-addin-dev-certs not found at ~/.office-addin-dev-certs — ' +
            'starting HTTP server. On macOS run `npx office-addin-dev-certs install` ' +
            'in the Frontend-React directory to enable HTTPS on the backend.'
        );
    }

    http.createServer(app).listen(port, '0.0.0.0', () => {
        logger.info(`Node.js backend running on http://localhost:${port}`);
    });
}

sequelize
    .sync({ alter: shouldAlter })
    .then(() => {
        logger.info('Database synchronized.');
        startNotificationCleanupJob();
        startServer();
    })
    .catch((err) => {
        logger.error('Unable to connect to the database:', err);
    });