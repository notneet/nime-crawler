#!/usr/bin/env node

/**
 * Test script to verify RabbitMQ message pattern handling
 * This script sends test messages to verify the crawler microservice can handle them properly
 */

const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const { MESSAGE_PATTERNS, CRAWL_JOB_TYPES } = require('./constants');

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
const QUEUE_NAME = 'crawl.queue';

async function sendTestMessages() {
    try {
        console.log('🔌 Connecting to RabbitMQ...');
        const connection = await amqp.connect(RABBITMQ_URL);
        const channel = await connection.createChannel();

        // Ensure queue exists
        await channel.assertQueue(QUEUE_NAME, { durable: true });

        console.log('📨 Sending test messages...\n');

        // Test message 1: read-thread pattern
        const readThreadMessage = {
            pattern: MESSAGE_PATTERNS.READ_THREAD,
            data: {
                jobID: uuidv4(),
                endPoint: 'https://example.com/api/anime/list'
            }
        };

        console.log('1. Sending read-thread message:', JSON.stringify(readThreadMessage, null, 2));
        await channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(readThreadMessage)), {
            persistent: true,
            messageId: readThreadMessage.data.jobID
        });

        // Test message 2: crawl-job pattern
        const crawlJobMessage = {
            pattern: MESSAGE_PATTERNS.CRAWL_JOB,
            data: {
                jobID: uuidv4(),
                jobType: CRAWL_JOB_TYPES.HEALTH_CHECK,
                sourceId: 1,
                parameters: {}
            }
        };

        console.log('2. Sending crawl-job message:', JSON.stringify(crawlJobMessage, null, 2));
        await channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(crawlJobMessage)), {
            persistent: true,
            messageId: crawlJobMessage.data.jobID
        });

        // Test message 3: health-check pattern
        const healthCheckMessage = {
            pattern: MESSAGE_PATTERNS.HEALTH_CHECK,
            data: {
                service: 'test'
            }
        };

        console.log('3. Sending health-check message:', JSON.stringify(healthCheckMessage, null, 2));
        await channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(healthCheckMessage)), {
            persistent: true,
            messageId: uuidv4()
        });

        // Test message 4: unsupported pattern
        const unsupportedMessage = {
            pattern: 'unknown-pattern',
            data: {
                jobID: uuidv4(),
                test: 'data'
            }
        };

        console.log('4. Sending unsupported pattern message:', JSON.stringify(unsupportedMessage, null, 2));
        await channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(unsupportedMessage)), {
            persistent: true,
            messageId: unsupportedMessage.data.jobID
        });

        console.log('\n✅ All test messages sent successfully!');
        console.log('📋 Check your crawler microservice logs to see how messages are processed.');
        console.log('🔍 The unsupported pattern should be handled gracefully without causing errors.');

        await channel.close();
        await connection.close();

    } catch (error) {
        console.error('❌ Error sending test messages:', error);
        process.exit(1);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    sendTestMessages()
        .then(() => {
            console.log('\n🎉 Test completed! Exiting...');
            process.exit(0);
        })
        .catch(error => {
            console.error('💥 Test failed:', error);
            process.exit(1);
        });
}

module.exports = { sendTestMessages };