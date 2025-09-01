// /cms-service/server.js
const config = require('./src/configs/env.config');
const app = require('./src/app');
const { testConnections } = require('./src/bootstrap');

const PORT = config.port;

const server = app.listen(PORT, async () => {
    console.log(`CMS Service started on port ${PORT}`);
    console.log(`Environment: ${config.nodeEnv}`);
    
    // Test all connections after server starts
    try {
        const { setupContainer } = require('./src/bootstrap');
        const container = setupContainer();
        const connectionResults = await testConnections(container);
        
        if (connectionResults.failed > 0) {
            console.log('\n⚠️  Warning: Some services are not available but server is still running');
        } else {
            console.log('\n🎉 All services connected successfully!');
        }
    } catch (error) {
        console.error('\n❌ Connection testing failed:', error.message);
        console.log('Server is still running but some features may not work properly');
    }
});

process.on('SIGINT', () => {
    console.log('Received SIGINT, shutting down gracefully...');
    server.close(() => {
        console.log('CMS Service has been terminated.');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('CMS Service has been terminated.');
        process.exit(0);
    });
});