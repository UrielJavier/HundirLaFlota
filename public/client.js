let ws = new WebSocket('ws://localhost:3001/socket.io/?EIO=3&transport=websocket');
let boatSelected;
let finalMap;
let otherMap;
let btnStart;
const numBoats = 3;
let myBoats = [];
let gameOverDivs = [];
let start = false;
let myTurn = false;
let player;

ws.onopen = () => {
  //console.log("Conectado");
};

ws.onclose = e => {
  //console.log('Coneccion finalizada');
  //console.log(e);
}

ws.onmessage = e => {
  let data = e.data;
  if(data.startsWith('42')) {
    let jsonData = JSON.parse(e.data.substring(2, data.length));
    switch(jsonData[0]) {
      case 'fail-shoot':
        finalMap.children[jsonData[1]].setAttribute('shooted', 'water');
        break;
      case 'fail-shoot-other':
        otherMap.children[jsonData[1]].setAttribute('shooted', 'water');
        break;
      case 'damage-shoot':
        let partBoat = document.getElementById(jsonData[1]+"p")
        partBoat.setAttribute('shooted', 'damage');
        break;
      case 'damage-shoot-other':
        let space2 = otherMap.children[jsonData[1]];
        space2.setAttribute('shooted', 'damage');
        break;
      case 'number-player':
        player = document.getElementById('player').innerHTML = jsonData[1];
        break;
      case 'turn':
        myTurn = (jsonData[1] == player);
        if(myTurn) {
          document.getElementById('turno1').setAttribute('turn', true);
          document.getElementById('turno2').setAttribute('turn', false);
        } else {
          document.getElementById('turno1').setAttribute('turn', false);
          document.getElementById('turno2').setAttribute('turn', true);
        }
        break;
      case 'game-over': 
        gameOver(jsonData[1]);
        break
    }
  }
}

ws.onerror = e => {
  //console.log(e);
}

function send(topic, data) {
  ws.send('42' + JSON.stringify([topic, data]));
}

function live() {
  ws.send('42' + JSON.stringify(['ping', 'pong']));
}

setInterval(live, 25000);


function boatSelection(element) {
  if(!start) {
    boatSelected = element;
    boatSelected.setAttribute('moving', 'true');
  }
}

document.addEventListener('mousemove', (event) => {
  if (event && boatSelected && !start) {
    let x = event.clientX;
    let y = event.clientY;
    boatSelected.style.left = (x - 50) + 'px';
    boatSelected.style.top = (y-25) + 'px';
  }
});

document.addEventListener('mouseup', (event) => {
  let valid = false;

  if(start){return;}

  if(boatSelected) {
    let elementsUnder = document.elementsFromPoint(event.clientX, event.clientY);
    let inMap = elementsUnder.some( element => element.id == "myMap");

    let pos = calculateCoordinates(boatSelected, elementsUnder);
    let validPos = validationPos(boatSelected, pos);

    if(!inMap || !validPos){
      valid = false;
      boatSelected.setAttribute('moving', 'false');
      boatSelected.style.left = null;
      boatSelected.style.top = null;
      boatSelected.setAttribute('valid', 'true');
      boatSelected.setAttribute('row', 'true');
    } else {
      let space = elementsUnder.find(element => element.getAttribute('type') == 'ocean');
      boatSelected.style.left = (space.offsetLeft) + 'px';
      boatSelected.style.top = (space.offsetTop) + 'px';
      valid = true;
    }

    if(valid){
      sendCoordinates(boatSelected, pos);
      enableStart();
    } else {
      send("boat-pos", [false, {"id": boatSelected.id}]);
    } 
  }

  boatSelected = undefined
});

// Habilitar boton de empezar
function enableStart(){
  btnStart.disabled = myBoats.length !== numBoats; 
}

// Girar barco
document.addEventListener('keydown', function (event) {
  if (event.key === 'f' && boatSelected) {
    boatSelected.setAttribute('row', (boatSelected.getAttribute('row') === "false"));
  }
});

