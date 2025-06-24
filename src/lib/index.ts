import { connect, NatsConnection, StringCodec } from 'nats';

// re-export all types for external use

export * from '../types';

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

    async grant(apiKey: string, module: string, action: string) {
        const response = await this.nc.request(
            'permissions.grant',
            this.sc.encode(JSON.stringify({ apiKey, module, action }))
        );
        return JSON.parse(this.sc.decode(response.data));
    }

    async revoke(apiKey: string, module: string, action: string) {
        const response = await this.nc.request(
            'permissions.revoke',
            this.sc.encode(JSON.stringify({ apiKey, module, action }))
        );
        return JSON.parse(this.sc.decode(response.data));
    }

    async check(apiKey: string, module: string, action: string) {
        const response = await this.nc.request(
            'permissions.check',
            this.sc.encode(JSON.stringify({ apiKey, module, action }))
        );
        return JSON.parse(this.sc.decode(response.data));
    }

    async list(apiKey: string) {
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

export async function grantPermission(
    nc: NatsConnection,
    apiKey: string,
    module: string,
    action: string
) {
    const sc = StringCodec();
    const response = await nc.request(
        'permissions.grant',
        sc.encode(JSON.stringify({ apiKey, module, action }))
    );
    return JSON.parse(sc.decode(response.data));
}

export async function revokePermission(
    nc: NatsConnection,
    apiKey: string,
    module: string,
    action: string
) {
    const sc = StringCodec();
    const response = await nc.request(
        'permissions.revoke',
        sc.encode(JSON.stringify({ apiKey, module, action }))
    );
    return JSON.parse(sc.decode(response.data));
}

export async function checkPermission(
    nc: NatsConnection,
    apiKey: string,
    module: string,
    action: string
) {
    const sc = StringCodec();
    const response = await nc.request(
        'permissions.check',
        sc.encode(JSON.stringify({ apiKey, module, action }))
    );
    return JSON.parse(sc.decode(response.data));
}

export async function listPermissions(nc: NatsConnection, apiKey: string) {
    const sc = StringCodec();
    const response = await nc.request(
        'permissions.list',
        sc.encode(JSON.stringify({ apiKey }))
    );
    return JSON.parse(sc.decode(response.data));
}