const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
    descriptions: {
        type: [String],
    },

    of_post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },

    subject: {
        type: String,
    },

    details: {
        type: String,
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
})

const Report = mongoose.model('Report', reportSchema)

module.exports = Report