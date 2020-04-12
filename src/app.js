const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
var fs = require('fs');

http.listen(4444, function () {
    console.log("Let's go!");
    // let cards = initCards(players);
    // console.log(cards.players);
    // console.log(cards.deck.length);
    // cards.players = [
    //     {
    //         uniqueId: 1,
    //         hand: []
    //     },
    //     {
    //         uniqueId: 2,
    //         hand: []
    //     },
    //     {
    //         uniqueId: 3,
    //         hand: []
    //     },
    // ];

    // cards = dealCards(cards, 1);
    // console.log(cards);
    // console.log(cards.players[0]);
    // console.log(cards.players[1]);
    // console.log(cards.players[2]);
    // console.log(cards.deck.length);
    // console.log(cards.deck.findIndex(card => card === cards.players[0].hand[0]));

    // let bets = initBets(cards.players, 1);
    // console.log(bets);

    // let players = initPlayers();
});

const rounds = [];
let players = [];
let roundPlayers = [];
var numOfPlayers = 0;
let host = {};
let scoreboard = {};


let isLobbyDisabled = false;

let cards = {};
let bets = [];
let currentRound = 1;
let modifier = 1;

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

    // GAME STARTS
    socket.on('start game', () => {
        // set up round 1
        setUpRound(currentRound);
        socket.broadcast.emit('go to game');
    });
    socket.on('get current round', () => {
        socket.emit('current round is', currentRound);
    });
    socket.on('get round data', (data) => {
        let roundData = {};
        console.log(players.find(user => user.uniqueId === data.id));
        // draw cards for everyone -> done on round setup
        // myHand
        roundData.myHand = getRoundHand(data);
        console.log(roundData.myHand);
        // myBets
        const userBetInd = bets.findIndex(bet => bet.uniqueId === data.id);
        roundData.myBets = bets[userBetInd];
        // other players
        roundData.players = roundPlayers.filter(player => player.uniqueId !== data.id);
        roundData.trumpCard = cards.trump;
        socket.emit('round data', roundData);
    });
});

function getRoundHand(data) {
    if (data.round === 1) {
        const hands = [];
        cards.players.filter(player => player.uniqueId !== data.id).forEach(player => {
            hands.push(cards.players.filter(user => user.uniqueId === player.uniqueId)[0]);
        });
        return hands;
    } else {
        const ind = cards.players.findIndex(player => player.uniqueId === data.id);
        return cards.players[ind];
    }
}
function setUpRound(currentRound) {
    cards = Object.assign({}, initCards(players));
    cards = Object.assign({}, dealCards(cards, currentRound));
    cards = Object.assign({}, dealTrumpCard(cards));
    bets = initBets(players, currentRound);
    roundPlayers = initPlayers(players);
}
function initPlayers(players) {
    const hostInd = players.findIndex(player => player.isHost === true);
    players.forEach((player, ind, arr) => {
        player.bets = {bet: 0, hits: 0};
        player.status = 'Still betting...';
        player.seatInd = ind;
        player.isDealer = player.isHost;
        player.isFirst = (ind === hostInd + 1) ? true : false;
        player.isReady = false;
    });
    return players;
}
function initBets(players, round) {
    const array = [];
    players.forEach(player => {
        let options = [];
        for (var i = 0; i <= round; i++) {
            options.push(i);
        }

        array.push({
            uniqueId: player.uniqueId,
            bet: 0,
            hits: 0,
            bettingOptions: options
        });
    });
    return array;
}
function dealCards(cards, numCards) {
    cards.players.forEach(player => {
        for (let i = 0; i < numCards; i++) {
            cards = dealCardTo(player, cards);
        }
    });
    return cards;
}
function dealCardTo(player, cards) {
    const ind = cards.players.findIndex(user => user.uniqueId === player.uniqueId);
    const stuff = getRandomInt(0, cards.deck.length - 1);

    cards.players[ind].hand.push(cards.deck[stuff]);
    cards.deck.splice(stuff, 1);

    return cards;
}
function dealTrumpCard(cards) {
    const stuff = getRandomInt(0, cards.deck.length);

    cards.trump = cards.deck[stuff];
    cards.deck.splice(stuff, 1);

    return cards;
}
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function initCards(players) {
    let out = {
        deck: [],
        players: []
    };
    // Deck Init
    const suits = getSuits();
    for (let i = 2; i <= 10; i++) {
        out.deck = out.deck.concat( generateCards(String(i), i, suits) );
    }
    out.deck = out.deck.concat( generateCards('J', 11, suits) );
    out.deck = out.deck.concat( generateCards('Q', 12, suits) );
    out.deck = out.deck.concat( generateCards('K', 13, suits) );
    out.deck = out.deck.concat( generateCards('A', 14, suits) );
    out.deck = Array.from(shuffle( out.deck ));
    // Players Init
    players.forEach(player => {
        out.players.push({
            uniqueId: player.uniqueId,
            hand: []
        });
    });
    return out;
}
function getSuits() {
    return {
        club: 'club',
        diamond: 'diamond',
        heart: 'heart',
        spade: 'spade'
    }
}
function generateCards(name, value, suits) {
    let suitedCards = [];
    [
        suits.club,
        suits.diamond,
        suits.heart,
        suits.spade
    ].forEach(suit => {
        suitedCards.push({
            name: name,
            value: value,
            suit: suit
        });
    });
    return suitedCards;
}
function shuffle(array) {
    let currentIndex = array.length, temporaryValue, randomIndex;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }
    return array;
}
