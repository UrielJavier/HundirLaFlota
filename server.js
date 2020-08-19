var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

const util = require('util');

let state1 = {valid: false, boats: [], parts: 0};
let numBoats = 3;

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log(`a user connected ${socket.id}`);
  
  // Update pos
  socket.on("boat-pos",data => {
    let index;
    let updateBoat = state1.boats.find( (boat, idx) => {
      let valid = boat.id == data[1].id
      if(valid) {
        index = idx;
        return true;
      }
    });

    if(data[0]){
      let boatPos = data[1].pos;
      if(updateBoat){
        state1.boats[index].pos = boatPos;
      } else {
        state1.boats.push(data[1]);
        state1.parts = boatPos.length + state1.parts;
      }
    } else if(index > -1) {
      state1.boats.splice(index, 1);
      if(state1.parts > 0) state1.parts = state1.parts -  parseInt(data[1].id.charAt(1));
    }

    state1.valid = state1.boats.length == numBoats;
    console.log(util.inspect(state1, {depth: null}));
  });

  socket.on('attack-boat', function(data) {
    let possiblePos = state1.boats.map( boat => {
      return boat.pos
    })
    possiblePos = possiblePos.flat();
    if(possiblePos.includes(data)){
      io.sockets.emit('damage-shoot', data);
    } else {
      io.sockets.emit('fail-shoot', data);
    }
  });

  // Tonteria.
  socket.on("ping",data => {
    console.log(data);
  });
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});