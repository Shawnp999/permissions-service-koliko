import { createNatsConnection } from './framework/nats';
import { handleGrant } from './services/permissions/grant';
import { handleRevoke } from './services/permissions/revoke';
import { handleCheck } from './services/permissions/check';
import { handleList } from './services/permissions/list';
import { logger } from './framework/logger';
import { pool } from './framework/postgres';
import { ErrorCode } from './types';
import { NatsConnection, StringCodec, KV } from 'nats';

let nc: NatsConnection;

async function startService(): Promise<void> {
    try {
        // Test database connection
        await pool.query('SELECT 1');
        logger.info({ event: 'database_connected' });

        // Connect to NATS and get KV bucket
        const { nc: natsConnection, sc, kv } = await createNatsConnection();
        nc = natsConnection;

        // Start message handlers
        await Promise.all([
            handleGrantMessages(nc, sc, kv),
            handleRevokeMessages(nc, sc, kv),
            handleCheckMessages(nc, sc, kv),
            handleListMessages(nc, sc, kv)
        ]);

        logger.info({
            event: 'service_started',
            subscriptions: ['permissions.grant', 'permissions.revoke', 'permissions.check', 'permissions.list']
        });

    } catch (error) {
        logger.error({ event: 'service_start_error', error: (error as Error).message });
        process.exit(1);
    }
}

async function handleGrantMessages(nc: NatsConnection, sc: ReturnType<typeof StringCodec>, kv: KV): Promise<void> {
    const sub = nc.subscribe('permissions.grant', { queue: 'permissions' });

    for await (const msg of sub) {
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
    }
}

async function handleRevokeMessages(nc: NatsConnection, sc: ReturnType<typeof StringCodec>, kv: KV): Promise<void> {
    const sub = nc.subscribe('permissions.revoke', { queue: 'permissions' });

    for await (const msg of sub) {
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
    }
}

async function handleCheckMessages(nc: NatsConnection, sc: ReturnType<typeof StringCodec>, kv: KV): Promise<void> {
    const sub = nc.subscribe('permissions.check', { queue: 'permissions' });

    for await (const msg of sub) {
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
    }
}

async function handleListMessages(nc: NatsConnection, sc: ReturnType<typeof StringCodec>, kv: KV): Promise<void> {
    const sub = nc.subscribe('permissions.list', { queue: 'permissions' });

    for await (const msg of sub) {
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
    }
}

async function shutdown(): Promise<void> {
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

// Signal handlers
process.on('SIGINT', () => void shutdown());
process.on('SIGTERM', () => void shutdown());

process.on('uncaughtException', (error) => {
    logger.error({ event: 'uncaught_exception', error: error.message, stack: error.stack });
    void shutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error({ event: 'unhandled_rejection', reason, promise });
    void shutdown();
});

// Start the service
void startService();