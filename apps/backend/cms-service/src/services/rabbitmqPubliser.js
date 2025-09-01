// src/services/rabbitmqPublisher.js
const amqp = require('amqp-connection-manager');

const createRabbitMQPublisher = (amqpUrl) => {
    const connection = amqp.connect([amqpUrl]);
    const channelWrapper = connection.createChannel({
        json: true,
        setup: function(channel) {
            return channel.assertExchange('cms.events', 'topic', { durable: true });
        }
    });

    const publish = async (routingKey, payload) => {
        try {
            await channelWrapper.publish('cms.events', routingKey, payload, { persistent: true });
            console.log(`Published message to ${routingKey}`);
        } catch (error) {
            console.error(`Failed to publish message to ${routingKey}:`, error);
            throw error;
        }
    };

    return { publish };
};

module.exports = { createRabbitMQPublisher };