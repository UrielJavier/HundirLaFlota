var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const util = require('util');

let state1 = {player: 1, start: false, valid: false, boats: [], parts: 0};
let state2 = {player: 2, start: false, valid: false, boats: [], parts: 0};
let players = [];
let numBoats = 3;
let gameStarted = false;
let isGameOver = false;
let turn = 0;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  players.push(socket.id);
  let number = players.length === 1 ? 1 : 2;
  io.sockets.connected[socket.id].emit('number-player', number);
  console.log("Se ha conectado un usuario", socket.id);

  // Update pos
  socket.on("boat-pos",data => {
    
    let state = socket.id == players[0] ? state1 : state2;
    let index;
    let updateBoat = state.boats.find( (boat, idx) => {
      let valid = boat.id == data[1].id
      if(valid) {
        index = idx;
        return true;
      }
    });

    if(data[0]){
      let boatPos = data[1].pos;
      if(updateBoat){
        state.boats[index].pos = boatPos;
      } else {
        state.boats.push(data[1]);
        state.parts = boatPos.length + state.parts;
      }
    } else if(index > -1) {
      state.boats.splice(index, 1);
      if(state1.parts > 0) state.parts = state.parts -  parseInt(data[1].id.charAt(1));
    }

    state.valid = state.boats.length == numBoats;
  });

  socket.on('attack-boat', function(data) {
    if(!isGameOver) {
      let state = socket.id == players[0] ? state2 : state1;
      let stateOther = socket.id != players[0] ? state2 : state1;
      let client = socket.id == players[0] ? players[0] : players[1];
      let clientAttacked = socket.id == players[0] ? players[1] : players[0]; 
      let possiblePos = state.boats.map( boat => {
        return boat.pos
      })
      console.log(Array.isArray(possiblePos));
      possiblePos = possiblePos.flat();
      if(possiblePos.includes(data)){
        state.parts --; 
        io.sockets.connected[clientAttacked].emit('damage-shoot', data);
        io.sockets.connected[client].emit('damage-shoot-other', data);
      } else {
        io.sockets.connected[clientAttacked].emit('fail-shoot', data);
        io.sockets.connected[client].emit('fail-shoot-other', data);
      }

      if(state.parts == 0) {
        console.log("Se termino");
        gameOver(clientAttacked, client, stateOther.player);
      } else {
        turn = state.player;
        console.log("Ahora le toca a: " + turn);
        io.sockets.connected[clientAttacked].emit('turn', turn);
        io.sockets.connected[client].emit('turn', turn);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log("Se desconecto: ", socket.id);
    reset();
  });

  socket.on('start', (data) => {
    let state = socket.id == players[0] ? state1 : state2;
    console.log("Este usuario ya quiere comenzar: " + state.player)
    if(data == 1){
      state.start = true;
    } else if (data == 2){
      state.start = true;
    }
    
    if(state1.start && state2.start) {
      gameStarted = true;
      io.sockets.connected[players[0]].emit('turn', state1.player);
      io.sockets.connected[players[1]].emit('turn', state1.player);
      console.log('Comenzo la partida')
    }
  });

  // Tonteria.
  socket.on("ping",data => {
  });
});

function gameOver(client1, client2, ganador) {
  isGameOver = true;
  io.sockets.connected[client1].emit('game-over', [isGameOver, ganador]);
  io.sockets.connected[client2].emit('game-over', [isGameOver, ganador]);
}

function reset() {
  state1 = {player: 1, start: false, valid: false, boats: [], parts: 0};
  state2 = {player: 2, start: false, valid: false, boats: [], parts: 0};
  players = [];
  numBoats = 3;
}

http.listen(3001, () => {
  console.log('listening on *:3001');
});