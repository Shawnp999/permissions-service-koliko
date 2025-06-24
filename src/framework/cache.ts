import { StringCodec } from 'nats';
import { logger } from './logger';
import { PermissionKey, CachedPermissions, ValidPermission } from '../types';

// helper function for O(1) lookups
export function createPermissionKey(module: string, action: string): PermissionKey {
    return `${module}:${action}` as PermissionKey;
}

function createOptimizedCache(permissions: { module: string; action: string }[]): CachedPermissions {
    const permissionSet = new Set<PermissionKey>();
    const validPermissions: ValidPermission[] = [];

    for (const perm of permissions) {
        const key = createPermissionKey(perm.module, perm.action);
        permissionSet.add(key);
        validPermissions.push(perm as ValidPermission);
    }

    return {
        permissionSet,
        permissions: validPermissions,
        lastUpdated: Date.now()
    };
}

// convert back to array for storage
function serializeCacheForStorage(cachedPermissions: CachedPermissions): string {
    return JSON.stringify({
        permissions: cachedPermissions.permissions,
        lastUpdated: cachedPermissions.lastUpdated
    });
}

function deserializeCacheFromStorage(data: string): CachedPermissions {
    const parsed = JSON.parse(data);
    return createOptimizedCache(parsed.permissions);
}

export async function updateCache(
    kv: any,
    sc: ReturnType<typeof StringCodec>,
    apiKey: string,
    permissions: { module: string; action: string }[]
): Promise<void> {

    try {
        const optimizedCache = createOptimizedCache(permissions);
        const dataToSave = serializeCacheForStorage(optimizedCache);

        await kv.put(apiKey, sc.encode(dataToSave));

        logger.info({
            event: 'cache_updated',
            apiKey,
            permissions_count: permissions.length,
            optimization: 'set_based_lookup'
        });
    } catch (error) {
        logger.error({
            event: 'cache_update_error',
            apiKey,
            error: (error as Error).message
        });
        throw error;
    }
}

export async function getFromCache(
    kv: any,
    sc: ReturnType<typeof StringCodec>,
    apiKey: string
): Promise<CachedPermissions | null> {
    try {
        const entry = await kv.get(apiKey);

        if (entry) {
            logger.info({ event: 'cache_hit', apiKey });
            return deserializeCacheFromStorage(sc.decode(entry.value));
        }

        logger.info({ event: 'cache_miss', apiKey });
        return null;

    } catch (error) {
        logger.error({ event: 'cache_get_error', apiKey, error: (error as Error).message });
        throw error;
    }
}

// O(1) permission check using Set
export function hasPermissionInCache(
    cachedPermissions: CachedPermissions,
    module: string,
    action: string
): boolean {
    const key = createPermissionKey(module, action);
    return cachedPermissions.permissionSet.has(key);
}

export function getPermissionsArray(cachedPermissions: CachedPermissions): ValidPermission[] {
    return cachedPermissions.permissions;
}