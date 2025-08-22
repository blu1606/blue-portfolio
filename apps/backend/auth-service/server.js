const app = require('./src/app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
    console.log(`Auth Service started on port ${PORT}`);
});

// Xử lý sự kiện SIGINT để tắt server một cách an toàn
process.on('SIGINT', () => {
    server.close(() => {
        console.log('Auth Service has been terminated.');
        process.exit(0);
    });
});