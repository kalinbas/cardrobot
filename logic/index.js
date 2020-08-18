var getPixels = require("get-pixels")

const cards = {}
cards[0] = { isAction: true, name: "goahead" }
cards[1] = { isAction: true, name: "goright" }
cards[2] = { isAction: true, name: "goleft" }
cards[3] = { isAction: true, name: "goback" }
cards[4] = { isAction: true, name: "turnright" }
cards[5] = { isAction: true, name: "turnleft" }
cards[6] = { isAction: true, name: "nothing" }
cards[7] = { isAction: true, name: "attack" }
cards[8] = { name: "random" }
cards[9] = { hasParam: true, name: "heartcheck" }
cards[10] = { hasParam: true, name: "enemycheck" }
cards[11] = { hasParam: true, name: "wallcheck" }
cards[12] = { name: "alertcheck" }
cards[13] = { name: "directviewcheck" }
cards[14] = { name: "" }
cards[15] = { name: "" }

const paramCards = {}
paramCards[0] = { values: [1] }
paramCards[1] = { values: [2] }
paramCards[2] = { values: [3] }
paramCards[3] = { values: [4] }
paramCards[4] = { values: [1, 2] }
paramCards[5] = { values: [1, 2, 3] }
paramCards[6] = { values: [2, 3] }
paramCards[7] = { values: [2, 3, 4] }
paramCards[8] = { values: [1, 2, 3, 4] }

const maxLives = 5
const boardSize = 5

// detection params
const lineRatio = 0.25
const minBarSizePercent = 0.005
const maxBarSizePercent = 0.05
const minBarsForAverage = 5
const lineAverageRatio = 0.25
const maxGapX = 10
const maxGapY = 10
const scanStepYPercent = 0.001


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

function runSimulationStep(game) {

  // calculate action
  for (let player of game.players) {
    let action = null
    let index = 0
    while (action === null) {
      let node = player.code[index]
      if (node.card.isAction) {
        action = node.card
      } else {
        let first = false
        switch (node.card.name) {
          case 'random':
            if (Math.random() < 0.5) {
              first = true
            }
            break;
          case 'heartcheck':
            if (node.paramCard.values.includes(player.lives)) {
              first = true
            }
            break;
          case 'enemycheck':
            let enemy = checkPlayerTarget(game, player)
            if (enemy && node.paramCard.values.includes(enemy.distance)) {
              first = true
            }
            break;
          case 'wallcheck':
            let wallDistance = player.d.x === 1 ? game.size - player.x : (player.d.x === -1 ? player.x + 1 : (player.d.y === 1 ? game.size - player.y : player.y + 1))
            if (node.paramCard.values.includes(wallDistance)) {
              first = true
            }
            break;
          case 'alertcheck':
            let otherPlayers = game.players.filter(p => p !== player)
            for (const p of otherPlayers) {
              let t = checkPlayerTarget(game, p)
              if (t && t.player === player && t.distance <= 3) {
                first = true
              }
            }
            break;
          case 'directviewcheck':
            let target = checkPlayerTarget(game, player)
            if (target) {
              first = target.player.d.x === 0 && player.d.x === 0 && target.player.d.y !== player.d.y || target.player.d.y === 0 && player.d.y === 0 && target.player.d.x !== player.d.x
            }
            break;
        }

        if (first) {
          index = index * 2 + 1
        } else {
          index = index * 2 + 2
        }
      }
    }
    player.action = action
  }

  // take first actions
  for (let player of game.players) {
    let d = null
    switch (player.action.name) {
      case "turnleft":
        player.d = turnDirectionRight(player.d, 3)
        break;
      case "turnright":
        player.d = turnDirectionRight(player.d, 1)
        break;
      case "goahead":
        d = player.d
        player.targetPosition = { x: d.x + player.x, y: d.y + player.y }
        break;
      case "goright":
        d = turnDirectionRight(player.d, 1)
        player.targetPosition = { x: d.x + player.x, y: d.y + player.y }
        break;
      case "goback":
        d = turnDirectionRight(player.d, 2)
        player.targetPosition = { x: d.x + player.x, y: d.y + player.y }
        break;
      case "goleft":
        d = turnDirectionRight(player.d, 3)
        player.targetPosition = { x: d.x + player.x, y: d.y + player.y }
        break;
      case "nothing":
        player.lives = Math.min(maxLives, player.lives + 1)
        break;
    }
  }

  // handle moving collisions
  for (let player of game.players) {
    if (player.targetPosition) {

      // crash with player
      let conflictPlayer = game.players.find(p =>
        p !== player &&
        (p.targetPosition && p.targetPosition.x === player.targetPosition.x && p.targetPosition.y === player.targetPosition.y ||
          !p.targetPosition && p.x === player.targetPosition.x && p.y === player.targetPosition.y))

      // if crash with wall - loose life
      if (player.targetPosition.x < 0 || player.targetPosition.x >= game.size || player.targetPosition.y < 0 || player.targetPosition.y >= game.size) {
        player.lives--
      } else if (conflictPlayer) {
        player.lives--
      } else {
        player.x = player.targetPosition.x
        player.y = player.targetPosition.y
      }
    }
  }

  // handle attack and clean up
  for (let player of game.players) {
    if (player.action.name === "attack") {
      let target = checkPlayerTarget(game, player)
      if (target && target.distance < 4) {
        target.player.lives -= 4 - target.distance // 1,2,3 damage depending on distance
      }
    }
    delete player.targetPosition
    delete player.action
  }
  game.turn++
}

