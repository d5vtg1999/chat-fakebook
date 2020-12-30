const mongoose = require('mongoose')

const searchSchema = new mongoose.Schema({
    keyword: {
        type: String,
        required: true
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    created: {
        type: Date,
        default: Date.now()
    }
})

const Search = mongoose.model('Search', searchSchema)

module.exports = Search