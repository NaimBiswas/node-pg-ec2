const db = require('../config/database');

class User {
    constructor(data = {}) {
        this.id = data.id;
        this.name = data.name;
        this.email = data.email;
        this.age = data.age;
        this.is_active = data.is_active;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Create user using stored procedure
    static async create(userData) {
        try {
            const { name, email, age = null } = userData;

            // Using stored procedure
            await db.executeProcedure('create_user', [name, email, age]);

            // Fetch the created user
            const result = await db.query(
                'SELECT * FROM users WHERE email = $1',
                [email]
            );

            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Direct insert as alternative
    static async createDirect(userData) {
        const { name, email, age } = userData;
        const query = `
      INSERT INTO users (name, email, age)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

        try {
            const result = await db.query(query, [name, email, age]);
            return new User(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    // Find user with posts using function
    static async findWithPosts(userId) {
        try {
            const result = await db.executeFunction('get_user_with_posts', [userId]);

            if (result.rows.length === 0) {
                return null;
            }

            const userData = {
                id: result.rows[0].user_id,
                name: result.rows[0].user_name,
                email: result.rows[0].user_email,
                posts: result.rows
                    .filter(row => row.post_id)
                    .map(row => ({
                        id: row.post_id,
                        title: row.post_title,
                        content: row.post_content,
                        status: row.post_status,
                        views: row.post_views,
                        created_at: row.post_created_at
                    }))
            };

            return userData;
        } catch (error) {
            throw error;
        }
    }

    // Get active users with post counts
    static async getActiveUsersWithPostCounts() {
        try {
            const result = await db.executeFunction('get_active_users_with_post_count');
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    // Find all users
    static async findAll(limit = 10, offset = 0) {
        const query = `
      SELECT * FROM users 
      ORDER BY created_at DESC 
      LIMIT $1 OFFSET $2
    `;

        try {
            const result = await db.query(query, [limit, offset]);
            return result.rows.map(row => new User(row));
        } catch (error) {
            throw error;
        }
    }

    // Find by ID
    static async findById(id) {
        const query = 'SELECT * FROM users WHERE id = $1';

        try {
            const result = await db.query(query, [id]);
            return result.rows[0] ? new User(result.rows[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Update user
    async update(updateData) {
        const setClause = Object.keys(updateData)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');

        const values = [this.id, ...Object.values(updateData)];

        const query = `
      UPDATE users 
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;

        try {
            const result = await db.query(query, values);
            Object.assign(this, result.rows[0]);
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Delete user
    async delete() {
        const query = 'DELETE FROM users WHERE id = $1 RETURNING id';

        try {
            const result = await db.query(query, [this.id]);
            return result.rows[0] ? true : false;
        } catch (error) {
            throw error;
        }
    }

    // Get user posts
    async getPosts() {
        const query = `
      SELECT * FROM posts 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;

        try {
            const result = await db.query(query, [this.id]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User;