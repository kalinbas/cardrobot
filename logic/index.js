var getPixels = require("get-pixels")
import getCodes from './logic/getCodes.js';
import getTree from './logic/getTree.js';



let img1 = new Promise((res, rej) => {
  getPixels("bots/simple.jpg", function (err, pixels) { if (err) { rej(err) } else { res(pixels) } })
})
let img2 = new Promise((res, rej) => {
  getPixels("bots/basic.jpg", function (err, pixels) { if (err) { rej(err) } else { res(pixels) } })
})
let img3 = new Promise((res, rej) => {
  getPixels("bots/advanced.jpg", function (err, pixels) { if (err) { rej(err) } else { res(pixels) } })
})
let img4 = new Promise((res, rej) => {
  getPixels("bots/complete.jpg", function (err, pixels) { if (err) { rej(err) } else { res(pixels) } })
})


Promise.all([img1, img2, img3, img4]).then(images => {
  const codes = images.map(img => getCodes(img))
  const trees = codes.map(code => getTree(code))
  let statistics = runSimulations(10000, trees)
  console.log(statistics)
}).catch(err => {
  console.log(err)
})



/*
 
 
const game = {
  turn: 0,
  size: 5,
  players: [
    { lives: maxLives, code: tree, x: 2, y: 0, d: { x: 0, y: 1 } },
    { lives: maxLives, code: tree, x: 2, y: 4, d: { x: 0, y: -1 } }
  ]
}
 
 
printBoard(game)
while (game.players.every(p => p.lives > 0)) {
  runSimulationStep(game)
  printBoard(game)
}
*/

function runSimulations(nr, trees) {

  let maxTurns = 50

  let statistics = {
    playerDeaths: trees.map(t => 0),
    draws: 0,
    averageTurns: 0
  }

  for (let i = 0; i < nr; i++) {

    // create random game until all different positions
    let game = null
    while (game == null || game.players.some(p1 => game.players.some(p2 => p1 != p2 && p1.x === p2.x && p1.y === p2.y))) {
      game = {
        turn: 0,
        size: 5,
        players: trees.map(t => ({
          lives: maxLives,
          code: t,
          x: Math.floor(Math.random() * boardSize),
          y: Math.floor(Math.random() * boardSize),
          d: turnDirectionRight({ x: 0, y: 1 }, Math.floor(Math.random() * 4))
        }))
      }
    }

    // 
    let turns = 0
    while (turns < maxTurns && game.players.every(p => p.lives > 0)) {
      runSimulationStep(game)
      turns++
    }
    if (turns == maxTurns) {
      statistics.draws++
    } else {
      for (let pi = 0; pi < game.players.length; pi++) {
        const player = game.players[pi];
        statistics.playerDeaths[pi] += player.lives <= 0 ? 1 : 0
      }
      statistics.averageTurns += turns
    }
  }

  statistics.averageTurns /= nr - statistics.draws

  return statistics
}





