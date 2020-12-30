const path = require('path');
const bcrypt = require('bcryptjs')
const multer = require('multer')
const sharp = require('sharp')
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const phoneToken = require('generate-sms-verification-code')
const User = require('../models/user');
const Phone = require('../models/phone');
const Message = require('../models/message');
const Conversation = require('../models/conversation');
const ObjectId = require('mongodb').ObjectID;

const get_list_conversation = asyncHandler(async (req, res, next) => {
    console.log('get_list_conversation request received ...');
    const {token, index, count} = req.query;

    // find user by token
    const user = await User.findOne({'token': token});
    
    var numNewMessage = 0;

    let conversation_data = [];

    const list_conversation = await Conversation.find({ $or: [{'sender_id': user._id}, {'receiver_id': user._id}]});

    console.log(list_conversation);

    list_conversation.sort(async function(a, b) {
        const last_msg_a = await Message.findById(a.last_msg_id);
        const last_msg_b = await Message.findById(b.last_msg_id);
        var keyA = last_msg_a.createAt;
        var keyB = last_msg_b.createAt;
        // Compare the 2 dates
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });

    let return_list_conversation = list_conversation.slice(index, index + count);

    for (conversation of return_list_conversation) {
        const last_msg = await Message.findById(conversation.last_msg_id);
        let partner;
        let unread;
        if(last_msg.sender_id.equals(new ObjectId(user._id))) {
            partner = await User.findById(last_msg.receiver_id);
            unread = false;
        }
        else {
            partner = await User.findById(last_msg.sender_id);
            unread = !last_msg.is_read;
        }
        if(unread) numNewMessage += 1;
        conv_data = {
            "id": conversation._id,
            "partner": {
                "id": partner._id,
                "username": partner.first_name + " " + partner.sur_name,
                "avatar": partner.avatar
            },
            "last_message": {
                "message": last_msg.text,
                "created": last_msg.createAt,
                "unread": unread
            }
        }
        conversation_data.push(conv_data);
    }

    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": conversation_data,
        "numNewMessage": numNewMessage
    }) 

});

const get_conversation = asyncHandler(async (req, res, next) => {
    console.log('get_conversation request received ...');
    const {token, index, count, partner_id, conversation_id} = req.query;


    // find user by token
    const user = await User.findOne({'token': token});
    const friend = await User.findById(new ObjectId(partner_id));

    if(user) console.log(user._id);
    if(friend) console.log(friend._id);

    const conversation = await Message.findByConversationId(conversation_id);
    conversation.sort(function(a, b) {
        var keyA = a.createAt;
        var keyB = b.createAt;
        // Compare the 2 dates
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });


    let return_conversation = conversation.slice(index, index + count);



    var msg_data = [];
    let is_read;
    let sender_id;
    let username;
    let text;

    for (message of return_conversation) {
        if(message.sender_id.equals(new ObjectId(partner_id))) {
             is_read = message.is_read;
             sender_id = partner_id;
             username = friend.first_name + ' ' + friend.sur_name;
             if(message.deleted_by_sender || message.deleted_by_receiver) text = '';
             else text = message.text;
        } else {
             is_read = true;
             sender_id = user._id;
             username = user.first_name + ' ' + user.sur_name;
             if(message.deleted_by_sender) text = '';
             else text = message.text;
        }
        msg = {
             "message": text,
             "message_id": message._id,
             "unread": is_read,
             "created" : message.createAt,
             "sender" : {
                  "id" : sender_id,
                  "avatar": user.avatar,
                  "username": username
             }
        }
        msg_data.push(msg);
        console.log(msg_data);
    }
    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": {
             "conversation": msg_data,
             "is_blocked": user.is_blocked
        }
    })

});

const set_read_message = asyncHandler(async (req, res, next) => {
    console.log('set_read_message request received ...');
    const {token, conversation_id} = req.query;
    const conversation = await Message.findByConversationId(conversation_id);
    for (message of conversation) {
        message.is_read = true;
        await message.save();
    }
    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": ""
    })
});

const delete_message = asyncHandler(async (req, res, next) => {
    console.log('delete_message request received ...');
    const {token, message_id, partner_id} = req.query;

    const message = await Message.findById(new ObjectId(message_id));
    if (message.sender_id.equals(new ObjectId(partner_id))) message.deleted_by_receiver = true;
    else message.deleted_by_sender = true;
    await message.save();
    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": ""
    })
});

const delete_conversation = asyncHandler(async (req, res, next) => {
    console.log('delete_conversation request received ...');
    const {token, partner_id, conversation_id} = req.query;
    const conversation = await Message.findByConversationId(conversation_id);
    for(message of conversation) {
        if(message.sender_id.equals(new ObjectId(partner_id))) message.deleted_by_receiver = true;
        else message.deleted_by_sender = true;
        await message.save();
    }
    res.status(200).json({
        "code": 1000,
        "message": "OK",
        "data": ""
    })
});

module.exports = {
    get_list_conversation,
    get_conversation, 
    set_read_message, 
    delete_message, 
    delete_conversation
}
