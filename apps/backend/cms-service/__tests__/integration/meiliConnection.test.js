const { MeiliSearch } = require('meilisearch');
const meiliConfig = require('../../src/configs/meili.config');

describe('Meilisearch AWS EC2 Connection', () => {
  const host = process.env.MEILI_HOST;
  const apiKey = process.env.MEILI_API_KEY;

  if (!host) {
    test.skip('MEILI_HOST not set - skipping Meili connection test', () => {});
    return;
  }

  let client;

  beforeAll(() => {
    console.log(`Testing Meilisearch connection to: ${host}`);
    console.log(`Using API Key: ${apiKey ? '[SET]' : '[NOT SET]'}`);
    client = new MeiliSearch(meiliConfig);
  });

  test('should connect to Meilisearch and get health status', async () => {
    try {
      const health = await client.health();
      console.log('Meilisearch health response:', health);
      
      expect(health).toBeDefined();
      expect(health.status).toBe('available');
    } catch (error) {
      console.error('Health check failed:', error.message);
      throw error;
    }
  }, 15000);

  test('should get server version and stats', async () => {
    try {
      const version = await client.getVersion();
      console.log('Meilisearch version:', version);
      
      const stats = await client.getStats();
      console.log('Meilisearch stats:', stats);
      
      expect(version).toBeDefined();
      expect(version.pkgVersion).toBeDefined();
      expect(stats).toBeDefined();
      expect(stats.indexes).toBeDefined();
    } catch (error) {
      console.error('Version/Stats check failed:', error.message);
      throw error;
    }
  }, 15000);

  test('should be able to access posts index or confirm it needs creation', async () => {
    try {
      const index = client.index('posts');
      const indexInfo = await index.fetchInfo();
      console.log('Posts index info:', indexInfo);
      
      expect(indexInfo).toBeDefined();
      expect(indexInfo.uid).toBe('posts');
    } catch (error) {
      // Index might not exist yet, that's okay for a fresh instance
      if (error.message.includes('Index `posts` not found')) {
        console.log('✓ Posts index not found - will be created when first document is added');
        // This is expected behavior, not an error
      } else {
        console.error('Index access failed:', error.message);
        throw error;
      }
    }
  }, 15000);

  test('should perform basic search operations or confirm index creation needed', async () => {
    try {
      const index = client.index('posts');
      
      // Try to search (should work even if index is empty)
      const searchResults = await index.search('test', { limit: 1 });
      console.log('Search test results:', searchResults);
      
      expect(searchResults).toBeDefined();
      expect(searchResults.hits).toBeDefined();
      expect(Array.isArray(searchResults.hits)).toBe(true);
    } catch (error) {
      if (error.message.includes('Index `posts` not found')) {
        console.log('✓ Search skipped - Posts index will be created when first document is added');
        // This is expected behavior for a fresh instance
      } else {
        console.error('Search operation failed:', error.message);
        throw error;
      }
    }
  }, 15000);

  test('should test network connectivity and response time', async () => {
    const startTime = Date.now();
    
    try {
      await client.health();
      const responseTime = Date.now() - startTime;
      console.log(`Meilisearch response time: ${responseTime}ms`);
      
      // Expect reasonable response time (adjust based on your network)
      expect(responseTime).toBeLessThan(5000); // 5 seconds max
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`Connection failed after ${responseTime}ms:`, error.message);
      throw error;
    }
  }, 20000);
});
