const fs = require('fs-extra');
const path = require('path');
const db = require('../config/database');

class MigrationRunner {
    constructor() {
        this.migrationsTable = 'migrations';
        this.migrationsPath = path.join(__dirname);
    }

    async createMigrationsTable() {
        const query = `
      CREATE TABLE IF NOT EXISTS ${this.migrationsTable} (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
        await db.query(query);
        console.log('✅ Migrations table ready');
    }

    async getExecutedMigrations() {
        const result = await db.query(
            `SELECT name FROM ${this.migrationsTable} ORDER BY id`
        );
        return result.rows.map(row => row.name);
    }

    async runMigrations() {
        try {
            await this.createMigrationsTable();

            const executed = await this.getExecutedMigrations();
            const files = await fs.readdir(this.migrationsPath);

            // Filter SQL files and sort them
            const migrationFiles = files
                .filter(f => f.endsWith('.sql') && !executed.includes(f))
                .sort();

            if (migrationFiles.length === 0) {
                console.log('📦 No new migrations to run');
                return;
            }

            console.log(`🔄 Running ${migrationFiles.length} migrations...`);

            for (const file of migrationFiles) {
                console.log(`📝 Running migration: ${file}`);

                const filePath = path.join(this.migrationsPath, file);
                const sql = await fs.readFile(filePath, 'utf8');

                // Run migration in transaction
                await db.query('BEGIN');
                try {
                    await db.query(sql);
                    await db.query(
                        `INSERT INTO ${this.migrationsTable} (name) VALUES ($1)`,
                        [file]
                    );
                    await db.query('COMMIT');
                    console.log(`✅ Migration ${file} completed`);
                } catch (error) {
                    await db.query('ROLLBACK');
                    throw error;
                }
            }

            console.log('✅ All migrations completed successfully');
        } catch (error) {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        }
    }
}

// Run migrations if this file is executed directly
if (require.main === module) {
    const runner = new MigrationRunner();
    runner.runMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = MigrationRunner;