import { pool } from '../../framework/postgres';
import { updateCache } from '../../framework/cache';
import { RevokeRequest, RevokeResponse, ErrorResponse, ErrorCode } from '../../types';
import { logger } from '../../framework/logger';

export async function handleRevoke(data: RevokeRequest, kv: any, sc: any): Promise<RevokeResponse | ErrorResponse> {

    logger.info({ event: 'request_received', topic: 'permissions.revoke', data });

    if (!data.apiKey || !data.module || !data.action) {
        logger.error({ event: 'validation_error', topic: 'permissions.revoke', message: 'Missing required fields' });
        return { error: { code: ErrorCode.INVALID_PAYLOAD, message: 'Missing required fields' } };
    }

    try {
        await pool.query(
            'DELETE FROM permissions WHERE api_key = $1 AND module = $2 AND action = $3',
            [data.apiKey, data.module, data.action]
        );

        const permissions = await pool.query('SELECT module, action FROM permissions WHERE api_key = $1', [data.apiKey]);

        await updateCache(kv, sc, data.apiKey, permissions.rows);

        logger.info({ event: 'response_sent', topic: 'permissions.revoke', response: { status: 'ok' } });
        return { status: 'ok' };

    } catch (error) {
        logger.error({ event: 'db_error', operation: 'revoke', error: (error as Error).message });
        return { error: { code: ErrorCode.DB_ERROR, message: 'Database error' } };
    }
}