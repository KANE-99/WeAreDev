const mongoose = require('mongoose')
const config = require('config')
const db = config.get('mongoURI')

const connectDB = async () => {
    try {
        mongoose.connect(db, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        })
        console.log("Successfully connected DB")
    } catch (error) {
        console.error(error.message)
        process.exit(1)
    }
}

module.exports = connectDB