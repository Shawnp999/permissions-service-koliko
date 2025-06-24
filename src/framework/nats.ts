import { connect, StringCodec } from 'nats';
import { config } from './config';
import { logger } from './logger';

export async function createNatsConnection() {

    try {

        const nc = await connect({ servers: config.natsUrl });

        const sc = StringCodec();
        logger.info({ event: 'nats_connected', url: config.natsUrl });
        return { nc, sc };

    } catch (error) {
        logger.error({ event: 'nats_connection_error', error: (error as Error).message });
        throw error;
    }
}