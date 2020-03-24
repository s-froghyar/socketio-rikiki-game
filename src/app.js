const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const rounds = [];
const players = [];
io.on("connection", socket => {

    const safeJoin = currentId => {
        socket.leave(previousId);
        socket.join(currentId);
        previousId = currentId;
    };
    io.emit('players', players);
});

http.listen(4444);
console.log("Let's go!");
