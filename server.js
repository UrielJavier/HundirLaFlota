var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const util = require('util');

let state1 = {player: 1, valid: false, boats: [], parts: 0};
let state2 = {player: 2, valid: false, boats: [], parts: 0};
let players = [];
let numBoats = 3;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log(`a user connected ${socket.id}`);
  players.push(socket.id);

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
    let state = socket.id == players[0] ? state2 : state1;
    let client = socket.id == players[0] ? players[1] : players[0]; 
    let possiblePos = state.boats.map( boat => {
      return boat.pos
    })
    possiblePos = possiblePos.flat();

    if(possiblePos.includes(data)){
      state.parts --; 
      io.sockets.connected[client].emit('damage-shoot', data);
    } else {
      io.sockets.connected[client].emit('fail-shoot', data);
    }
  });

  // Tonteria.
  socket.on("ping",data => {
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});