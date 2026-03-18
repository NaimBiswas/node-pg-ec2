const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Basic Routes (as requested)
router.get('/', userController.getHome);                    // Route 1: Home
router.post('/users', userController.createUser);           // Route 2: Write to DB
router.get('/users', userController.getUsers);              // Route 3: Read from DB (returns 2 records)

// Advanced Routes (showing stored procedure usage)
router.get('/users/:id/posts', userController.getUserWithPosts);
router.post('/posts', userController.createPost);
router.get('/posts/published', userController.getPublishedPosts);
router.get('/users/active/stats', userController.getActiveUsersWithStats);
router.post('/posts/:id/view', userController.incrementPostViews);

module.exports = router;