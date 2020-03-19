const express = require('express')
const route = express.Router()
const auth = require('../../middleware/auth')
const User = require('../../models/User')
const bcrypt = require('bcryptjs')
const config = require('config')
const jwt = require('jsonwebtoken')
const { check, validationResult } = require('express-validator')

// @route    GET /api/auth
// @desc     Get Auth User
// @access   Private
route.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password')
        res.json(user)
    } catch (err) {
        console.log(err.message)
        res.status(500).send("Server Error")
    }

})

// @route    POST /api/auth
// @desc     Login Auth User
// @access   Public
route.post('/', [
    check('email', 'Please include a valid email')
        .isEmail(),
    check('password', 'Password is required')
        .exists()
], async (req, res) => {

    const error = validationResult(req)
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() })
    }

    const { email, password } = req.body

    try {
        let user = await User.findOne({ email })
        if (!user) {
            return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] })
        }

        const isMatched = await bcrypt.compare(password, user.password)
        if (!isMatched) {
            return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] })
        }

        // JWT 
        const payload = {
            user: {
                id: user.id
            }
        }
        jwt.sign(
            payload,
            config.get('jwtSecret'),
            { expiresIn: 360000 },
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