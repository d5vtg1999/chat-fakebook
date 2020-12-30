const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema({
    sender_id: {  // the one starting the conversation, i.e write first message
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    receiver_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    last_msg_id : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
})

const Conversation = mongoose.model('Conversation', conversationSchema)

module.exports = Conversation
