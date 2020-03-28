const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
// player = {
//     uniqueId: '1234'
// }
const rounds = [];
const players = [];
io.on("connection", socket => {
    // create unique id for player who joined
    var player = {
        uniqueId: createUniqueId()
    }
    io.emit('player-entry', player);
    console.log('Player ' + player.uniqueId + ' has connected');
    players.push(player);
    const safeJoin = currentId => {
        socket.leave(previousId);
        socket.join(currentId);
        previousId = currentId;
    };
    io.emit('players', players);
});
function createUniqueId() {
    return Math.floor(Math.random() * 100);
}
http.listen(4444);
console.log("Let's go!");
