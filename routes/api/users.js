const express = require('express')
const route = express.Router()
const { check, validationResult } = require('express-validator')
const User = require('./../../models/User')
const gravatar = require('gravatar')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const config = require('config')


// @route    POST /api/users
// @desc     Register User
// @access   Public
route.post('/', [
    check('name', 'Name is required')
        .not()
        .isEmpty(),
    check('email', 'Please include a valid email')
        .isEmail(),
    check('password', 'Please enter a password of 6 or more characters')
        .isLength({ min: 6 })
], async (req, res) => {

    const error = validationResult(req)
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() })
    }

    const { name, email, password } = req.body

    try {
        // Check if Email already exist
        let user = await User.findOne({ email })
        if (user) {
            return res.status(400).json({ errors: [{ msg: "User already exists" }] })
        }

        // Grab the gravatar image
        const avatar = gravatar.url(email, {
            s: '200',
            r: 'pg',
            d: 'mm'
        })

        user = new User({
            name,
            email,
            password,
            avatar
        })

        const salt = await bcrypt.genSalt(10)

        user.password = await bcrypt.hash(password, salt)

        // Register User
        await user.save()

        // JWT 
        const payload = {
            user: {
                id: user.id
            }
        }
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 3600 },
            (err, Token) => {
                if (err) throw err
                res.json({ token: Token })
            }
        )

    } catch (err) {
        console.log(err.message)
        res.status(500).send("Server error")
    }

})

module.exports = route