// Creacion de mapa
function createMap(num, id) {
  let map = document.getElementById(id);
  for(let i = 0; i < (num*num); i++) {
    var div = document.createElement('div');
    
    if (i<10){
      div.id = '0'.concat(i);
    } else {
      div.id = i;
    }

    if(id != "myMap") div.addEventListener("click", (space) => attack(space));
    div.setAttribute('type', 'ocean');
    map.appendChild(div);
  }

  (id == 'myMap') ? finalMap = map : otherMap = map;
}

// On load
window.onload = function() {
  createMap(10,"myMap");
  createMap(10,"opponentMap");
  btnStart = document.getElementById("helpStart");
  gameOverDivs.push(document.getElementById("gameOver-1"));
  gameOverDivs.push(document.getElementById("gameOver-2"));
  gameOverDivs[0].hidden = true;
  gameOverDivs[1].hidden = true;
  enableStart();
}

// Mandar  coordinadas
function sendCoordinates(boat, pos) {
  let _boat = {"id": boat.id, "pos":pos};
  send("boat-pos", [true, _boat]);
}

// Borrar coordenadas del barco
function removeCoordinates(boat) {
  myBoats.splice(myBoats.indexOf(boat));
}

// Calcular casillas
function calculateCoordinates(boat, raton) {
  let pos = [];
  let space = raton.find(element => element.getAttribute('type') == 'ocean');
  let hor = (boatSelected.getAttribute('row') === "true");

  for(let i = 0; i < boat.children.length; i++){
    if(hor) {
      let y = space.id[0];
      let x = parseInt(space.id[1])+i;
      let posp = y.concat(x);
      pos.push(posp);
      boat.children[i].id = posp+'p';
    } else {
      let y = parseInt(space.id[0])+i;
      let x = space.id[1];
      let posp = y.toString().concat(x);
      pos.push(posp);
      boat.children[i].id = posp+'p';
    }
  }
  return pos;
}

// Validar pos
function validationPos(boat, posBoat) {
  let occupied = false;
  let out = false;
  console.log(myBoats)
  
  for (let i = 0; i < posBoat.length; i++) {
    for (let j = 0; j < myBoats.length; j++) {
      occupied = myBoats[j].pos.some(a => a == posBoat[i]);
      console.log(myBoats[j].pos)
      console.log(posBoat[i])
      if(occupied) break;
    }
    out = posBoat[i].length > 2;
    if(occupied || out) break;
  }

  let valid = !occupied && !out;

  let exists = myBoats.some(bo => {
    return bo.id == boat.id;
  });

  if(valid && !exists) {
    myBoats.push({id:boat.id, pos:posBoat});
  } else if(exists && !valid) {
    const index = myBoats.map(b => b.id).indexOf(boat.id);
    if (index > -1) {
      myBoats.splice(index, 1);
    }

    for (let part = 0; part < boat.children.length; part++) {
      boat.children[part].removeAttribute('id');
    }
  } else if(valid && exists) {
    const index = myBoats.map(b => b.id).indexOf(boat.id);
    if (index > -1) {
      myBoats.splice(index, 1);
    }
    myBoats.push({id:boat.id, pos:posBoat});
  }
  console.log(valid)
  return valid;
}

// Mandar ataque
function attack(space) {
  if(myTurn) send('attack-boat', space.target.id);
}

// Comenzar partida
function startGame() {
  start = true;
  send('start', player);
}

// Terminar partida
function gameOver(ganador) {
  gameOverDivs[0].hidden = false;
  gameOverDivs[1].hidden = false;

  if(ganador[1] == 1) {
    gameOverDivs[0].innerHTML = "WINNER";
    gameOverDivs[1].innerHTML = "LOSSER";
  } else {
    gameOverDivs[0].innerHTML = "LOSSER";
    gameOverDivs[1].innerHTML = "WINNER";
  }
}