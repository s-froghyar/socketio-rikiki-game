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
var numOfPlayers = 0;
io.on("connection", socket => {
    var addedUser = false;
    socket.on('landing', () => {
            console.log('landed on menu so user count: ', numOfPlayers);
            socket.emit('playerCount', numOfPlayers);
    });
    // when the client emits 'add user', this listens and executes
    socket.on('add user', (username) => {
        if (addedUser) {
            return;
        };
        // we store the username in the socket session for this client
        socket.username = username;
        ++numOfPlayers;
        addedUser = true;
        players.push({username, isHost: numOfPlayers === 1});
        //get host
        if (numOfPlayers === 1) {
            socket.emit('login', {numOfPlayers, isHost: true});
            console.log('host is ', username);
        } else {
            socket.emit('login', {numOfPlayers, isHost: false});
        }
        // echo globally (all clients) that a person has connected
        socket.broadcast.emit('user joined', {
            username: socket.username,
            numOfPlayers: numOfPlayers
        });
        console.log('Added ' + username + ' to the game');
    });

    socket.on('get lobby players', () => {
        socket.emit('lobby players', {players});
    });
});

