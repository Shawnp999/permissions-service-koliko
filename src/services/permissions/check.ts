import { getFromCache, updateCache } from '../../framework/cache';
import { pool } from '../../framework/postgres';
import { CheckRequest, CheckResponse, ErrorResponse } from '../../types';
import { logger } from '../../framework/logger';

export async function handleCheck(data: CheckRequest, kv: any, sc: any): Promise<CheckResponse | ErrorResponse> {

    logger.info({ event: 'request_received', topic: 'permissions.check', data });

    if (!data.apiKey || !data.module || !data.action) {
        logger.error({ event: 'validation_error', topic: 'permissions.check', message: 'Missing required fields' });
        return { error: { code: 'invalid_payload', message: 'Missing required fields' } };
    }

    try {
        let permissions = await getFromCache(kv, sc, data.apiKey);

        if (!permissions) {
            const result = await pool.query('SELECT module, action FROM permissions WHERE api_key = $1', [data.apiKey]);
            permissions = result.rows;
            await updateCache(kv, sc, data.apiKey, permissions);
        }

        const allowed = permissions.some(p => p.module === data.module && p.action === data.action);
        logger.info({ event: 'response_sent', topic: 'permissions.check', response: { allowed } });
        return { allowed };

    } catch (error) {
        logger.error({ event: 'cache_error', operation: 'check', error: (error as Error).message });
        return { error: { code: 'cache_error', message: 'Cache or database error' } };
    }
}