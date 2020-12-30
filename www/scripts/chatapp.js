window.onload = function() {
    var chatapp = new ChatApp();
    chatapp.init();
};
var ChatApp = function() {
    this.socket = null;
};

class Msg {
    constructor(sender_id, receiver_id, created, content) {
        this.sender = {'id': sender_id};
        this.receiver = {'id': receiver_id};
        this.created = created;
        this.content = content;
    }
}

let user_id;
let receiver_id;
let token;
let conversation_id;

ChatApp.prototype = {
    init: function() {
        var that = this;
        this.socket = io.connect();
        // on connection event
        this.socket.on('connect', function() {
            document.getElementById('info').textContent = 'get yourself a nickname :)';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('user').focus();
            
        });


        // on successful connection with server
        this.socket.on('success', async function() {
            document.title = 'chatapp | ' + document.getElementById('user').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();
            

            // use get_conversation API to get messages, then display them
            const url = 'http://localhost:3000/IT4788/message/get_conversation';
        });
        
        // on new message from chat friend
        this.socket.on('onmessage', function(message) {
            // just display it (easy)
            let msg = JSON.parse(message);
            that._displayNewMsg(msg.sender.id, new Date(), msg.content);
        });
        this.socket.on('unavailable', function() {
            // just notify user (easy)
            that._displayNewMsg(receiver_id, new Date(), ' disconnected!');
        });
        this.socket.on('available', function() {
            // just notify user (easy)
            that._displayNewMsg(receiver_id, new Date(), ' joined !');
        });




        document.getElementById('loginBtn').addEventListener('click', function() {
            
            user_id = document.getElementById('user').value;
            receiver_id = document.getElementById('receiver').value;
            token = document.getElementById('token').value;
            conversation_id = document.getElementById('conversation').value;

            console.log(user_id);
            console.log(receiver_id);
            console.log(token);
            console.log(conversation_id);

            that.socket.emit('joinchat', JSON.stringify(new Msg(user_id, receiver_id)));

        }, false);

        document.getElementById('sendBtn').addEventListener('click', function() {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            var receiver = document.getElementById('receiver').value;
            messageInput.value = '';
            messageInput.focus();
            if (msg.trim().length != 0) {
                var nickName = document.getElementById('user').value;

                
                that.socket.emit('send', JSON.stringify(new Msg(user_id, receiver_id, new Date(), msg)));

                that._displayNewMsg(nickName, new Date(), msg);
                return;
            };
        }, false);


        // deletemessage event, received from user interaction in app





















        document.getElementById('messageInput').addEventListener('keyup', function(e) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            if (e.keyCode == 13 && msg.trim().length != 0) {
                var nickName = document.getElementById('user').value;
                messageInput.value = '';
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg(nickName, new Date(), msg);
            };
        }, false);
        document.getElementById('clearBtn').addEventListener('click', function() {
            document.getElementById('historyMsg').innerHTML = '';
        }, false);
        document.getElementById('sendImage').addEventListener('change', function() {
            if (this.files.length != 0) {
                var file = this.files[0],
                    reader = new FileReader(),
                    color = document.getElementById('colorStyle').value;
                if (!reader) {
                    that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
                    this.value = '';
                    return;
                };
                reader.onload = function(e) {
                    this.value = '';
                    var nickName = document.getElementById('user').value;
                    that.socket.emit('img', e.target.result, color);
                    that._displayImage(nickName, e.target.result, color);
                };
                reader.readAsDataURL(file);
            };
        }, false);
        this._initialEmoji();
        document.getElementById('emoji').addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            emojiwrapper.style.display = 'block';
            e.stopPropagation();
        }, false);
        document.body.addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            if (e.target != emojiwrapper) {
                emojiwrapper.style.display = 'none';
            };
        });
        document.getElementById('emojiWrapper').addEventListener('click', function(e) {
            var target = e.target;
            if (target.nodeName.toLowerCase() == 'img') {
                var messageInput = document.getElementById('messageInput');
                messageInput.focus();
                messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
            };
        }, false);
    },
    _initialEmoji: function() {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for (var i = 69; i > 0; i--) {
            var emojiItem = document.createElement('img');
            emojiItem.src = '../content/emoji/' + i + '.gif';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        };
        emojiContainer.appendChild(docFragment);
    },
    _displayNewMsg: function(user, created, msg) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = created;
            //determine whether the msg contains emoji
            msg = this._showEmoji(msg);
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _displayImage: function(user, imgData, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _showEmoji: function(msg) {
        var match, result = msg,
            reg = /\[emoji:\d+\]/g,
            emojiIndex,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
            } else {
                result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');//todo:fix this in chrome it will cause a new request for the image
            };
        };
        return result;
    }
};
