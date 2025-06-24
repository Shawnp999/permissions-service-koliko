import { getFromCache, updateCache, getPermissionsArray } from '../../framework/cache';
import { pool } from '../../framework/postgres';
import { ListRequest, ListResponse, ErrorResponse, ErrorCode } from '../../types';
import { logger } from '../../framework/logger';

export async function handleList(data: ListRequest, kv: any, sc: any): Promise<ListResponse | ErrorResponse> {
    logger.info({ event: 'request_received', topic: 'permissions.list', data });

    if (!data.apiKey) {
        logger.error({ event: 'validation_error', topic: 'permissions.list', message: 'Missing apiKey' });
        return { error: { code: ErrorCode.INVALID_PAYLOAD, message: 'Missing apiKey' } };
    }

    try {

        let cachedPermissions = await getFromCache(kv, sc, data.apiKey);

        if (!cachedPermissions) {
            // Cache miss - load from database
            logger.info({ event: 'cache_miss_db_fallback', apiKey: data.apiKey });

            const result = await pool.query(
                'SELECT module, action FROM permissions WHERE api_key = $1',
                [data.apiKey]
            );

            // Update cache with fresh data
            await updateCache(kv, sc, data.apiKey, result.rows);

            // Get the newly cached data
            cachedPermissions = await getFromCache(kv, sc, data.apiKey);

            if (!cachedPermissions) {
                throw new Error('Failed to create cache after database load');
            }
        }

        // Extract permissions array from optimized cache
        const permissions = getPermissionsArray(cachedPermissions);

        logger.info({
            event: 'response_sent',
            topic: 'permissions.list',
            response: { permissions },
            permissions_count: permissions.length,
            cache_optimization: 'enabled'
        });

        return { permissions };

    } catch (error) {
        logger.error({
            event: 'service_error',
            operation: 'list',
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