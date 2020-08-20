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




