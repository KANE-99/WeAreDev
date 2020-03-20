const express = require('express');
const route = express.Router();

const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const User = require('../../models/User');
const Profile = require('../../models/Profile');
const Post = require('../../models/Post');

// @route    POST /api/posts
// @desc     Create a Post
// @access   Private
route.post(
  '/',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const user = await User.findById(req.user.id).select('-password');

      const newPost = new Post({
        text: req.body.text,
        user: req.user.id,
        name: user.name,
        avatar: user.avatar
      });

      const post = await newPost.save();
      res.json(post);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    GET /api/posts
// @desc     Get all Posts
// @access   Private
route.get('/', auth, async (req, res) => {
  try {
    const posts = await Post.find().sort({ date: -1 });
    res.json(posts);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET /api/posts/:id
// @desc     Get Post by id
// @access   Private
route.get('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.json({ msg: 'No Post found' });
    }
    res.json(post);
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.json({ msg: 'No Post found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    DELETE /api/posts/:id
// @desc     Delete post by id
// @access   Private
route.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.json({ msg: 'No Post found' });
    }
    // Check User
    if (post.user.toString() !== req.user.id) {
      return res.json({ msg: 'User not Authorized' });
    }

    await post.remove();
    res.json({ msg: 'Post removed' });
  } catch (error) {
    console.error(error.message);
    if (error.kind === 'ObjectId') {
      return res.json({ msg: 'No Post found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route    PUT /api/posts/likes/:id
// @desc     Add a like
// @access   Private
route.put('/likes/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (
      post.likes.filter(like => like.user.toString() === req.user.id).length > 0
    ) {
      return res.status(400).json({ msg: 'Post already liked' });
    }
    post.likes.unshift({ user: req.user.id });
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT /api/posts/unlikes/:id
// @desc     unlike a post
// @access   Private
route.put('/unlikes/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    const removeIndex = post.likes.findIndex(
      like => like.user.toString() === req.user.id
    );
    if (removeIndex == -1) {
      return res.status(400).json({ msg: 'post has not yet been liked' });
    }
    post.likes.splice(removeIndex, 1);

    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.log(error.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST /api/posts/comment/:id
// @desc     Comment on a post
// @access   Private
route.post(
  '/comment/:id',
  [
    auth,
    [
      check('text', 'Text is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.json({ msg: 'No Post found' });
      }
      const newComment = {
        text: req.body.text,
        user: req.user.id,
        name: user.name,
        avatar: user.avatar
      };
      post.comments.unshift(newComment);

      await post.save();
      res.json(post.comments);
    } catch (error) {
      console.error(error.message);
      res.status(500).send('Server Error');
    }
  }
);

// @route    DELETE /api/posts/comment/:id/:comment_id
// @desc     Delete a comment
// @access   Private
route.delete('/comment/:id/:comment_id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const removeIndex = post.comments.findIndex(
      comment => comment.id === req.params.comment_id
    );
    if (removeIndex == -1) {
      return res.status(404).json({ msg: 'Comment does not exist' });
    }
    if (post.comments[removeIndex].user.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorised' });
    }
    post.comments.splice(removeIndex, 1);

    await post.save();
    res.json(post.comments);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

module.exports = route;
