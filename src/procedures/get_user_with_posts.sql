-- Function: Get user with their posts
CREATE OR REPLACE FUNCTION get_user_with_posts(p_user_id INTEGER)
RETURNS TABLE (
    user_id INTEGER,
    user_name VARCHAR,
    user_email VARCHAR,
    post_id INTEGER,
    post_title VARCHAR,
    post_content TEXT,
    post_status VARCHAR,
    post_views INTEGER,
    post_created_at TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        p.id,
        p.title,
        p.content,
        p.status,
        p.views,
        p.created_at
    FROM users u
    LEFT JOIN posts p ON u.id = p.user_id
    WHERE u.id = p_user_id
    ORDER BY p.created_at DESC;
END;
$$;

-- Function: Get active users with post count
CREATE OR REPLACE FUNCTION get_active_users_with_post_count()
RETURNS TABLE (
    user_id INTEGER,
    user_name VARCHAR,
    user_email VARCHAR,
    post_count BIGINT,
    last_post_date TIMESTAMP
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(p.id) as post_count,
        MAX(p.created_at) as last_post_date
    FROM users u
    LEFT JOIN posts p ON u.id = p.user_id
    WHERE u.is_active = true
    GROUP BY u.id, u.name, u.email
    ORDER BY post_count DESC;
END;
$$;