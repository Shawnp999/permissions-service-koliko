import { StringCodec } from 'nats';
import { logger } from './logger';

export async function updateCache(kv: any, sc: ReturnType<typeof StringCodec>, apiKey: string, permissions: { module: string; action: string }[]) {
    try {
        // conmvert permissions to string and cache
        const dataToSave = JSON.stringify({ permissions });
        await kv.put(apiKey, sc.encode(dataToSave));

        logger.info({ event: 'cache_updated', apiKey, permissions_count: permissions.length });
    } catch (error) {
        logger.error({ event: 'cache_update_error', apiKey, error: (error as Error).message });
        throw error;
    }
}

export async function getFromCache(kv: any, sc: ReturnType<typeof StringCodec>, apiKey: string): Promise<{ module: string; action: string }[] | null> {

    try {

        const entry = await kv.get(apiKey);

        if (entry) {
            // if found in cache
            logger.info({ event: 'cache_hit', apiKey });

            const data = JSON.parse(sc.decode(entry.value));
            return data.permissions;
        }

        logger.info({ event: 'cache_miss', apiKey });
        return null;

    } catch (error) {
        logger.error({ event: 'cache_get_error', apiKey, error: (error as Error).message });
        throw error;
    }
}