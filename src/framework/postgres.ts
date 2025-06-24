import { Pool } from 'pg';
import { config } from './config';
import { logger } from './logger';

export const pool = new Pool(config.postgres);

export async function getPermissions(apiKey: string): Promise<{ module: string; action: string }[]> {

    try {
        const result = await pool.query('SELECT module, action FROM permissions WHERE api_key = $1', [apiKey]);
        return result.rows;

    } catch (error) {
        logger.error({ event: 'db_query_error', operation: 'getPermissions', error: (error as Error).message });
        throw error;
    }
}