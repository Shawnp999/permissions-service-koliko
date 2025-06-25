// permission schema
export interface PermissionSchema {
    trades: 'create' | 'create_manual';
    inventory: 'create' | 'read' | 'update' | 'delete';
    users: 'create' | 'read' | 'update' | 'delete' | 'admin';
    reports: 'view' | 'export';
}

export type ModuleName = keyof PermissionSchema;
export type ActionForModule<T extends ModuleName> = PermissionSchema[T];

export type ValidPermission = {
    [K in ModuleName]: {
        module: K;
        action: PermissionSchema[K];
    }
}[ModuleName];

export enum ErrorCode {
    INVALID_PAYLOAD = 'invalid_payload',
    DB_ERROR = 'db_error',
    CACHE_ERROR = 'cache_error',
    API_KEY_NOT_FOUND = 'api_key_not_found',
    INTERNAL_ERROR = 'internal_error',
}

export interface GrantRequest<T extends ModuleName = ModuleName> {
    apiKey: string;
    module: T;
    action: ActionForModule<T>;
}

export interface RevokeRequest<T extends ModuleName = ModuleName> {
    apiKey: string;
    module: T;
    action: ActionForModule<T>;
}

export interface CheckRequest<T extends ModuleName = ModuleName> {
    apiKey: string;
    module: T;
    action: ActionForModule<T>;
}

export interface ListRequest {
    apiKey: string;
}

export interface GrantResponse {
    status: 'ok';
}

export interface RevokeResponse {
    status: 'ok';
}

export interface CheckResponse {
    allowed: boolean;
}

export interface ListResponse {
    permissions: ValidPermission[];
}

export interface ErrorResponse {
    error: {
        code: ErrorCode;
        message: string;
    };
}

export interface Permission {
    module: string;
    action: string;
}

export type PermissionKey = `${ModuleName}:${string}`;

// set for cache-optimized O(1) lookups
export interface CachedPermissions {
    permissionSet: Set<PermissionKey>;
    permissions: ValidPermission[];
    lastUpdated: number;
}