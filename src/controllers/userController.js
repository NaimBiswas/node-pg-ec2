const User = require('../models/User');
const Post = require('../models/Post');

const userController = {
    // GET / - Home route with API info
    getHome: (req, res) => {
        res.json({
            name: 'Node.js PostgreSQL API',
            version: '2.0.0',
            description: 'Advanced API with migrations and stored procedures',
            endpoints: {
                // Basic endpoints
                home: {
                    method: 'GET',
                    path: '/',
                    description: 'API information'
                },
                createUser: {
                    method: 'POST',
                    path: '/users',
                    description: 'Create a new user',
                    body: {
                        name: 'string (required)',
                        email: 'string (required)',
                        age: 'number (optional)'
                    }
                },
                getUsers: {
                    method: 'GET',
                    path: '/users',
                    description: 'Get users (returns first 2)',
                    query: {
                        limit: 'number (optional, default: 2)',
                        offset: 'number (optional, default: 0)'
                    }
                },

                // Advanced endpoints
                getUserWithPosts: {
                    method: 'GET',
                    path: '/users/:id/posts',
                    description: 'Get user with their posts using stored function'
                },
                createPost: {
                    method: 'POST',
                    path: '/posts',
                    description: 'Create a new post',
                    body: {
                        title: 'string (required)',
                        content: 'string (required)',
                        user_id: 'number (required)',
                        status: 'string (optional, default: draft)'
                    }
                },
                getPublishedPosts: {
                    method: 'GET',
                    path: '/posts/published',
                    description: 'Get published posts'
                },
                getActiveUsers: {
                    method: 'GET',
                    path: '/users/active/stats',
                    description: 'Get active users with post counts using stored function'
                }
            }
        });
    },

    // POST /users - Create a new user
    createUser: async (req, res) => {
        try {
            const { name, email, age } = req.body;

            // Validate input
            if (!name || !email) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: 'Name and email are required'
                });
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: 'Invalid email format'
                });
            }

            // Create user using stored procedure
            const user = await User.create({ name, email, age });

            res.status(201).json({
                success: true,
                message: 'User created successfully using stored procedure',
                data: user
            });
        } catch (error) {
            console.error('Error creating user:', error);

            // Handle specific database errors
            if (error.message.includes('Email already exists')) {
                return res.status(409).json({
                    error: 'Duplicate entry',
                    details: 'Email already exists'
                });
            }

            res.status(500).json({
                error: 'Failed to create user',
                details: error.message
            });
        }
    },

    // GET /users - Retrieve users from database (returns first 2)
    getUsers: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 2;
            const offset = parseInt(req.query.offset) || 0;

            const users = await User.findAll(limit, offset);

            // Get total count for pagination info
            const totalCount = await User.findAll(1000, 0);

            res.json({
                success: true,
                message: users.length > 0 ? 'Users retrieved successfully' : 'No users found',
                data: {
                    users: users,
                    pagination: {
                        total: totalCount.length,
                        returned: users.length,
                        limit: limit,
                        offset: offset
                    }
                }
            });
        } catch (error) {
            console.error('Error retrieving users:', error);
            res.status(500).json({
                error: 'Failed to retrieve users',
                details: error.message
            });
        }
    },

    // GET /users/:id/posts - Get user with their posts using stored function
    getUserWithPosts: async (req, res) => {
        try {
            const userId = parseInt(req.params.id);

            if (isNaN(userId)) {
                return res.status(400).json({
                    error: 'Invalid user ID'
                });
            }

            const userData = await User.findWithPosts(userId);

            if (!userData) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                message: 'User data retrieved using stored function',
                data: userData
            });
        } catch (error) {
            console.error('Error retrieving user with posts:', error);
            res.status(500).json({
                error: 'Failed to retrieve user data',
                details: error.message
            });
        }
    },

    // POST /posts - Create a new post
    createPost: async (req, res) => {
        try {
            const { title, content, user_id, status } = req.body;

            // Validate input
            if (!title || !content || !user_id) {
                return res.status(400).json({
                    error: 'Validation failed',
                    details: 'Title, content, and user_id are required'
                });
            }

            // Check if user exists
            const user = await User.findById(user_id);
            if (!user) {
                return res.status(404).json({
                    error: 'User not found'
                });
            }

            const post = await Post.create({ title, content, user_id, status });

            res.status(201).json({
                success: true,
                message: 'Post created successfully',
                data: post
            });
        } catch (error) {
            console.error('Error creating post:', error);
            res.status(500).json({
                error: 'Failed to create post',
                details: error.message
            });
        }
    },

    // GET /posts/published - Get published posts
    getPublishedPosts: async (req, res) => {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const offset = parseInt(req.query.offset) || 0;

            const posts = await Post.findPublished(limit, offset);

            res.json({
                success: true,
                message: posts.length > 0 ? 'Published posts retrieved' : 'No published posts found',
                data: {
                    posts: posts,
                    count: posts.length
                }
            });
        } catch (error) {
            console.error('Error retrieving published posts:', error);
            res.status(500).json({
                error: 'Failed to retrieve posts',
                details: error.message
            });
        }
    },

    // GET /users/active/stats - Get active users with post counts using stored function
    getActiveUsersWithStats: async (req, res) => {
        try {
            const activeUsers = await User.getActiveUsersWithPostCounts();

            res.json({
                success: true,
                message: 'Active users statistics retrieved using stored function',
                data: {
                    active_users: activeUsers,
                    total_active: activeUsers.length
                }
            });
        } catch (error) {
            console.error('Error retrieving active users stats:', error);
            res.status(500).json({
                error: 'Failed to retrieve active users statistics',
                details: error.message
            });
        }
    },

    // POST /posts/:id/view - Increment post views
    incrementPostViews: async (req, res) => {
        try {
            const postId = parseInt(req.params.id);

            // In a real app, you'd fetch the post first
            const post = new Post({ id: postId });
            await post.incrementViews();

            res.json({
                success: true,
                message: 'Post view incremented using stored function',
                data: { post_id: postId, views: post.views + 1 }
            });
        } catch (error) {
            console.error('Error incrementing post views:', error);
            res.status(500).json({
                error: 'Failed to increment post views',
                details: error.message
            });
        }
    }
};

module.exports = userController;