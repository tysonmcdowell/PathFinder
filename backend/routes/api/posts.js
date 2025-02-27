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
  check('tripLength')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Trip length must be an integer greater than or equal to 1'),
  handleValidationErrors
];

const validateReview = [
  check('rating')
    .exists({ checkFalsy: true })
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be an integer from 1 to 5'),
  check('reviews')
    .exists({ checkFalsy: true })
    .notEmpty()
    .withMessage('Review text is required'),
  handleValidationErrors
];

// Get all posts
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all posts');
    const posts = await Post.findAll({
      attributes: ['id', 'owner_id', 'body', 'status', 'trip_length', 'created_at', 'updated_at'],
      include: [
        { model: Stop, as: 'stops', attributes: ['id', 'order', 'name', 'location', 'days'] },
        { 
          model: Review, 
          as: 'reviews', 
          attributes: ['id', 'user_id', 'rating', 'reviews'],
          include: [{ model: User, as: 'reviewer', attributes: ['username'] }]
        },
        { model: User, as: 'owner', attributes: ['username'] }
      ]
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
  const { body, status, tripLength, stops } = req.body;
  const owner_id = req.user.id;

  try {
    console.log('req.user:', req.user);
    console.log('req.body:', JSON.stringify(req.body, null, 2));
    console.log('Received tripLength:', tripLength);
    console.log('Creating post with owner_id:', owner_id);
    if (!owner_id) throw new Error('User ID is not available from req.user');

    const postData = {
      owner_id,
      body,
      status,
      trip_length: tripLength ? parseInt(tripLength) : null,
      created_at: new Date(),
      updated_at: new Date()
    };
    console.log('Post data before create:', postData);

    const post = await Post.create(postData);
    console.log('Post saved to DB:', post.toJSON());

    if (stops && Array.isArray(stops)) {
      const stopData = stops.map((stop, index) => ({
        post_id: post.id,
        order: stop.order !== undefined ? stop.order : index + 1, // Fallback to index-based order
        name: stop.name || 'Unnamed Stop',
        location: stop.location || 'Unknown Location',
        description: stop.description || null,
        days: stop.days || null
      }));
      console.log('Stop data before create:', JSON.stringify(stopData, null, 2));
      await Stop.bulkCreate(stopData, { validate: true });
      console.log('Stops created:', stopData);
    } else {
      console.log('No stops provided or stops is not an array');
      throw new Error('Stops array is required');
    }

    const createdPost = await Post.findByPk(post.id, {
      attributes: ['id', 'owner_id', 'body', 'status', 'trip_length', 'created_at', 'updated_at'],
      include: [
        { model: Stop, as: 'stops', attributes: ['id', 'order', 'name', 'location', 'days'] },
        { model: Review, as: 'reviews', attributes: ['id', 'user_id', 'rating', 'reviews'], include: [{ model: User, as: 'reviewer', attributes: ['username'] }] },
        { model: User, as: 'owner', attributes: ['username'] }
      ]
    });
    console.log('Post created:', createdPost.toJSON());
    return res.status(201).json(createdPost);
  } catch (err) {
    console.error('Error creating post:', err);
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
      console.log('Validation errors:', errors);
      return res.status(400).json({ title: 'Validation Error', errors });
    }
    return res.status(500).json({ title: 'Server Error', message: err.message, stack: err.stack });
  }
});

