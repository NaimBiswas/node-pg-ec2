const express = require('express');
const bodyParser = require('body-parser');
const routes = require('./routes');
const db = require('./config/database');
const MigrationRunner = require('./migrations/migration_runner');
const ProcedureLoader = require('./procedures/procedure_loader');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/', routes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected'
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err.stack);

    // Don't expose stack traces in production
    const error = process.env.NODE_ENV === 'production'
        ? 'Internal server error'
        : err.message;

    res.status(500).json({
        error: 'Something went wrong!',
        details: error
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'Route not found',
        message: `Cannot ${req.method} ${req.path}`
    });
});

// Initialize database on startup
const initializeDatabase = async () => {
    try {
        console.log('🚀 Starting database initialization...');

        // Run migrations
        const migrationRunner = new MigrationRunner();
        await migrationRunner.runMigrations();

        // Load stored procedures
        const procedureLoader = new ProcedureLoader();
        await procedureLoader.loadProcedures();

        console.log('✅ Database initialization complete');
    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
};

// Run initialization (but not in test environment)
if (process.env.NODE_ENV !== 'test') {
    initializeDatabase();
}

module.exports = app;