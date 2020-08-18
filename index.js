import getCodes from './logic/getCodes.js';
import getTree from './logic/getTree.js';
import { createGame, runSimulationStep } from './logic/simulation.js';
import { boardSize } from './logic/constants.js';

let data = {}

function loadFile(event) {
  var image = new Image();
  image.src = URL.createObjectURL(event.target.files[0]);
  image.onload = function () {
    var canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    var context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    let pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    let codes = getCodes(pixels.data, pixels.width, pixels.height)

    try {
      let tree = getTree(codes)
      data[event.target.id] = tree
      document.getElementById("error" + event.target.id).textContent = codes.length + " Karten geladen";
    } catch (err) {
      document.getElementById("error" + event.target.id).textContent = "Fehler:" + err.message;
    }

    document.getElementById("simulation").innerHTML = "";

    if (data.tree1 && data.tree2) {
      startSimulation()
    } 

    URL.revokeObjectURL(image.src) // free memory
  }
}

function startSimulation() {
  if (data.tree1 && data.tree2) {
    data.game = createGame([data.tree1, data.tree2])
    drawBoard()
  }
}

function drawBoard() {  
  var board = document.getElementById("simulation")
  board.innerHTML = "";

  let h3 = document.createElement("h3")
  h3.innerText = "Zug " + (data.game.turn + 1)
  board.appendChild(h3)

  for (let y = 0; y < boardSize; y++) {
    for (let x = 0; x < boardSize; x++) {
      let div = document.createElement("div")
      let player = data.game.players.find(p => p.x === x && p.y === y)
      if (player) {
        div.innerText = player.name + " (" + player.lives + ")" +  (player.d.x === 1 ? ">" : player.d.x === -1 ? "<" : player.d.y === 1 ? "v" : "^")
      }
      board.appendChild(div)
    }
  }
}

function nextTurn() {
  runSimulationStep(data.game)
  drawBoard()
}

window.loadFile = loadFile
window.startSimulation = startSimulation
window.nextTurn = nextTurn