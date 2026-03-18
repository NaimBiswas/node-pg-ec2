const app = require('./src/app');
require('dotenv').config();

const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🚀 Server is running                 ║
╠════════════════════════════════════════╣
║   URL: http://localhost:${PORT}          ║
║   Environment: ${process.env.NODE_ENV || 'development'}        ║
║   Database: PostgreSQL                 ║
╚════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('📥 SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('✅ HTTP server closed');
        // Close database connection
        require('./src/config/database').close();
    });
});

process.on('SIGINT', () => {
    console.log('📥 SIGINT signal received: closing HTTP server');
    server.close(() => {
        console.log('✅ HTTP server closed');
        // Close database connection
        require('./src/config/database').close();
        process.exit(0);
    });
});

module.exports = server;