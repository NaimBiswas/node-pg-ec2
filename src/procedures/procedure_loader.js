const fs = require('fs-extra');
const path = require('path');
const db = require('../config/database');

class ProcedureLoader {
    constructor() {
        this.proceduresPath = path.join(__dirname);
    }

    async loadProcedures() {
        try {
            const files = await fs.readdir(this.proceduresPath);
            const procedureFiles = files.filter(f => f.endsWith('.sql'));

            console.log(`🔄 Loading ${procedureFiles.length} stored procedures/functions...`);

            for (const file of procedureFiles) {
                console.log(`📝 Loading: ${file}`);

                const filePath = path.join(this.proceduresPath, file);
                const sql = await fs.readFile(filePath, 'utf8');

                // Split multiple statements if present
                const statements = sql.split(';').filter(s => s.trim());

                for (const statement of statements) {
                    if (statement.trim()) {
                        await db.query(statement);
                    }
                }

                console.log(`✅ Loaded ${file}`);
            }

            console.log('✅ All stored procedures loaded successfully');
        } catch (error) {
            console.error('❌ Failed to load procedures:', error);
            throw error;
        }
    }
}

// Load procedures if this file is executed directly
if (require.main === module) {
    const loader = new ProcedureLoader();
    loader.loadProcedures()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = ProcedureLoader;