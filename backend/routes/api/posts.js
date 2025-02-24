// backend/routes/api/posts.js
const express = require('express');
const { check } = require('express-validator');
const { handleValidationErrors } = require('../../utils/validation');
const { requireAuth } = require('../../utils/auth');
const { Post, Stop, Review, User, Sequelize } = require('../../db/models');

const router = express.Router();

const validatePost = [
  check('body')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Trip content cannot be empty'),
  check('status')
    .exists({ checkFalsy: true })
    .isIn(['planned', 'completed', 'in_progress'])
    .withMessage('Status must be one of: planned, completed, in_progress'),
  handleValidationErrors
];

// Get all posts
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all posts');
    const posts = await Post.findAll({
      attributes: ['id', 'owner_id', 'body', 'status', 'created_at', 'updated_at']
    });
    console.log('Posts fetched:', posts.map(p => p.toJSON()));
    return res.json({ Posts: posts });
  } catch (err) {
    console.error('Error fetching posts:', err);
    return res.status(500).json({ title: 'Server Error', message: err.message, stack: err.stack });
  }
});

// Create a new trip post
router.post('/', requireAuth, validatePost, async (req, res) => {
  const { body, status } = req.body;
  const owner_id = req.user.id;

  try {
    console.log('req.user:', req.user);
    console.log('Creating post with owner_id:', owner_id);
    if (!owner_id) throw new Error('User ID is not available from req.user');
    
    const postData = {
      owner_id,
      body,
      status,
      created_at: new Date(),
      updated_at: new Date()
    };
    console.log('Post data before create:', postData);
    
    const post = await Post.create(postData);
    const createdPost = await Post.findByPk(post.id, {
      attributes: ['id', 'owner_id', 'body', 'status', 'created_at', 'updated_at']
    });
    console.log('Post created:', createdPost.toJSON());
    return res.status(201).json(createdPost);
  } catch (err) {
    console.error('Error creating post:', err);
    return res.status(500).json({ title: 'Server Error', message: err.message, stack: err.stack });
  }
});

// Get trip details by ID
router.get('/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    console.log(`Fetching post with ID: ${postId}`);
    const post = await Post.findByPk(postId, {
      attributes: ['id', 'owner_id', 'body', 'status', 'created_at', 'updated_at']
    });
    if (!post) {
      console.log(`Post ${postId} not found`);
      return res.status(404).json({ message: 'Trip not found' });
    }
    console.log('Post fetched:', post.toJSON());
    return res.json(post);
  } catch (err) {
    console.error('Error fetching post:', err);
    return res.status(500).json({ title: 'Server Error', message: err.message, stack: err.stack });
  }
});

// Edit a trip post
router.put('/:postId', requireAuth, validatePost, async (req, res) => {
  const { postId } = req.params;
  const { body, status } = req.body;
  const userId = req.user.id;

  try {
    console.log(`Editing post ${postId} by user ${userId}`);
    console.log('req.user:', req.user);
    const post = await Post.findByPk(postId);
    if (!post) {
      console.log(`Post ${postId} not found`);
      return res.status(404).json({ message: 'Trip not found' });
    }
    console.log('Post owner_id:', post.owner_id);
    if (post.owner_id !== userId) {
      console.log(`User ${userId} not authorized to edit post ${postId} owned by ${post.owner_id}`);
      return res.status(403).json({ message: 'You are not authorized to edit this trip' });
    }

    await post.update({ body, status, updated_at: new Date() });
    const updatedPost = await Post.findByPk(postId, {
      attributes: ['id', 'owner_id', 'body', 'status', 'created_at', 'updated_at']
    });
    console.log('Post updated:', updatedPost.toJSON());
    return res.json(updatedPost);
  } catch (err) {
    console.error('Error updating post:', err);
    return res.status(500).json({ title: 'Server Error', message: err.message, stack: err.stack });
  }
});

// Delete a trip post
router.delete('/:postId', requireAuth, async (req, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    console.log(`Deleting post ${postId} by user ${userId}`);
    console.log('req.user:', req.user);
    const post = await Post.findByPk(postId);
    if (!post) {
      console.log(`Post ${postId} not found`);
      return res.status(404).json({ message: 'Trip not found' });
    }
    console.log('Post owner_id:', post.owner_id);
    if (post.owner_id !== userId) {
      console.log(`User ${userId} not authorized to delete post ${postId} owned by ${post.owner_id}`);
      return res.status(403).json({ message: 'You are not authorized to delete this trip' });
    }

    await post.destroy();
    console.log(`Post ${postId} deleted successfully`);
    return res.status(200).json({ message: 'Successfully deleted' });
  } catch (err) {
    console.error('Error deleting post:', err);
    return res.status(500).json({ title: 'Server Error', message: err.message, stack: err.stack });
  }
});

module.exports = router;