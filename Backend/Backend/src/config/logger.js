const isProduction = process.env.NODE_ENV === 'production';
const logLevel = process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug');

let logger;

try {
    const pino = require('pino');
    logger = pino({
        level: logLevel,
        transport: !isProduction ? {
            target: 'pino-pretty',
            options: { colorize: true, ignore: 'pid,hostname' }
        } : undefined
    });
} catch (err) {
    // Zero-dependency fallback if pino is not installed
    const formatMsg = (level, meta, msg) => {
        const timestamp = new Date().toISOString();
        const metaStr = meta && typeof meta === 'object' ? JSON.stringify(meta) : (meta || '');
        return `[${timestamp}] [${level.toUpperCase()}] ${msg || ''} ${metaStr}`.trim();
    };

    logger = {
        debug: (meta, msg) => {
            if (logLevel === 'debug') console.log(formatMsg('debug', meta, msg));
        },
        info: (meta, msg) => console.log(formatMsg('info', meta, msg)),
        warn: (meta, msg) => console.warn(formatMsg('warn', meta, msg)),
        error: (meta, msg) => console.error(formatMsg('error', meta, msg))
    };
}

module.exports = logger;
