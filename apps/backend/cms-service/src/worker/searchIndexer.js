// src/worker/searchIndexer.js
require('dotenv').config();
const amqp = require('amqp-connection-manager');
const { MeiliSearch } = require('meilisearch');
const { setupContainer } = require('../bootstrap');
const { getPostUseCase } = require('../usecases/post/getPost');

// Khởi tạo container để truy cập repositories
const container = setupContainer();
const postRepository = container.get('postRepository');
const getPostById = postRepository.findById;

// Cấu hình Meilisearch
const meili = new MeiliSearch({
    host: process.env.MEILI_HOST,
    apiKey: process.env.MEILI_API_KEY
});
const index = meili.index('posts');

// Kết nối tới RabbitMQ
const amqpUrl = process.env.RABBITMQ_URL;
const connection = amqp.connect([amqpUrl]);

connection.on('connect', () => console.log('Connected to RabbitMQ!'));
connection.on('disconnect', err => console.log('Disconnected.', err));

const channelWrapper = connection.createChannel({
    json: true,
    setup: function(channel) {
        return Promise.all([
            channel.assertExchange('cms.events', 'topic', { durable: true }),
            channel.assertQueue('search.indexer', { durable: true }),
            channel.bindQueue('search.indexer', 'cms.events', 'posts.*')
        ]);
    }
});

channelWrapper.consume('search.indexer', async (message) => {
    if (!message) return;

    const { eventType, entityId } = JSON.parse(message.content.toString());
    console.log(`Received event: ${eventType} for entityId: ${entityId}`);

    try {
        switch (eventType) {
            case 'posts.created':
            case 'posts.updated':
                // Lấy dữ liệu mới nhất từ DB
                const post = await getPostById(entityId);
                if (post) {
                    // Cập nhật hoặc thêm tài liệu vào Meilisearch
                    await index.addDocuments([post], { primaryKey: 'id' });
                    console.log(`Successfully indexed post: ${post.id}`);
                }
                break;
            case 'posts.deleted':
                await index.deleteDocument(entityId);
                console.log(`Successfully deleted post: ${entityId}`);
                break;
        }
        // Xác nhận đã xử lý tin nhắn thành công
        channelWrapper.ack(message);
    } catch (error) {
        console.error(`Failed to process event ${eventType} for ${entityId}:`, error);
        // Từ chối tin nhắn và gửi lại vào queue
        channelWrapper.nack(message, false, true);
    }
});