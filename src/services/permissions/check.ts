import { getFromCache, updateCache, hasPermissionInCache } from '../../framework/cache';
import { pool } from '../../framework/postgres';
import { CheckRequest, CheckResponse, ErrorResponse, ErrorCode } from '../../types';
import { logger } from '../../framework/logger';

export async function handleCheck(data: CheckRequest, kv: any, sc: any): Promise<CheckResponse | ErrorResponse> {

    logger.info({ event: 'request_received', topic: 'permissions.check', data });

    if (!data.apiKey || !data.module || !data.action) {
        logger.error({ event: 'validation_error', topic: 'permissions.check', message: 'Missing required fields' });
        return { error: { code: ErrorCode.INVALID_PAYLOAD, message: 'Missing required fields' } };
    }

    try {

        let cachedPermissions = await getFromCache(kv, sc, data.apiKey);

        if (!cachedPermissions) {
            // load from DB if no cache
            logger.info({ event: 'cache_miss_db_fallback', apiKey: data.apiKey });

            const result = await pool.query(
                'SELECT module, action FROM permissions WHERE api_key = $1',
                [data.apiKey]
            );

            await updateCache(kv, sc, data.apiKey, result.rows);

            cachedPermissions = await getFromCache(kv, sc, data.apiKey);

            if (!cachedPermissions) {
                throw new Error('Failed to create cache after database load');
            }
        }

        // O(1) permission check using Set.has()
        const allowed = hasPermissionInCache(cachedPermissions, data.module, data.action);

        logger.info({
            event: 'response_sent',
            topic: 'permissions.check',
            response: { allowed },
            cache_size: cachedPermissions.permissions.length
        });

        return { allowed };

    } catch (error) {
        logger.error({
            event: 'service_error',
            operation: 'check',
            error: (error as Error).message
        });
        return {
            error: {
                code: ErrorCode.CACHE_ERROR,
                message: 'Service error occurred'
            }
        };
    }
}