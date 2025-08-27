const { MeiliSearch } = require('meilisearch');
const meiliConfig = require('../../src/configs/meili.config');

describe('Meilisearch Index Operations Test', () => {
  const host = process.env.MEILI_HOST;

  if (!host) {
    test.skip('MEILI_HOST not set - skipping Meili index operations test', () => {});
    return;
  }

  let client;
  const testIndexName = 'test-posts';

  beforeAll(() => {
    client = new MeiliSearch(meiliConfig);
  });

  afterAll(async () => {
    // Cleanup - delete test index
    try {
      await client.deleteIndex(testIndexName);
      console.log(`✓ Cleaned up test index: ${testIndexName}`);
    } catch (error) {
      // Index might not exist, that's okay
      console.log(`Test index cleanup: ${error.message}`);
    }
  });

  test('should create index and add document', async () => {
    const testDocument = {
      id: 'test-post-1',
      title: 'Test Post from Node.js',
      content_html: '<p>This is a test post created from Node.js integration test</p>',
      slug: 'test-post-nodejs',
      author_id: 'test-author',
      created_at: new Date().toISOString(),
      is_published: true
    };

    // Create index
    const index = client.index(testIndexName);
    
    // Add document
    const addResult = await index.addDocuments([testDocument]);
    console.log('Add document result:', addResult);
    
    expect(addResult).toBeDefined();
    expect(addResult.taskUid).toBeDefined();

    // Wait for indexing to complete (sleep instead of waitForTask)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify document was added
    const indexInfo = await index.fetchInfo();
    console.log('Index info after adding document:', indexInfo);
    
    expect(indexInfo.uid).toBe(testIndexName);
  }, 30000);

  test('should search for the added document', async () => {
    const index = client.index(testIndexName);
    
    // Search for our test document
    const searchResults = await index.search('Test Post', { limit: 10 });
    console.log('Search results:', searchResults);
    
    expect(searchResults).toBeDefined();
    expect(searchResults.hits).toBeDefined();
    expect(searchResults.hits.length).toBeGreaterThan(0);
    expect(searchResults.hits[0].title).toContain('Test Post');
  }, 15000);

  test('should get document by ID', async () => {
    const index = client.index(testIndexName);
    
    // Get document by ID
    const document = await index.getDocument('test-post-1');
    console.log('Retrieved document:', document);
    
    expect(document).toBeDefined();
    expect(document.id).toBe('test-post-1');
    expect(document.title).toBe('Test Post from Node.js');
  }, 15000);

  test('should update document', async () => {
    const index = client.index(testIndexName);
    
    const updatedDocument = {
      id: 'test-post-1',
      title: 'Updated Test Post from Node.js',
      content_html: '<p>This is an updated test post</p>'
    };
    
    // Update document
    const updateResult = await index.updateDocuments([updatedDocument]);
    console.log('Update document result:', updateResult);
    
    expect(updateResult).toBeDefined();
    expect(updateResult.taskUid).toBeDefined();

    // Wait for update to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify document was updated
    const document = await index.getDocument('test-post-1');
    expect(document.title).toBe('Updated Test Post from Node.js');
  }, 30000);

  test('should delete document', async () => {
    const index = client.index(testIndexName);
    
    // Delete document
    const deleteResult = await index.deleteDocument('test-post-1');
    console.log('Delete document result:', deleteResult);
    
    expect(deleteResult).toBeDefined();
    expect(deleteResult.taskUid).toBeDefined();

    // Wait for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify document was deleted
    try {
      await index.getDocument('test-post-1');
      fail('Document should have been deleted');
    } catch (error) {
      expect(error.message).toContain('not found');
    }
  }, 30000);
});
