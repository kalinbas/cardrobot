import { boardSize, maxLives } from './constants.js'

export function createGame(trees) {
  let game = null
  while (game == null || game.players.some(p1 => game.players.some(p2 => p1 != p2 && p1.x === p2.x && p1.y === p2.y))) {
    game = {
      turn: 0,
      size: 5,
      players: trees.map((t, i) => ({
        name: `Spieler ${i + 1}`,
        lives: maxLives,
        code: t,
        x: Math.floor(Math.random() * boardSize),
        y: Math.floor(Math.random() * boardSize),
        d: turnDirectionRight({ x: 0, y: 1 }, Math.floor(Math.random() * 4))
      }))
    }
  }
  return game
}

export function runSimulationStep(game) {

  //TODO  if all minus one player dead
  

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

function debugPrintBoard(game) {
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
