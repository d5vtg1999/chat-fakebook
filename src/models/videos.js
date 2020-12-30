const mongoose = require('mongoose')

const videoSchema = new mongoose.Schema({
    video: {
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

const Video = mongoose.model('Video', videoSchema)

module.exports = Video