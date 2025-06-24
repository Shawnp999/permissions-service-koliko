import { pool } from '../../framework/postgres';
import { updateCache } from '../../framework/cache';
import { GrantRequest, GrantResponse, ErrorResponse } from '../../types';
import { logger } from '../../framework/logger';

export async function handleGrant(data: GrantRequest, kv: any, sc: any): Promise<GrantResponse | ErrorResponse> {

    logger.info({ event: 'request_received', topic: 'permissions.grant', data });

    if (!data.apiKey || !data.module || !data.action) {
        logger.error({ event: 'validation_error', topic: 'permissions.grant', message: 'Missing required fields' });
        return { error: { code: 'invalid_payload', message: 'Missing required fields' } };
    }

    try {
        await pool.query(
            'INSERT INTO permissions (api_key, module, action) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [data.apiKey, data.module, data.action]
        );

        const permissions = await pool.query('SELECT module, action FROM permissions WHERE api_key = $1', [data.apiKey]);

        await updateCache(kv, sc, data.apiKey, permissions.rows);

        logger.info({ event: 'response_sent', topic: 'permissions.grant', response: { status: 'ok' } });
        return { status: 'ok' };

    } catch (error) {
        logger.error({ event: 'db_error', operation: 'grant', error: (error as Error).message });
        return { error: { code: 'db_error', message: 'Database error' } };
    }
}