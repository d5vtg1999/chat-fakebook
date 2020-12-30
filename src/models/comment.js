const mongoose = require('mongoose');
const db = require('../db/mongoose');

const commentSchema = new mongoose.Schema({

    comment: {
        type: String,
        required: true
    },
    of_post: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Post'
    },

    createAt: {
        type: Date,
        default: Date.now()
    },

    comment: {
        type: String,
        default: "",
        required: true
    },

    index: {
        type: Number,
        default: 0,
    },

    owner: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
})
  

const Comment = mongoose.model('Comment', commentSchema)

module.exports = Comment