function turnDirectionRight(d, nr) {
  let dr = { x: d.x, y: d.y }
  for (let i = 0; i < nr; i++) {
    let ty = dr.y
    dr.y = dr.x
    dr.x = -ty
  }
  return dr
}

function checkPlayerTarget(game, player) {
  for (let i = 1; i < game.size; i++) {
    let otherPlayer = game.players.find(p => p.x === player.x + player.d.x * i && p.y === player.y + player.d.y * i)
    if (otherPlayer) {
      return { player: otherPlayer, distance: i }
    }
  }
  return null
}

function printBoard(game) {
  console.log("Turn #" + game.turn)
  console.log("-------")
  for (let y = 0; y < game.size; y++) {
    let line = "|"
    for (let x = 0; x < game.size; x++) {
      let player = game.players.find(p => p.x === x && p.y === y)
      if (player) {
        line += player.d.x === 1 ? ">" : player.d.x === -1 ? "<" : player.d.y === 1 ? "v" : "^"
      } else {
        line += " "
      }
    }
    line += "|"
    console.log(line)
  }
  console.log("-------")
  console.log("Player 1 - Lives: " + game.players[0].lives)
  console.log("Player 2 - Lives: " + game.players[1].lives)
}

function getTree(codes) {
  let level = 0
  let tree = []

  while (codes.length > 0) {

    // get from same level
    let sameLevelCodes = codes.filter(c => c.startY < codes[0].endY && codes[0].startY < c.endY)
    sameLevelCodes.sort((a, b) => a.startX - b.startX)

    // process indexes to fill
    let sameLevelIndex = 0
    for (let index = Math.pow(2, level) - 1; index <= Math.pow(2, level + 1) - 2; index++) {

      let parentIndex = Math.floor((index - 1) / 2)

      // fill it if root or parent condition not an action
      if (level === 0 || (tree[parentIndex] && !tree[parentIndex].card.isAction)) {

        if (sameLevelIndex === sameLevelCodes.length) {
          throw new Error("Missing card on level" + level)
        }

        const code = sameLevelCodes[sameLevelIndex]
        const card = cards[code.value]

        if (!card) {
          throw new Error("Invalid card code " + code.value)
        }

        sameLevelIndex++

        if (card.isAction || !card.hasParam) {
          tree[index] = { card }
        } else {
          if (sameLevelIndex === sameLevelCodes.length) {
            throw new Error("Missing parameter card on level" + level)
          }
          const paramCode = sameLevelCodes[sameLevelIndex]
          const paramCard = paramCards[paramCode.value]
          if (!paramCard) {
            throw new Error("Invalid param card code " + paramCode.value)
          }
          tree[index] = { card, paramCard }
          sameLevelIndex++
        }
      }
    }

    if (sameLevelIndex < sameLevelCodes.length) {
      throw new Error("Too many cards on level" + level)
    }

    // continue with remaining codes on next level
    codes = codes.filter(c => !(c.startY < codes[0].endY && codes[0].startY < c.endY))
    level++
  }

  return tree
}

