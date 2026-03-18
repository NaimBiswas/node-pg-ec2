const { Client } = require('pg');
require('dotenv').config();

class DatabaseInitializer {
    constructor() {
        // Connect to default 'postgres' database to check/create target database
        this.config = {
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: 'postgres', // Always connect to default postgres database first
            connectionTimeoutMillis: 5000
        };
        console.log('🔧 DatabaseInitializer configured with:', {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            targetDatabase: process.env.DB_DATABASE,
            database: process.env.DB_DATABASE

        });
        this.targetDatabase = process.env.DB_DATABASE;
    }

    /**
     * Main initialization method - checks if database exists and creates it if not
     */
    async initialize() {
        const client = new Client(this.config);

        try {
            console.log('🔍 Checking if database exists...');
            await client.connect();

            // Check if database exists
            const exists = await this.databaseExists(client);

            if (!exists) {
                console.log(`📦 Database "${this.targetDatabase}" does not exist. Creating...`);
                await this.createDatabase(client);
                console.log(`✅ Database "${this.targetDatabase}" created successfully`);
            } else {
                console.log(`✅ Database "${this.targetDatabase}" already exists`);
            }

            console.log('🎉 Database initialization completed');
            return { created: !exists, database: this.targetDatabase };

        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        } finally {
            await client.end();
        }
    }

    /**
     * Check if target database exists
     */
    async databaseExists(client) {
        try {
            const query = `
        SELECT 1 
        FROM pg_database 
        WHERE datname = $1
      `;

            const result = await client.query(query, [this.targetDatabase]);
            return result.rows.length > 0;

        } catch (error) {
            console.error('Error checking database existence:', error);
            throw error;
        }
    }

    /**
     * Create the target database
     */
    async createDatabase(client) {
        try {
            // Use parameterized query to safely create database name
            // Note: PostgreSQL doesn't allow parameterized database names in CREATE DATABASE
            // So we need to sanitize the input
            const sanitizedDbName = this.sanitizeDatabaseName(this.targetDatabase);

            if (!sanitizedDbName) {
                throw new Error('Invalid database name');
            }

            // Create database with proper settings
            const query = `
        CREATE DATABASE ${sanitizedDbName}
        ENCODING 'UTF8'
        LC_COLLATE 'en_US.UTF-8'
        LC_CTYPE 'en_US.UTF-8'
        TEMPLATE template0
      `;

            await client.query(query);
            console.log(`✅ Database ${sanitizedDbName} created with UTF8 encoding`);

        } catch (error) {
            // Handle case where database might have been created by another process
            if (error.code === '42P04') { // Duplicate database error
                console.log('Database was created by another process, continuing...');
                return;
            }

            console.error('Error creating database:', error);
            throw error;
        }
    }

    /**
     * Sanitize database name to prevent SQL injection
     */
    sanitizeDatabaseName(dbName) {
        if (!dbName || typeof dbName !== 'string') {
            return null;
        }

        // Only allow alphanumeric and underscore
        const sanitized = dbName.replace(/[^a-zA-Z0-9_]/g, '');

        // Database name must start with a letter or underscore
        if (!/^[a-zA-Z_]/.test(sanitized)) {
            return null;
        }

        // PostgreSQL max identifier length is 63 bytes
        return sanitized.slice(0, 63);
    }

    /**
     * Simple database existence check (can be used without creating instance)
     */
    static async checkDatabaseExists() {
        const client = new Client({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: 'postgres'
        });

        try {
            await client.connect();
            const result = await client.query(
                'SELECT 1 FROM pg_database WHERE datname = $1',
                [process.env.DB_DATABASE]
            );
            return result.rows.length > 0;
        } catch (error) {
            console.error('Error checking database:', error);
            return false;
        } finally {
            await client.end();
        }
    }

    /**
     * Drop database (useful for testing/development)
     */
    async dropDatabase(confirm = false) {
        if (!confirm || process.env.NODE_ENV === 'production') {
            console.log('⚠️  Database drop skipped - confirmation required or production environment');
            return false;
        }

        const client = new Client(this.config);

        try {
            await client.connect();

            // Terminate all connections to the database
            await client.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1
      `, [this.targetDatabase]);

            // Drop the database
            await client.query(`DROP DATABASE IF EXISTS ${this.sanitizeDatabaseName(this.targetDatabase)}`);

            console.log(`🗑️  Database "${this.targetDatabase}" dropped successfully`);
            return true;

        } catch (error) {
            console.error('Error dropping database:', error);
            throw error;
        } finally {
            await client.end();
        }
    }
}

// If this file is run directly, execute the initialization
if (require.main === module) {
    const initializer = new DatabaseInitializer();
    initializer.initialize()
        .then((result) => {
            console.log('Initialization result:', result);
            process.exit(0);
        })
        .catch((error) => {
            console.error('Initialization failed:', error);
            process.exit(1);
        });
}

module.exports = DatabaseInitializer;