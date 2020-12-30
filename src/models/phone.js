const mongoose = require('mongoose')

const phoneSchema = new mongoose.Schema({
    phone_number: {
        type: String,
        required: true
    },
    is_verified: {
        type: Boolean,
        default: false
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
}, {
    timestamps: true
})

const Phone = mongoose.model('Phone', phoneSchema)

module.exports = Phone