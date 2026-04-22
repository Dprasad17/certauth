async function testLocalConnection() {
    console.log('--- BACKEND CONNECTIVITY TEST ---');
    // Using global fetch (available in Node 18+)
    const urls = [
        'http://localhost:5000/api/identity/vault/durgacit1704@gmail.com',
        'http://127.0.0.1:5000/api/identity/vault/durgacit1704@gmail.com'
    ];

    for (const url of urls) {
        try {
            console.log(`Testing: ${url}...`);
            const res = await fetch(url);
            console.log(`[Status] ${res.status} ${res.statusText}`);
            if (res.ok) {
                const data = await res.json();
                console.log(`[Data] Found ${data.authenticators?.length || 0} authenticators.`);
            }
        } catch (e) {
            console.error(`[Error] Failed to reach ${url}:`, e.message);
        }
    }
    console.log('--- TEST COMPLETE ---');
}

testLocalConnection();
