-- Stored Procedure: Create user with validation
CREATE OR REPLACE PROCEDURE create_user(
    p_name VARCHAR,
    p_email VARCHAR,
    p_age INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    -- Validate email format
    IF p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
        RAISE EXCEPTION 'Invalid email format';
    END IF;

    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM users WHERE email = p_email) THEN
        RAISE EXCEPTION 'Email already exists';
    END IF;

    -- Insert user
    INSERT INTO users (name, email, age)
    VALUES (p_name, p_email, p_age)
    RETURNING id INTO v_user_id;

    -- Log the action
    RAISE NOTICE 'User created with ID: %', v_user_id;
END;
$$;