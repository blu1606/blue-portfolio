// /cms-service/server.js
const app = require('./src/app');

const PORT = process.env.PORT || 3001; // Sử dụng cổng khác với Auth Service

const server = app.listen(PORT, () => {
    console.log(`CMS Service started on port ${PORT}`);
});

process.on('SIGINT', () => {
    server.close(() => {
        console.log('CMS Service has been terminated.');
        process.exit(0);
    });
});