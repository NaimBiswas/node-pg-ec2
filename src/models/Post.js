const db = require('../config/database');

class Post {
    constructor(data = {}) {
        this.id = data.id;
        this.title = data.title;
        this.content = data.content;
        this.user_id = data.user_id;
        this.status = data.status;
        this.views = data.views;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    static async create(postData) {
        const { title, content, user_id, status = 'draft' } = postData;

        const query = `
      INSERT INTO posts (title, content, user_id, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

        try {
            const result = await db.query(query, [title, content, user_id, status]);
            return new Post(result.rows[0]);
        } catch (error) {
            throw error;
        }
    }

    static async findPublished(limit = 10, offset = 0) {
        const query = `
      SELECT p.*, u.name as author_name
      FROM posts p
      JOIN users u ON p.user_id = u.id
      WHERE p.status = 'published'
      ORDER BY p.created_at DESC
      LIMIT $1 OFFSET $2
    `;

        try {
            const result = await db.query(query, [limit, offset]);
            return result.rows;
        } catch (error) {
            throw error;
        }
    }

    async incrementViews() {
        try {
            await db.executeFunction('increment_post_views', [this.id]);
            this.views += 1;
            return this;
        } catch (error) {
            throw error;
        }
    }

    async update(updateData) {
        const setClause = Object.keys(updateData)
            .map((key, index) => `${key} = $${index + 2}`)
            .join(', ');

        const values = [this.id, ...Object.values(updateData)];

        const query = `
      UPDATE posts 
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
}

module.exports = Post;