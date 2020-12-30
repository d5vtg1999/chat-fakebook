const app = require('./app');
const port = process.env.PORT;
const express = require('express');
const Message = require('./models/message');
const Conversation = require('./models/conversation');
const directory = '/home/d5/Web/ChatApp/www/';

var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

app.listen(port, () => {
    console.log(`Server is up on port: ${port}`.yellow.bold);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`Error: ${err.message}`.red);
    // Close server & exit process
    // server.close(() => process.exit(1));
});

server.listen(8888, () => {
    console.log('listen for socket events on port 8888');
});

app.use('/', express.static(directory));

// map: id -> socket_id
// chat_socket[user_id] = user_socket;
var chat_socket = {};

class Msg {
    constructor(sender, receiver, msg_id, conv_id, created, content) {
        this.sender = {'id': sender._id, 'avatar': sender.avatar, 'name': sender.first_name + ' ' + sender.sur_name};
        this.receiver = {'id': receiver._id, 'avatar': receiver.avatar, 'name': receiver.first_name + ' ' + receiver.sur_name};
        this.message_id = msg_id;
        this.created = created;
        this.content = content;
    }
}


io.sockets.on('connection', function(socket) {
    socket.on('joinchat', function(message) {
        let msg = JSON.parse(message);
        console.log(msg);
        chat_socket[msg.sender.id] = socket;
        socket.user_id = msg.sender.id;
        socket.partner_id = msg.receiver.id;
        if(msg.receiver.id in chat_socket) {
            chat_socket[msg.receiver.id].emit('available');
            socket.emit('available');
        }

        socket.emit('success');
    });
    socket.on('disconnect', function() {
        delete chat_socket[socket.user_id];
        if(socket.partner_id in chat_socket) {
            chat_socket[socket.partner_id].emit('unavailable');
        }
    });   
    socket.on('send', async function(message) {

        let msg = JSON.parse(message);
        let conversation = await Conversation.findOne({ $and: [{'sender_id': msg.sender.id}, {'receiver_id': msg.receiver.id}]});

        // add message to database
        let msg_db = new Message({'sender_id': msg.sender.id, 'receiver_id': msg.receiver.id, 'conversation_id': conversation._id, 'text': msg.content, 'createAt': msg.created});
        msg_db.save(function (err, msg) {
            if(err) return console.error(err);
            console.log(msg_db._id + " saved to message collection.");
        });
        // update conversation database -> last_msg_id        
        conversation.last_msg_id = msg_db._id;
        // send 'onmessage' event to receiver
        if(msg.receiver.id in chat_socket) {
            chat_socket[msg.receiver.id].emit('onmessage', JSON.stringify(new Msg(msg.sender, msg.receiver, msg._id, msg.created, msg.content)));
        }
    });
  
    socket.on('deletemessage', function(message) {
        // use API
        
    });       
});

