const { Client } = require('pg');
require('dotenv').config();

class DatabaseInitializer {
    constructor() {
        this.config = {
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: 'postgres',
            connectionTimeoutMillis: 5000
        };

        this.targetDatabase = process.env.DB_DATABASE;
    }

    /**
     * Main initialization method - checks if database exists and creates it if not
     */   async initialize() {
        const client = new Client(this.config);

        try {
            console.log('🔍 Checking if database exists...');
            await client.connect();

            const exists = await this.databaseExists(client);

            if (!exists) {
                console.log(`📦 Database "${this.targetDatabase}" does not exist. Creating...`);
                await this.createDatabase(client);
                console.log(`✅ Database "${this.targetDatabase}" created successfully`);
            } else {
                console.log(`✅ Database "${this.targetDatabase}" already exists`);
            }

            return { created: !exists, database: this.targetDatabase };

        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        } finally {
            await client.end();
        }
    }

    async databaseExists(client) {
        const result = await client.query(
            'SELECT 1 FROM pg_database WHERE datname = $1',
            [this.targetDatabase]
        );
        return result.rows.length > 0;
    }

    async createDatabase(client) {
        const sanitizedDbName = this.targetDatabase.replace(/[^a-zA-Z0-9_]/g, '');

        try {
            // Simple creation without locale specification
            await client.query(`CREATE DATABASE ${sanitizedDbName}`);
        } catch (error) {
            if (error.code === '42P04') {
                console.log('Database already exists (created by another process)');
                return;
            }
            throw error;
        }
    }
}

module.exports = DatabaseInitializer;