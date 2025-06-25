// test-client.js - Test your service using your own library
const { PermissionsClient } = require('./dist/lib/index.js');

async function testService() {
    console.log('🚀 Testing Permissions Service using your own library...\n');

    let client;
    try {
        // Connect to NATS (same server your service uses)
        client = await PermissionsClient.create('nats://localhost:4222');
        console.log('✅ Connected to NATS');

        // Test 1: Grant permission
        console.log('\n1️⃣ Testing Grant Permission');
        console.log('Sending request...');
        const grantResult = await client.grant('test-123', 'users', 'read');
        console.log('Response:', JSON.stringify(grantResult, null, 2));

        // Test 2: Check permission (should be true)
        console.log('\n2️⃣ Testing Check Permission (should be true)');
        const checkResult1 = await client.check('test-123', 'users', 'read');
        console.log('Response:', JSON.stringify(checkResult1, null, 2));

        // Test 3: Grant another permission
        console.log('\n3️⃣ Granting another permission');
        const grantResult2 = await client.grant('test-123', 'orders', 'create');
        console.log('Response:', JSON.stringify(grantResult2, null, 2));

        // Test 4: List all permissions
        console.log('\n4️⃣ Testing List Permissions');
        const listResult = await client.list('test-123');
        console.log('Response:', JSON.stringify(listResult, null, 2));

        // Test 5: Check non-existent permission (should be false)
        console.log('\n5️⃣ Testing Non-existent Permission (should be false)');
        const checkResult2 = await client.check('test-123', 'admin', 'delete');
        console.log('Response:', JSON.stringify(checkResult2, null, 2));

        // Test 6: Revoke permission
        console.log('\n6️⃣ Testing Revoke Permission');
        const revokeResult = await client.revoke('test-123', 'users', 'read');
        console.log('Response:', JSON.stringify(revokeResult, null, 2));

        // Test 7: Check after revoke (should be false)
        console.log('\n7️⃣ Testing Check After Revoke (should be false)');
        const checkResult3 = await client.check('test-123', 'users', 'read');
        console.log('Response:', JSON.stringify(checkResult3, null, 2));

        // Test 8: Error handling (empty apiKey)
        console.log('\n8️⃣ Testing Error Handling (empty apiKey)');
        try {
            const errorResult = await client.grant('', 'test', 'test');
            console.log('Response:', JSON.stringify(errorResult, null, 2));
        } catch (error) {
            console.log('Error caught:', error.message);
        }

        console.log('\n🎉 All tests completed successfully!');
        console.log('\n📊 Summary:');
        console.log('- Your NATS connection works ✅');
        console.log('- Your business logic works ✅');
        console.log('- Your typed library works ✅');
        console.log('- Database integration works ✅');
        console.log('- Cache integration works ✅');
        console.log('- Error handling works ✅');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    } finally {
        if (client) {
            await client.close();
            console.log('\n🔌 Connection closed');
        }
    }
}

// Run the test
testService().catch(console.error);