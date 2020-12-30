const mongoose = require('mongoose')
const Message = require('../models/message')
const Conversation = require('../models/conversation')

mongoose.connect(process.env.MONGODB_URL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
})

var db = mongoose.connection;

db.once('open', function(){
    console.log('open connection');
    /* add message  
    // example : 0368495155 -> 0368495156
    var msg1 = new Message({sender_id: "5fe6dcf22450dd2fcdbb663a", receiver_id: "5fe6dd2a2450dd2fcdbb663c", conversation_id: "5feb3b2b816942222634d9c8", text: "hello"});
    msg1.save(function (err, msg) {
        if (err) return console.error(err);
        console.log(msg._id + " saved to message collection.");
    });
    msg1 = new Message({sender_id: "5fe6dcf22450dd2fcdbb663a", receiver_id: "5fe6dd2a2450dd2fcdbb663c", conversation_id: "5feb3b2b816942222634d9c8", text: "what are you doing?"});
    msg1.save(function (err, msg) {
        if (err) return console.error(err);
        console.log(msg._id + " saved to message collection.");
    });   
    */

    // add new conversation
    /*
    var conv = new Conversation();
    conv.save(function (err, msg) {
        if (err) return console.error(err);
        console.log(conv._id + " saved to conversation collection.");
    }); 
    */
})

module.exports = db
