const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
var fs = require('fs');
// player = {
//     uniqueId: '1234'
// }

http.listen(4444, function () {
    console.log("Let's go!");
});

const rounds = [];
const players = [];
var numUsers = 0;
io.on("connection", socket => {
    var addedUser = false;
    socket.on('landing', () => {
            console.log('user count: ', numUsers);
            socket.emit('playerCount', numUsers);
    });
    // when the client emits 'add user', this listens and executes
    socket.on('add user', (username) => {
        if (addedUser) {
            return;
        };
        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;
        socket.emit('login', numUsers);
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numUsers: numUsers
        });
        console.log('Added ' + username + ' to the game');
    });
});

