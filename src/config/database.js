const { Pool } = require('pg');
require('dotenv').config();

class Database {
    constructor() {
        this.pool = new Pool({
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            database: process.env.DB_DATABASE,
            max: 20, // maximum number of clients in the pool
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        this.testConnection();
    }

    async testConnection() {
        try {
            const client = await this.pool.connect();
            console.log('✅ Database connected successfully');
            client.release();
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            // process.exit(1);
        }
    }

    async query(text, params) {
        const start = Date.now();
        try {
            const res = await this.pool.query(text, params);
            const duration = Date.now() - start;
            console.log('Executed query:', { duration, rows: res.rowCount });
            return res;
        } catch (error) {
            console.error('Query error:', { text, error: error.message });
            throw error;
        }
    }

    async executeFunction(funcName, params = []) {
        const placeholders = params.map((_, i) => `$${i + 1}`).join(',');
        const query = `SELECT * FROM ${funcName}(${placeholders})`;
        return this.query(query, params);
    }

    async executeProcedure(procName, params = []) {
        const placeholders = params.map((_, i) => `$${i + 1}`).join(',');
        const query = `CALL ${procName}(${placeholders})`;
        return this.query(query, params);
    }

    async close() {
        await this.pool.end();
        console.log('Database connection closed');
    }
}

module.exports = new Database();