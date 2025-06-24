import { createNatsConnection } from './framework/nats';
import { handleGrant } from './services/permissions/grant';
import { handleRevoke } from './services/permissions/revoke';
import { handleCheck } from './services/permissions/check';
import { handleList } from './services/permissions/list';
import { logger } from './framework/logger';

async function startService() {
    try {
        const { nc, sc } = await createNatsConnection();
        const kv = await nc.jetstream().views.kv('permissions_cache');

        nc.subscribe('permissions.grant', async (msg) => {
            const data = JSON.parse(sc.decode(msg.data));

            console.log(data, 'data1')
            const result = await handleGrant(data, kv, sc);
            msg.respond(sc.encode(JSON.stringify(result)));
        });

        nc.subscribe('permissions.revoke', async (msg) => {

            const data = JSON.parse(sc.decode(msg.data));

            console.log(data, 'data2')

            const result = await handleRevoke(data, kv, sc);
            msg.respond(sc.encode(JSON.stringify(result)));
        });

        nc.subscribe('permissions.check', async (msg) => {
            const data = JSON.parse(sc.decode(msg.data));
            const result = await handleCheck(data, kv, sc);
            msg.respond(sc.encode(JSON.stringify(result)));
        });

        nc.subscribe('permissions.list', async (msg) => {
            const data = JSON.parse(sc.decode(msg.data));
            const result = await handleList(data, kv, sc);
            msg.respond(sc.encode(JSON.stringify(result)));
        });

        logger.info({ event: 'service_started' });
    } catch (error) {
        logger.error({ event: 'service_start_error', error: (error as Error).message });
        process.exit(1);
    }
}

startService();