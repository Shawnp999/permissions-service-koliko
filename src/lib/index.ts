import { connect, NatsConnection, StringCodec } from 'nats';

// re-export all types for external use
export * from '../types';
export type {
    ModuleName,
    ActionForModule,
    ValidPermission,
    PermissionSchema,
    PermissionKey,
    CachedPermissions
} from '../types';

import {
    ModuleName,
    ActionForModule,
    GrantRequest,
    RevokeRequest,
    CheckRequest,
    ListRequest,
    GrantResponse,
    RevokeResponse,
    CheckResponse,
    ListResponse,
    ErrorResponse
} from '../types';

export class PermissionsClient {
    private nc: NatsConnection;
    private sc: ReturnType<typeof StringCodec>;

    constructor(nc: NatsConnection) {
        this.nc = nc;
        this.sc = StringCodec();
    }

    static async create(natsUrl: string = 'nats://localhost:4222'): Promise<PermissionsClient> {
        const nc = await connect({ servers: natsUrl });
        return new PermissionsClient(nc);
    }

    // all methods are not type safe
    async grant<T extends ModuleName>(
        apiKey: string,
        module: T,
        action: ActionForModule<T>
    ): Promise<GrantResponse | ErrorResponse> {
        const response = await this.nc.request(
            'permissions.grant',
            this.sc.encode(JSON.stringify({ apiKey, module, action }))
        );
        return JSON.parse(this.sc.decode(response.data));
    }

    async revoke<T extends ModuleName>(
        apiKey: string,
        module: T,
        action: ActionForModule<T>
    ): Promise<RevokeResponse | ErrorResponse> {
        const response = await this.nc.request(
            'permissions.revoke',
            this.sc.encode(JSON.stringify({ apiKey, module, action }))
        );
        return JSON.parse(this.sc.decode(response.data));
    }

    async check<T extends ModuleName>(
        apiKey: string,
        module: T,
        action: ActionForModule<T>
    ): Promise<CheckResponse | ErrorResponse> {
        const response = await this.nc.request(
            'permissions.check',
            this.sc.encode(JSON.stringify({ apiKey, module, action }))
        );
        return JSON.parse(this.sc.decode(response.data));
    }

    async list(apiKey: string): Promise<ListResponse | ErrorResponse> {
        const response = await this.nc.request(
            'permissions.list',
            this.sc.encode(JSON.stringify({ apiKey }))
        );
        return JSON.parse(this.sc.decode(response.data));
    }

    async close() {
        await this.nc.close();
    }
}

export async function grantPermission<T extends ModuleName>(
    nc: NatsConnection,
    apiKey: string,
    module: T,
    action: ActionForModule<T>
): Promise<GrantResponse | ErrorResponse> {
    const sc = StringCodec();
    const response = await nc.request(
        'permissions.grant',
        sc.encode(JSON.stringify({ apiKey, module, action }))
    );
    return JSON.parse(sc.decode(response.data));
}

export async function revokePermission<T extends ModuleName>(
    nc: NatsConnection,
    apiKey: string,
    module: T,
    action: ActionForModule<T>
): Promise<RevokeResponse | ErrorResponse> {
    const sc = StringCodec();
    const response = await nc.request(
        'permissions.revoke',
        sc.encode(JSON.stringify({ apiKey, module, action }))
    );
    return JSON.parse(sc.decode(response.data));
}

export async function checkPermission<T extends ModuleName>(
    nc: NatsConnection,
    apiKey: string,
    module: T,
    action: ActionForModule<T>
): Promise<CheckResponse | ErrorResponse> {
    const sc = StringCodec();

    const response = await nc.request(
        'permissions.check',
        sc.encode(JSON.stringify({ apiKey, module, action }))
    );
    return JSON.parse(sc.decode(response.data));
}

export async function listPermissions(
    nc: NatsConnection,
    apiKey: string
): Promise<ListResponse | ErrorResponse> {

    const sc = StringCodec();
    const response = await nc.request(
        'permissions.list',
        sc.encode(JSON.stringify({ apiKey }))
    );
    return JSON.parse(sc.decode(response.data));
}