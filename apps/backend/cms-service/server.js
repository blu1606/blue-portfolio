// /cms-service/server.js
const config = require('./src/configs/env.config');
const app = require('./src/app');

const PORT = config.port;

const server = app.listen(PORT, () => {
    console.log(`CMS Service started on port ${PORT}`);
    console.log(`Environment: ${config.nodeEnv}`);
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