function getCodes(pixels) {

  let dimensions = pixels.shape.slice()

  let codes = []
  let notLinkedCodes = []

  let digits = 4

  // store average found code sizes
  let codesAverageSizeSum = 0
  let codesAverageSizeCount = 0
  let codesAverageSize = 0

  const minBarSize = minBarSizePercent * dimensions[0]
  const maxBarSize = maxBarSizePercent * dimensions[0]

  const scanStepY = Math.floor(scanStepYPercent * dimensions[1])

  // identify section
  // double check next line(s)

  for (let y = 0; y < dimensions[1]; y += scanStepY) {

    let darkCount = 0
    let lightCount = 0

    let stage = 0
    let initialDark = 0
    let averageSize = 0
    let startX = 0
    let values = [0, 0, 0, 0]

    for (let x = 0; x < dimensions[0]; x++) {

      let c = (pixels.get(x, y, 0) + pixels.get(x, y, 1) + pixels.get(x, y, 2)) / 3

      // collecting data
      if (stage === 3) {

        let vi = Math.floor((x - (startX + averageSize * 4)) / averageSize)
        if (vi >= digits) {

          // cleanup old entries
          notLinkedCodes = notLinkedCodes.filter(c => Math.abs(c.endY - y) < maxGapY * scanStepY)

          // create value from barcode
          let value = values.reduce((acc, val, index) => { return acc + (val >= averageSize / 2 ? Math.pow(2, index) : 0) }, 0)

          // find closeby
          let closeBy = notLinkedCodes.find(c => Math.abs(c.startX - startX) < maxGapX && Math.abs(c.endX - x) < maxGapX)

          if (closeBy) {
            closeBy.values.push(value)
            closeBy.startX = startX
            closeBy.endX = x
            closeBy.endY = y
          } else {
            let code = { startX, endX: x, startY: y, endY: y, values: [value] }
            codes.push(code)
            notLinkedCodes.push(code)
          }

          stage = 0
        } else if (vi >= 0) {
          if (c <= 128) values[vi]++
        }
      } else {
        if (c < 128) {

          // if inital dark similar to initial light
          if (stage === 1) {
            let ratio = Math.abs(initialDark - lightCount) / Math.max(initialDark, lightCount)
            if (ratio < lineRatio) {
              stage = 2
            } else {
              stage = 0
            }
          }

          darkCount++
          lightCount = 0
        } else {
          if (stage === 0) {
            let averageRatio = Math.abs(codesAverageSize - darkCount) / Math.max(codesAverageSize, darkCount)
            if (darkCount >= minBarSize && darkCount < maxBarSize && (codesAverageSizeCount < minBarsForAverage || averageRatio < lineAverageRatio)) {
              initialDark = darkCount
              startX = x - darkCount
              stage = 1
            } else {
              stage = 0
            }
          } else if (stage === 2) {
            let ratio = Math.abs(initialDark - darkCount) / Math.max(initialDark, darkCount)
            if (ratio < lineRatio) {
              stage = 3
              averageSize = (x - startX) / 3

              codesAverageSizeSum += averageSize
              codesAverageSizeCount++
              codesAverageSize = codesAverageSizeSum / codesAverageSizeCount

              values = [0, 0, 0, 0]
            } else {
              stage = 0
            }
          }

          lightCount++
          darkCount = 0
        }
      }
    }
  }

  // only show codes with correct format
  codes = codes.filter(x => x.endY - x.startY > x.endX - x.startX)

  // calculate most common value for all
  codes.forEach(c => {
    c.value = c.values.reduce((a, b, i, arr) => (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b), 0)
  })

  return codes
}