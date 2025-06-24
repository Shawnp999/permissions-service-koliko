import { createNatsConnection } from './framework/nats';
import { handleGrant } from './services/permissions/grant';
import { handleRevoke } from './services/permissions/revoke';
import { handleCheck } from './services/permissions/check';
import { handleList } from './services/permissions/list';
import { logger } from './framework/logger';
import { pool } from './framework/postgres';
import { ErrorCode } from './types';

let nc: any;

async function startService() {
    try {
        // test db connection
        await pool.query('SELECT 1');
        logger.info({ event: 'database_connected' });

        const { nc: natsConnection, sc, kv } = await createNatsConnection();
        nc = natsConnection;

        nc.subscribe('permissions.grant', async (msg: any) => {
            try {
                const data = JSON.parse(sc.decode(msg.data));
                logger.info({ event: 'request_received', topic: 'permissions.grant', apiKey: data.apiKey });
                const result = await handleGrant(data, kv, sc);
                msg.respond(sc.encode(JSON.stringify(result)));
            } catch (error) {
                logger.error({ event: 'handler_error', topic: 'permissions.grant', error: (error as Error).message });
                msg.respond(sc.encode(JSON.stringify({
                    error: {
                        code: ErrorCode.INTERNAL_ERROR,
                        message: 'Internal server error'
                    }
                })));
            }
        });

        nc.subscribe('permissions.revoke', async (msg: any) => {
            try {
                const data = JSON.parse(sc.decode(msg.data));
                logger.info({ event: 'request_received', topic: 'permissions.revoke', apiKey: data.apiKey });
                const result = await handleRevoke(data, kv, sc);
                msg.respond(sc.encode(JSON.stringify(result)));
            } catch (error) {
                logger.error({ event: 'handler_error', topic: 'permissions.revoke', error: (error as Error).message });
                msg.respond(sc.encode(JSON.stringify({
                    error: {
                        code: ErrorCode.INTERNAL_ERROR,
                        message: 'Internal server error'
                    }
                })));
            }
        });

        nc.subscribe('permissions.check', async (msg: any) => {
            try {
                const data = JSON.parse(sc.decode(msg.data));
                logger.info({ event: 'request_received', topic: 'permissions.check', apiKey: data.apiKey });
                const result = await handleCheck(data, kv, sc);
                msg.respond(sc.encode(JSON.stringify(result)));
            } catch (error) {
                logger.error({ event: 'handler_error', topic: 'permissions.check', error: (error as Error).message });
                msg.respond(sc.encode(JSON.stringify({
                    error: {
                        code: ErrorCode.INTERNAL_ERROR,
                        message: 'Internal server error'
                    }
                })));
            }
        });

        nc.subscribe('permissions.list', async (msg: any) => {
            try {
                const data = JSON.parse(sc.decode(msg.data));
                logger.info({ event: 'request_received', topic: 'permissions.list', apiKey: data.apiKey });
                const result = await handleList(data, kv, sc);
                msg.respond(sc.encode(JSON.stringify(result)));
            } catch (error) {
                logger.error({ event: 'handler_error', topic: 'permissions.list', error: (error as Error).message });
                msg.respond(sc.encode(JSON.stringify({
                    error: {
                        code: ErrorCode.INTERNAL_ERROR,
                        message: 'Internal server error'
                    }
                })));
            }
        });

        logger.info({ event: 'service_started', subscriptions: ['permissions.grant', 'permissions.revoke', 'permissions.check', 'permissions.list'] });

    } catch (error) {
        logger.error({ event: 'service_start_error', error: (error as Error).message });
        process.exit(1);
    }
}

async function shutdown() {
    logger.info({ event: 'shutdown_initiated' });

    try {
        if (nc) {
            await nc.drain();
            logger.info({ event: 'nats_connection_closed' });
        }

        await pool.end();
        logger.info({ event: 'database_connection_closed' });

    } catch (error) {
        logger.error({ event: 'shutdown_error', error: (error as Error).message });
    }

    logger.info({ event: 'service_stopped' });
    process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
process.on('uncaughtException', (error) => {
    logger.error({ event: 'uncaught_exception', error: error.message, stack: error.stack });
    shutdown();
});
process.on('unhandledRejection', (reason, promise) => {
    logger.error({ event: 'unhandled_rejection', reason, promise });
    shutdown();
});

startService();