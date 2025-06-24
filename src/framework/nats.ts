import { connect, StringCodec } from 'nats';
import { config } from './config';
import { logger } from './logger';

export async function createNatsConnection() {

    try {
        const nc = await connect({ servers: config.natsUrl });
        const sc = StringCodec();

        const js = nc.jetstream();

        // try to get KV bucket
        try {
            const kv = await js.views.kv('permissions_cache');
            logger.info({ event: 'kv_bucket_connected', bucket: 'permissions_cache' });
            return { nc, sc, kv };
        } catch (error) {
            logger.error({
                event: 'kv_bucket_missing',
                bucket: 'permissions_cache',
                message: 'KV bucket does not exist. Create it with: nats kv add permissions_cache',
                error: (error as Error).message
            });
            throw new Error('KV bucket permissions_cache does not exist. Please create it first with: nats kv add permissions_cache');
        }

    } catch (error) {
        logger.error({ event: 'nats_connection_error', error: (error as Error).message });
        throw error;
    }
}