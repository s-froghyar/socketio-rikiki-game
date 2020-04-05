const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
var fs = require('fs');

http.listen(4444, function () {
    console.log("Let's go!");
});

const rounds = [];
let players = [];
var numOfPlayers = 0;
let host = {};
io.on("connection", socket => {
    var addedUser = false;
    // On landing
    socket.on('landing', (id) => {
        console.log(id);
        socket.id = id;
        socket.emit('playerCount', numOfPlayers);
    });
    // when the client emits 'add user', this listens and executes
    socket.on('add new user', (user) => {
        ++numOfPlayers;
        addedUser = true;
        host = numOfPlayers === 1 ? Object.assign({}, user) : host;
        user = { ...user, isHost: numOfPlayers === 1 };
        players.push(user);

        socket.emit('joining lobby', { user, players });
        socket.broadcast.emit('user joined', user);
        console.log('Added ' + user.username + ' to the game');
    });
    socket.on('override user', player => {
        console.log('Overriding user: ', player)
        const patchedPlayerInd = players.findIndex(user => user.uniqueId === player.uniqueId);
        players[patchedPlayerInd] = Object.assign({}, player);
    });
    socket.on('get lobby players', () => {
        socket.emit('lobby players', players);
    });
    socket.on('update player', player => {
        console.log('Updating player', player.uniqueId);
        const ind = players.findIndex(user => user.uniqueId === player.uniqueId);
        // check for icon change
        if (player.iconTitle !== players[ind].iconTitle) {
            players[ind].iconTitle = player.iconTitle;
        }
        // check for readiness change
        if (player.isReady !== players[ind].isReady) {
            players[ind].isReady = player.isReady;
        }
        socket.broadcast.emit('player updated', {id : player.uniqueId, player});
    });
});