// Get trip details by ID
router.get('/:postId', async (req, res) => {
  const { postId } = req.params;
  try {
    console.log(`Fetching post with ID: ${postId}`);
    const post = await Post.findByPk(postId, {
      attributes: ['id', 'owner_id', 'body', 'status', 'trip_length', 'created_at', 'updated_at'],
      include: [
        { model: Stop, as: 'stops', attributes: ['id', 'order', 'name', 'location', 'days'] },
        { model: Review, as: 'reviews', attributes: ['id', 'user_id', 'rating', 'reviews'], include: [{ model: User, as: 'reviewer', attributes: ['username'] }] },
        { model: User, as: 'owner', attributes: ['username'] }
      ]
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

// Create a review for a post
router.post('/:postId/reviews', requireAuth, validateReview, async (req, res) => {
  const { postId } = req.params;
  const { rating, reviews } = req.body;
  const userId = req.user.id;

  try {
    console.log(`Creating review for post ${postId} by user ${userId}`);
    const post = await Post.findByPk(postId);
    if (!post) {
      console.log(`Post ${postId} not found`);
      return res.status(404).json({ message: 'Trip not found' });
    }

    const existingReview = await Review.findOne({
      where: { post_id: postId, user_id: userId }
    });
    if (existingReview) {
      console.log(`User ${userId} already reviewed post ${postId}`);
      return res.status(403).json({ message: 'You have already reviewed this trip' });
    }

    const reviewData = {
      post_id: postId,
      user_id: userId,
      rating,
      reviews,
      created_at: new Date(),
      updated_at: new Date()
    };
    console.log('Review data before create:', reviewData);

    const newReview = await Review.create(reviewData);
    console.log('Review created:', newReview.toJSON());

    return res.status(201).json(newReview);
  } catch (err) {
    console.error('Error creating review:', err);
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
      console.log('Validation errors:', errors);
      return res.status(400).json({ title: 'Validation Error', errors });
    }
    return res.status(500).json({ title: 'Server Error', message: err.message, stack: err.stack });
  }
});

// Edit a review for a post
router.put('/:postId/reviews/:reviewId', requireAuth, validateReview, async (req, res) => {
  const { postId, reviewId } = req.params;
  const { rating, reviews } = req.body;
  const userId = req.user.id;

  try {
    console.log(`Editing review ${reviewId} for post ${postId} by user ${userId}`);
    const review = await Review.findByPk(reviewId);
    if (!review) {
      console.log(`Review ${reviewId} not found`);
      return res.status(404).json({ message: 'Review not found' });
    }
    if (review.post_id !== parseInt(postId)) {
      console.log(`Review ${reviewId} does not belong to post ${postId}`);
      return res.status(404).json({ message: 'Review not found for this trip' });
    }
    if (review.user_id !== userId) {
      console.log(`User ${userId} not authorized to edit review ${reviewId} owned by ${review.user_id}`);
      return res.status(403).json({ message: 'You are not authorized to edit this review' });
    }

    await review.update({
      rating,
      reviews,
      updated_at: new Date()
    });
    console.log('Review updated:', review.toJSON());
    return res.json(review);
  } catch (err) {
    console.error('Error updating review:', err);
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map(e => ({ field: e.path, message: e.message }));
      console.log('Validation errors:', errors);
      return res.status(400).json({ title: 'Validation Error', errors });
    }
    return res.status(500).json({ title: 'Server Error', message: err.message, stack: err.stack });
  }
});

// Delete a review for a post
router.delete('/:postId/reviews/:reviewId', requireAuth, async (req, res) => {
  const { postId, reviewId } = req.params;
  const userId = req.user.id;

  try {
    console.log(`Deleting review ${reviewId} for post ${postId} by user ${userId}`);
    const review = await Review.findByPk(reviewId);
    if (!review) {
      console.log(`Review ${reviewId} not found`);
      return res.status(404).json({ message: 'Review not found' });
    }
    if (review.post_id !== parseInt(postId)) {
      console.log(`Review ${reviewId} does not belong to post ${postId}`);
      return res.status(404).json({ message: 'Review not found for this trip' });
    }
    if (review.user_id !== userId) {
      console.log(`User ${userId} not authorized to delete review ${reviewId} owned by ${review.user_id}`);
      return res.status(403).json({ message: 'You are not authorized to delete this review' });
    }

    await review.destroy();
    console.log(`Review ${reviewId} deleted successfully`);
    return res.status(200).json({ message: 'Successfully deleted' });
  } catch (err) {
    console.error('Error deleting review:', err);
    return res.status(500).json({ title: 'Server Error', message: err.message, stack: err.stack });
  }
});

// Edit a trip post
router.put('/:postId', requireAuth, validatePost, async (req, res) => {
  const { postId } = req.params;
  const { body, status, tripLength, stops } = req.body;
  const userId = req.user.id;

  try {
    console.log(`Editing post ${postId} by user ${userId}`);
    console.log('Received trip data:', JSON.stringify(req.body, null, 2));
    const post = await Post.findByPk(postId);
    if (!post) {
      console.log(`Post ${postId} not found`);
      return res.status(404).json({ message: 'Trip not found' });
    }
    if (post.owner_id !== userId) {
      console.log(`User ${userId} not authorized to edit post ${postId} owned by ${post.owner_id}`);
      return res.status(403).json({ message: 'You are not authorized to edit this trip' });
    }

    const updateData = {
      body,
      status,
      trip_length: tripLength ? parseInt(tripLength) : null,
      updated_at: new Date(),
    };
    console.log('Update data for Post:', updateData);
    await post.update(updateData);
    console.log('Post updated in DB:', post.toJSON());

    if (stops && Array.isArray(stops)) {
      await Stop.destroy({ where: { post_id: postId } });
      console.log(`Deleted existing stops for post ${postId}`);

      const stopData = stops.map((stop, index) => ({
        post_id: post.id,
        order: stop.order !== undefined ? stop.order : index + 1, // Fallback order
        name: stop.name || 'Unnamed Stop',
        location: stop.location || 'Unknown Location',
        description: stop.description || null,
        days: stop.days || null,
      }));
      console.log('Stop data before create:', JSON.stringify(stopData, null, 2));
      await Stop.bulkCreate(stopData, { validate: true });
      console.log('Stops updated:', stopData);
    } else {
      console.log('No valid stops array provided, skipping stop update');
    }

    const updatedPost = await Post.findByPk(postId, {
      attributes: ['id', 'owner_id', 'body', 'status', 'trip_length', 'created_at', 'updated_at'],
      include: [
        { model: Stop, as: 'stops', attributes: ['id', 'order', 'name', 'location', 'days'] },
        { model: Review, as: 'reviews', attributes: ['id', 'user_id', 'rating', 'reviews'], include: [{ model: User, as: 'reviewer', attributes: ['username'] }] },
        { model: User, as: 'owner', attributes: ['username'] },
      ],
    });
    console.log('Post updated:', JSON.stringify(updatedPost.toJSON(), null, 2));
    return res.json(updatedPost);
  } catch (err) {
    console.error('Error updating post:', err);
    if (err.name === 'SequelizeValidationError') {
      const errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
      console.log('Validation errors:', errors);
      return res.status(400).json({ title: 'Validation Error', errors });
    }
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