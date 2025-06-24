export enum ErrorCode {
    INVALID_PAYLOAD = 'invalid_payload',
    DB_ERROR = 'db_error',
    CACHE_ERROR = 'cache_error',
    API_KEY_NOT_FOUND = 'api_key_not_found',
    INTERNAL_ERROR = 'internal_error',
}

export interface GrantRequest {
    apiKey: string;
    module: string;
    action: string;
}

export interface GrantResponse {
    status: 'ok';
}

export interface RevokeRequest {
    apiKey: string;
    module: string;
    action: string;
}

export interface RevokeResponse {
    status: 'ok';
}

export interface CheckRequest {
    apiKey: string;
    module: string;
    action: string;
}

export interface CheckResponse {
    allowed: boolean;
}

export interface ListRequest {
    apiKey: string;
}

export interface ListResponse {
    permissions: { module: string; action: string }[];
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