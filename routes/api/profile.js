const express = require('express');
const route = express.Router();

const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('./../../models/User');

// @route    GET api/profile/me
// @desc     Get the current user profile
// @access   Private
route.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/profile
// @desc     Create or Update a Profile
// @access   Private
route.post(
  '/',
  [
    auth,
    [
      check('status', 'Status is required')
        .not()
        .isEmpty(),
      check('skills', 'Skills are required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array() });
    }

    const {
      company,
      website,
      location,
      status,
      bio,
      githubusername,
      skills,
      facebook,
      twitter,
      linkedin,
      youtube,
      instagram
    } = req.body;

    const ProfileFields = {};
    ProfileFields.user = req.user.id;
    if (company) ProfileFields.company = company;
    if (website) ProfileFields.website = website;
    if (location) ProfileFields.location = location;
    if (status) ProfileFields.status = status;
    if (bio) ProfileFields.bio = bio;
    if (githubusername) ProfileFields.githubusername = githubusername;
    if (skills) ProfileFields.skills = skills.split(',').map(x => x.trim());

    ProfileFields.social = {};
    if (facebook) ProfileFields.social.facebook = facebook;
    if (twitter) ProfileFields.social.twitter = twitter;
    if (youtube) ProfileFields.social.youtube = youtube;
    if (linkedin) ProfileFields.social.linkedin = linkedin;
    if (instagram) ProfileFields.social.instagram = instagram;

    try {
      let profile = await Profile.findOne({ user: req.user.id });
      if (profile) {
        profile = await Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: ProfileFields },
          { new: true }
        );
        return res.json(profile);
      }
      profile = new Profile(ProfileFields);

      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.send('Server Error');
    }
  }
);

// @route    GET api/profile
// @desc     Get all users' profile
// @access   Public
route.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/user/:user_id
// @desc     Get Profile by User ID
// @access   Public
route.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate('user', ['name', 'avatar']);
    if (!profile) {
      return res.status(400).json({ msg: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    if (error.kind == 'ObjectId')
      return res.status(400).json({ msg: 'Profile not found' });
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/profile
// @desc     Delete profile,user and posts
// @access   Private
route.delete('/', auth, async (req, res) => {
  try {
    // @todo - Remove all posts

    // Remove Profile
    await Profile.findOneAndDelete({
      user: req.user.id
    });

    // Remove User
    await User.findOneAndDelete({
      _id: req.user.id
    });

    res.json({ msg: 'User Deleted' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/profile/experience
// @desc     Add experience for a profile
// @access   Private
route.put(
  '/experience',
  [
    auth,
    [
      check('title', 'Title is required')
        .not()
        .isEmpty(),
      check('company', 'Company name is required')
        .not()
        .isEmpty(),
      check('from', 'From date is required')
        .not()
        .isEmpty()
    ]
  ],
  async (req, res) => {
    const {
      title,
      company,
      from,
      location,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      from,
      location,
      to,
      current,
      description
    };

    try {
      const profile = await Profile.findOne({ user: req.user.id });

      profile.experience.unshift(newExp);

      await profile.save();
      res.json(profile);
    } catch (error) {
      console.error(error.message);
      res.send('Server Error');
    }
  }
);

module.exports = route;
