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
  let jsonData = JSON.parse(e.data.substring(2, data.length));
  let finalMap = document.getElementById('myMap');
  
  if(jsonData[0] == 'fail-shoot') {
    finalMap.children[jsonData[1]].className = finalMap.children[jsonData[1]].className.concat(' out');
  }

  if(jsonData[0] == 'damage-shoot'){
    let finalMap = document.getElementById('myMap');
    let space = finalMap.children[jsonData[1]];
    let over = document.elementsFromPoint(space.getBoundingClientRect().left, space.getBoundingClientRect().top);
    let partBoat = over.find(element => element.className == "partBoat");
    partBoat.className = partBoat.className.concat(' damage');    
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

    let boatsUnder = false;
    for (let i = 0; i < boatSelected.children.length; i++) {
      let part = boatSelected.children[i];
      let underBoat = document.elementsFromPoint(part.offsetParent.offsetLeft, part.offsetParent.offsetTop);
      let boatsUnder = underBoat.filter( element => element.className.includes('boat'));
      if(boatsUnder && boatsUnder.length > 1) {
        boatsUnder = true;
        break;
      }
    }

    if(!inMap || boatsUnder){
      valid = false;
      boatSelected.style.left = null;
      boatSelected.style.top = null;
      boatSelected.className = boatSelected.id + " boat valid hor";
    } else {
      let space = elementsUnder.find(element => element.className == "space");
      let hor = boatSelected.className.includes('hor');
      let tam = boatSelected.children.length;
      if(hor) {
        let spaceHor = space.id.charAt(1);
        if (parseInt(spaceHor)+tam > 10 ) {
          boatSelected.className = boatSelected.id + " boat invalid hor";
          valid = false;
        } else {
          boatSelected.className = boatSelected.id + " boat valid hor";
          valid = true;
        }
      } else {
        let spaceHor = space.id.charAt(0);
        if (parseInt(spaceHor)+tam > 10 ) {
          boatSelected.className = boatSelected.id + " boat invalid ver";
          valid = false;
        } else {
          boatSelected.className = boatSelected.id + " boat valid ver";
          valid = true;
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

document.addEventListener('keydown', function (event) {
  if (event.key === 'f' && boatSelected) {
    if(boatSelected.className.includes('hor')) {
      boatSelected.className = boatSelected.id + ' boat valid ver'
    } else {
      boatSelected.className = boatSelected.id + ' boat valid hor';
    }
  }
});

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
    div.className = 'space';
    map.appendChild(div);
  }
  finalMap = map;
}

window.onload = function() {
  createMap(10,"myMap");
  createMap(10,"opponentMap");
}

function sendCoordinates(boat) {
  let pos = [];
  for (let i = 0; i < boat.children.length; i++) {
    let under = document.elementsFromPoint(boat.children[i].getBoundingClientRect().left, boat.children[i].getBoundingClientRect().top);
    let space = under.find(element => {
      return element.className.includes('space');
    });
    pos.push(space.id);
  }
  send("boat-pos", [true, {"id": boat.id, "pos":pos}]);
}

function attack(space) {
  send('attack-boat', space.target.id);
}