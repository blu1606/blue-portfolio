const { createClient } = require('redis');

class ConnectionTestService {
    constructor() {
        this.colors = {
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            reset: '\x1b[0m'
        };
    }

    log(color, message) {
        console.log(`${this.colors[color]}${message}${this.colors.reset}`);
    }

    async testRedis() {
        console.log('\n📡 Testing Redis Connection');
        console.log('----------------------------');
        
        try {
            const redisUrl = (process.env.REDIS_URL || 'redis://localhost:6379').trim();
            console.log('Redis URL:', redisUrl.replace(/:\/\/[^@]*@/, '://***:***@')); // Hide password in logs
            
            const client = createClient({
                url: redisUrl
            });
            
            // Connect to Redis
            await client.connect();
            this.log('green', '✅ Redis connection established');
            
            // Test basic operations
            await client.set('test_key', 'test_value', { EX: 10 }); // Expire in 10 seconds
            const value = await client.get('test_key');
            
            if (value === 'test_value') {
                this.log('green', '✅ Redis operations working');
            } else {
                this.log('yellow', '⚠️ Redis operations failed');
            }
            
            // Cleanup
            await client.del('test_key');
            await client.disconnect();
            
            return { success: true, service: 'Redis' };
            
        } catch (error) {
            this.log('red', `❌ Redis connection failed: ${error.message}`);
            console.error('Redis connection error:', error);
            return { success: false, service: 'Redis', error: error.message };
        }
    }

    async testMeiliSearch() {
        console.log('\n🔍 Testing MeiliSearch Connection');
        console.log('--------------------------------');
        
        const meiliHost = process.env.MEILI_HOST || 'http://localhost:7700';
        const meiliApiKey = process.env.MEILI_API_KEY;
        
        console.log('MeiliSearch Host:', meiliHost);
        console.log('API Key configured:', meiliApiKey ? 'Yes' : 'No');
        
        try {
            // Test health endpoint
            const healthResponse = await fetch(`${meiliHost}/health`, {
                headers: meiliApiKey ? { 'Authorization': `Bearer ${meiliApiKey}` } : {}
            });
            
            if (healthResponse.ok) {
                const health = await healthResponse.json();
                this.log('green', '✅ MeiliSearch is healthy');
                console.log('Health status:', health);
                
                // Test version endpoint
                const versionResponse = await fetch(`${meiliHost}/version`, {
                    headers: meiliApiKey ? { 'Authorization': `Bearer ${meiliApiKey}` } : {}
                });
                
                if (versionResponse.ok) {
                    const version = await versionResponse.json();
                    this.log('green', '✅ MeiliSearch version endpoint working');
                    console.log('Version:', version.pkgVersion);
                }
                
                return { success: true, service: 'MeiliSearch', version: health };
                
            } else {
                this.log('yellow', `⚠️ MeiliSearch health check failed: ${healthResponse.status}`);
                return { success: false, service: 'MeiliSearch', error: `HTTP ${healthResponse.status}` };
            }
            
        } catch (error) {
            this.log('red', `❌ MeiliSearch connection failed: ${error.message}`);
            console.error('MeiliSearch connection error:', error);
            return { success: false, service: 'MeiliSearch', error: error.message };
        }
    }

    async testSupabase() {
        console.log('\n🗄️ Testing Supabase Connection');
        console.log('-----------------------------');
        
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
            this.log('yellow', '⚠️ Supabase credentials not found in .env');
            return { success: false, service: 'Supabase', error: 'Missing credentials' };
        }
        
        console.log('Supabase URL:', supabaseUrl.substring(0, 30) + '...');
        
        try {
            // Test basic connection
            const response = await fetch(`${supabaseUrl}/rest/v1/`, {
                headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`
                }
            });
            
            if (response.ok) {
                this.log('green', '✅ Supabase connection successful');
                return { success: true, service: 'Supabase' };
            } else {
                this.log('yellow', `⚠️ Supabase connection failed: ${response.status}`);
                return { success: false, service: 'Supabase', error: `HTTP ${response.status}` };
            }
            
        } catch (error) {
            this.log('red', `❌ Supabase connection failed: ${error.message}`);
            console.error('Supabase connection error:', error);
            return { success: false, service: 'Supabase', error: error.message };
        }
    }

    async testAllConnections() {
        console.log('\n🔍 CMS Service - Connection Health Check');
        console.log('=========================================');
        
        const results = [];
        
        // Test all services in parallel
        const tests = await Promise.allSettled([
            this.testRedis(),
            this.testMeiliSearch(),
            this.testSupabase()
        ]);
        
        tests.forEach((test, index) => {
            if (test.status === 'fulfilled') {
                results.push(test.value);
            } else {
                const services = ['Redis', 'MeiliSearch', 'Supabase'];
                results.push({
                    success: false,
                    service: services[index],
                    error: test.reason?.message || 'Unknown error'
                });
            }
        });
        
        // Summary
        console.log('\n📋 Connection Summary');
        console.log('====================');
        
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);
        
        this.log('blue', `✅ Successful: ${successful.length}/${results.length} services`);
        
        if (successful.length > 0) {
            successful.forEach(result => {
                this.log('green', `  ✓ ${result.service}`);
            });
        }
        
        if (failed.length > 0) {
            this.log('red', `❌ Failed: ${failed.length} services`);
            failed.forEach(result => {
                this.log('red', `  ✗ ${result.service}: ${result.error}`);
            });
        }
        
        console.log(''); // Empty line for spacing
        
        return {
            total: results.length,
            successful: successful.length,
            failed: failed.length,
            results
        };
    }
}

module.exports = ConnectionTestService;
