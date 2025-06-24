import { getFromCache, updateCache } from '../../framework/cache';
import { pool } from '../../framework/postgres';
import { ListRequest, ListResponse, ErrorResponse } from '../../types';
import { logger } from '../../framework/logger';

export async function handleList(data: ListRequest, kv: any, sc: any): Promise<ListResponse | ErrorResponse> {

    logger.info({ event: 'request_received', topic: 'permissions.list', data });

    if (!data.apiKey) {
        logger.error({ event: 'validation_error', topic: 'permissions.list', message: 'Missing apiKey' });
        return { error: { code: 'invalid_payload', message: 'Missing apiKey' } };
    }

    try {
        let permissions = await getFromCache(kv, sc, data.apiKey);

        if (!permissions) {
            const result = await pool.query('SELECT module, action FROM permissions WHERE api_key = $1', [data.apiKey]);
            permissions = result.rows;
            await updateCache(kv, sc, data.apiKey, permissions);
        }

        logger.info({ event: 'response_sent', topic: 'permissions.list', response: { permissions } });
        return { permissions };

    } catch (error) {
        logger.error({ event: 'cache_error', operation: 'list', error: (error as Error).message });
        return { error: { code: 'cache_error', message: 'Cache or database error' } };
    }
}