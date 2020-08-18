import getCodes from './logic/getCodes.js';
import getTree from './logic/getTree.js';
import { createGame, runSimulationStep, runSimulations } from './logic/simulation.js';
import { boardSize } from './logic/constants.js';

let data = {}

function loadFile(event) {
  var image = new Image();
  if (event.target.selectedIndex > 0) {
    image.src = event.target.options[event.target.selectedIndex].value
  } else if (event.target.files) {
    image.src = URL.createObjectURL(event.target.files[0])
  }
  
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
      data[event.target.className] = tree
      document.getElementById("error" + event.target.className).textContent = codes.length + " Karten geladen";
    } catch (err) {
      data[event.target.className] = null
      document.getElementById("error" + event.target.className).textContent = "Fehler:" + err.message;
    }

    if (data.tree1 && data.tree2) {
      calculateStatistics()
      startSimulation()
      document.getElementById("simulation-container").style.display = "block";
      window.scrollTo(0,document.body.scrollHeight);
    } else {
      document.getElementById("simulation-container").style.display = "none";
    }

    URL.revokeObjectURL(image.src) // free memory
  }
}

function calculateStatistics() {
  let trees = [data.tree1, data.tree2]
  
  let nr = 1000
  data.statistics = runSimulations(nr, trees)

  document.getElementById("statistics").innerText = 
  `${nr} Spiele, Siege Spieler 1: ${data.statistics.playerWins[0]}, Siege Spieler 2: ${data.statistics.playerWins[1]}, Unentschieden: ${data.statistics.draws}`

}

function startSimulation() {
  if (data.tree1 && data.tree2) {
    let trees = [data.tree1, data.tree2]
    data.game = createGame(trees)
    clearBoard() 
    drawBoard()
  }
}

function clearBoard() {
  var board = document.getElementById("simulation")
  board.innerHTML = "";
}

function drawBoard() {  
  var board = document.getElementById("simulation")

  let h3 = document.createElement("h3")
  h3.innerText = "Zug " + (data.game.turn + 1) + (data.game.isFinished ? " - Spiel fertig" : "")
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
  if (data.game) {
    runSimulationStep(data.game)
    clearBoard() 
    drawBoard()
  }
}

window.loadFile = loadFile
window.startSimulation = startSimulation
window.nextTurn = nextTurn