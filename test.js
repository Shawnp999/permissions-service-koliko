const { connect, StringCodec } = require('nats');

async function testPermissionsService() {

    const nc = await connect({ servers: 'nats://localhost:4222' });
    const sc = StringCodec();
    const apiKey = 'test-key-123';

    async function request(subject, data) {

        const response = await nc.request(subject, sc.encode(JSON.stringify(data)), { timeout: 5000 });
        return JSON.parse(sc.decode(response.data));
    }

    try {
        console.log('Testing permissions service...\n');

        console.log('1. Grant permission');
        const grant = await request('permissions.grant', { apiKey, module: 'trades', action: 'create' });
        console.log('Response:', grant);

        console.log('\n2. Check permission (should be true)');
        const check1 = await request('permissions.check', { apiKey, module: 'trades', action: 'create' });
        console.log('Response:', check1);

        console.log('\n3. List permissions');
        const list = await request('permissions.list', { apiKey });
        console.log('Response:', list);

        console.log('\n4. Revoke permission');
        const revoke = await request('permissions.revoke', { apiKey, module: 'trades', action: 'create' });
        console.log('Response:', revoke);

        console.log('\n5. Check permission (should be false)');
        const check2 = await request('permissions.check', { apiKey, module: 'trades', action: 'create' });
        console.log('Response:', check2);

        console.log('\nAll tests completed successfully!');

    } catch (error) {
        console.error('Test failed:', error.message);
    } finally {
        await nc.close();
    }
}

testPermissionsService();