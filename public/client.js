let ws = new WebSocket('ws://localhost:3000/socket.io/?EIO=3&transport=websocket');

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
    let finalMap = document.getElementById('myMap');
    
    if(jsonData[0] == 'fail-shoot') {
      finalMap.children[jsonData[1]].setAttribute('shooted', 'water');
    }

    if(jsonData[0] == 'damage-shoot'){
      let finalMap = document.getElementById('myMap');
      let space = finalMap.children[jsonData[1]];
      let over = document.elementsFromPoint(space.getBoundingClientRect().left, space.getBoundingClientRect().top);
      let partBoat = over.find(element => element.className == "partBoat");
      partBoat.setAttribute('shooted', 'damage');
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

let boatSelected;
let myBoats = [];

function boatSelection(element) {
  boatSelected = element;
}

document.addEventListener('mousemove', (event) => {
  if (event && boatSelected) {
    let x = event.clientX;
    let y = event.clientY;
    boatSelected.style.left = (x - 50) + 'px';
    boatSelected.style.top = (y-25) + 'px';
  }
});

document.addEventListener('mouseup', (event) => {
  let valid = false;
  if(boatSelected) {
    let elementsUnder = document.elementsFromPoint(event.clientX, event.clientY);
    let inMap = elementsUnder.some( element => element.id == "myMap");

    let pos = calculateCoordinates(boatSelected);
    console.log('-',pos)
    let boatsUnder = pos.some(coo => {
      for (let i = 0; i < myBoats.length; i++) {
        const posBoat = myBoats[i].pos;
        console.log('+',posBoat)
        let coinci = posBoat.some(e=>{
          return e === coo;
        }); 
        if(coinci) {
          return true;
        }
      }
    });

    if(!inMap || boatsUnder){
      valid = false;
      boatSelected.style.left = null;
      boatSelected.style.top = null;
      boatSelected.setAttribute('valid', 'true');
      boatSelected.setAttribute('row', 'true');
    } else {
      let space = elementsUnder.find(element => element.getAttribute('type') == 'ocean');
      let hor = (boatSelected.getAttribute('row') === "true");
      let tam = boatSelected.children.length;
      let spaceHor = hor ? space.id.charAt(1) : space.id.charAt(0);
      if(hor) {
        if (parseInt(spaceHor)+tam > 10 ) {
          valid = false;
          boatSelected.setAttribute('valid', valid);
        } else {
          valid = true;
          boatSelected.setAttribute('valid', valid);
        }
      } else {
        if (parseInt(spaceHor)+tam > 10 ) {
          valid = false;
          boatSelected.setAttribute('valid', valid);
        } else {
          valid = true;
          boatSelected.setAttribute('valid', valid);
        }
      }
      boatSelected.style.left = (space.offsetLeft -16) + 'px';
      boatSelected.style.top = (space.offsetTop-16) + 'px';
    }

    if(valid){
      sendCoordinates(boatSelected);
    } else {
      send("boat-pos", [false, {"id": boatSelected.id}]);
    } 
  }

  boatSelected = undefined
});

// Girar barco
document.addEventListener('keydown', function (event) {
  if (event.key === 'f' && boatSelected) {
    boatSelected.setAttribute('row', (boatSelected.getAttribute('row') === "false"));
  }
  console.log(boatSelected.getAttribute('row'))
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

    div.addEventListener("click", (space) => attack(space));
    div.setAttribute('type', 'ocean');
    map.appendChild(div);
  }
  finalMap = map;
}

// On load
window.onload = function() {
  createMap(10,"myMap");
  createMap(10,"opponentMap");
}

// Mandar  coordinadas
function sendCoordinates(boat) {
  let pos = calculateCoordinates(boat);
  let _boat = {"id": boat.id, "pos":pos};
  let exists = myBoats.find(element => {
    return element.id == boat.id;
  });

  if(exists) {
    myBoats[myBoats.indexOf(exists)] = _boat;
  } else { 
    myBoats.push(_boat);
  }
  send("boat-pos", [true, _boat]);
}

// Borrar coordenadas del barco
function removeCoordinates(boat) {
  myBoats.splice(myBoats.indexOf(boat));
}

// Calcular casillas
function calculateCoordinates(boat) {
  let pos = [];
  for (let i = 0; i < boat.children.length; i++) {
    let under = document.elementsFromPoint(boat.children[i].getBoundingClientRect().left, boat.children[i].getBoundingClientRect().top);
    let space = under.find(element => {
      return element.getAttribute('type') == 'ocean';
    });
    if(space) pos.push(space.id);
  }
  return pos;
}

// Mandar ataque
function attack(space) {
  send('attack-boat', space.target.id);
}