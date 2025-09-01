const { MeiliSearch } = require('meilisearch');
const meiliConfig = require('../../src/configs/meili.config');

describe('Meilisearch Index Sequential Operations Test', () => {
  const host = process.env.MEILI_HOST;

  if (!host) {
    test.skip('MEILI_HOST not set - skipping Meili index operations test', () => {});
    return;
  }

  let client;
  let index;
  const testIndexName = 'test-posts-sequential';

  beforeAll(async () => {
    client = new MeiliSearch(meiliConfig);
    index = client.index(testIndexName);
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

  test('should run all CRUD operations sequentially', async () => {
    // Step 1: Add a test document
    const document = {
      id: 'test-post-1',
      title: 'Test Post',
      content: 'This is a test post for Meilisearch',
      tags: ['test', 'search'],
      published: true
    };

    const addResult = await index.addDocuments([document]);
    console.log('Add document result:', addResult);
    
    expect(addResult).toBeDefined();
    expect(addResult.taskUid).toBeDefined();
    expect(addResult.indexUid).toBe(testIndexName);

    // Wait longer for indexing to complete
    console.log('Waiting for document to be indexed...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Step 2: Search for the document
    const searchResults = await index.search('Test Post', { limit: 10 });
    console.log('Search results:', searchResults);
    
    expect(searchResults).toBeDefined();
    expect(searchResults.hits).toBeDefined();
    expect(searchResults.hits.length).toBeGreaterThan(0);
    expect(searchResults.hits[0].title).toContain('Test Post');

    // Step 3: Get document by ID
    const retrievedDocument = await index.getDocument('test-post-1');
    console.log('Retrieved document:', retrievedDocument);
    
    expect(retrievedDocument).toBeDefined();
    expect(retrievedDocument.id).toBe('test-post-1');
    expect(retrievedDocument.title).toBe('Test Post');

    // Step 4: Update document
    const updatedDocument = {
      id: 'test-post-1',
      title: 'Updated Test Post',
      content: 'This is an updated test post for Meilisearch',
      tags: ['test', 'search', 'updated'],
      published: true
    };

    const updateResult = await index.updateDocuments([updatedDocument]);
    console.log('Update document result:', updateResult);
    
    expect(updateResult).toBeDefined();
    expect(updateResult.taskUid).toBeDefined();

    // Wait for update to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verify document was updated
    const updatedRetrievedDocument = await index.getDocument('test-post-1');
    expect(updatedRetrievedDocument.title).toBe('Updated Test Post');
    expect(updatedRetrievedDocument.tags).toContain('updated');

    // Step 5: Delete document
    const deleteResult = await index.deleteDocument('test-post-1');
    console.log('Delete document result:', deleteResult);
    
    expect(deleteResult).toBeDefined();
    expect(deleteResult.taskUid).toBeDefined();

    // Wait for deletion to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verify document was deleted
    try {
      await index.getDocument('test-post-1');
      // If we reach here, the document wasn't deleted
      expect(true).toBe(false); // Force test failure
    } catch (error) {
      expect(error.message).toContain('not found');
    }
  }, 30000);
});
