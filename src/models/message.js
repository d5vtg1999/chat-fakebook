const mongoose = require('mongoose')
const Image = require('./images')
const Video = require('./videos')
const ObjectId = require('mongodb').ObjectID;

const messageSchema = new mongoose.Schema({
    sender_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    receiver_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    conversation_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Conversation'
    },
    text: {
        type: String,
        required: true
    },
    is_read: {
        type: Boolean,
        default: false
    },
    createAt: {
        type: Date,
        default: Date.now()
    },
    deleted_by_sender: {
        type: Boolean,
        default: false
    },
    deleted_by_receiver: {
        type: Boolean,
        default: false
    }
})


// return list of messages of a conversation
messageSchema.statics.findByConversationId = async (conv_id) => {
    const conversation = await Message.find({conversation_id: new ObjectId(conv_id)});
    if(!conversation){
        console.log('there is no conversation with id = ' + conv_id);
    }
    return conversation;
}


const Message = mongoose.model('Message', messageSchema)


    

module.exports = Message
