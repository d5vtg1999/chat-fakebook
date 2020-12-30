const mongoose = require('mongoose')

const imageSchema = new mongoose.Schema({
    image: {
        type: Buffer,
        required: true
    },

    of_post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
})

const Image = mongoose.model('Image', imageSchema)

module.exports = Image