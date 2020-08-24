import getCodes from './logic/getCodes2.js';
import getTree from './logic/getTree.js';
import { createGame, runSimulationStep, runSimulations } from './logic/simulation.js';
import { initStage, setupGame, animateStepResult } from './logic/simulationView.js';

let data = {}
let interval = null

function loadFile(event) {
  var image = new Image();
  if (event.target.selectedIndex > 0) {
    image.src = event.target.options[event.target.selectedIndex].value
  } else if (event.target.files) {
    image.src = URL.createObjectURL(event.target.files[0])
  }

  image.onload = function () {

    // all done in memory
    var canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    var context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    let pixels = context.getImageData(0, 0, canvas.width, canvas.height);
    let codes = getCodes(pixels.data, pixels.width, pixels.height)

    //TODO draw on real canvas to debug (show where areas were detected)

    try {
      let tree = getTree(codes)
      data[event.target.className] = tree
      document.getElementById("error" + event.target.className).textContent = codes.length + " cards loaded";
    } catch (err) {
      data[event.target.className] = null
      document.getElementById("error" + event.target.className).textContent = "Error: " + err.message;
    }

    if (data.tree1 && data.tree2) {
      calculateStatistics()
      initSimulation()
    }

    URL.revokeObjectURL(image.src) // free memory
  }
}

function calculateStatistics() {
  let trees = [data.tree1, data.tree2]

  let nr = 1000
  let statistics = runSimulations(nr, trees)

  document.getElementById("stats_draw").innerText = statistics.draws
  document.getElementById("stats_win1").innerText = statistics.playerWins[0]
  document.getElementById("stats_win2").innerText = statistics.playerWins[1]
}

function initSimulation() {
  if (data.tree1 && data.tree2) {
    let trees = [data.tree1, data.tree2]
    data.game = createGame(trees)
    setupGame(data.game)
  }
}

function startSimulation() {
  if (data.game) {
    stopSimulation()
    interval = setInterval(() => {
      let playersResults = runSimulationStep(data.game)
      animateStepResult(playersResults)
    }, 1000)
  }
}

function stopSimulation() {
  if (interval) {
    clearInterval(interval)
    interval = null
  }
}

// functions used from HTML
window.loadFile = loadFile
window.initSimulation = initSimulation
window.startSimulation = startSimulation
window.stopSimulation = stopSimulation
window.initStage = initStage