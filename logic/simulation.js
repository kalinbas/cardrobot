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
        flags: [], // set flags from last turn
        x: Math.floor(Math.random() * boardSize),
        y: Math.floor(Math.random() * boardSize),
        d: turnDirectionRight({ x: 0, y: 1 }, Math.floor(Math.random() * 4))
      }))
    }
  }
  return game
}

// runs simulation and returns outcome for each player (to be displayed)
export function runSimulationStep(game) {

  // turn resulting actions which need to be rendered somehow by ui
  let result = game.players.map(p => ({ deltaLives: 0 }))

  // if game is finished - return
  if (game.isFinished) {
    return result
  }

  // calculate action
  for (let [i, player] of game.players.entries()) {
    let action = null
    let index = 0
    let newFlags = []
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
          case 'setflags':
            // set flags on player immediately for this turn and next turn (if not set again will disappear)
            newFlags.push(...node.paramCard.values)
            player.flags.push(...node.paramCard.values)
            first = true // always use first output
            break;
          case 'flagscheck':
            if (node.paramCard.values.some(v => player.flags.includes(v))) {
              first = true
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
    player.flags = newFlags
    player.action = action
    result[i].action = action.name
  }

  // take first actions
  for (let [i, player] of game.players.entries()) {
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
        if (player.lives < maxLives) {
          result[i].deltaLives += 1
          player.lives += 1
        }
        break;
    }
  }

  // check invalid moves
  for (let [i, player] of game.players.entries()) {
    if (player.targetPosition) {
      // if crash with wall - loose life
      if (player.targetPosition.x < 0 || player.targetPosition.x >= game.size || player.targetPosition.y < 0 || player.targetPosition.y >= game.size) {
        player.lives--
        result[i].deltaLives--
        result[i].isCrash = true
        delete player.targetPosition
      }
    }
  }

  // handle moving collisions
  for (let [i, player] of game.players.entries()) {
    if (player.targetPosition) {

      // crash with player
      let conflictPlayer = game.players.find(p =>
        p !== player &&
        ((p.targetPosition && p.targetPosition.x === player.targetPosition.x && p.targetPosition.y === player.targetPosition.y) ||
          (p.x === player.targetPosition.x && p.y === player.targetPosition.y)))

      if (conflictPlayer) {
        player.lives--
        result[i].deltaLives--
        result[i].isCrash = true
      } else {
        // move only if no conflict
        player.x = player.targetPosition.x
        player.y = player.targetPosition.y
      }
    }
  }

  // handle attack and clean up
  for (let [i, player] of game.players.entries()) {
    if (player.action.name === "attack") {
      let target = checkPlayerTarget(game, player)
      if (target && target.distance < 4) {
        target.player.lives -= 4 - target.distance // 1,2,3 damage depending on distance
        result[game.players.indexOf(target.player)].deltaLives -= 4 - target.distance // 1,2,3 damage depending on distance
        result[i].attackDistance = target.distance
      } else {
        result[i].attackDistance = 4
      }
    }
    delete player.targetPosition
    delete player.action
  }

  // set final lives
  for (let [i, player] of game.players.entries()) {
    result[i].lives = player.lives
    result[i].d = player.d
    result[i].x = player.x
    result[i].y = player.y
  }

  //if all minus one player dead - set finished
  let aliveCount = game.players.reduce((n, x) => n + (x.lives > 0), 0);
  if (aliveCount < 2) {
    if (aliveCount > 0) {
      let winner = game.players.find(p => p.lives > 0)
      winner.isWinner = true
      game.winner = winner
      result[game.players.indexOf(game.winner)].isWinner = true
    }
    game.isFinished = true
  }

  game.turn++

  return result
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

export function runSimulations(nr, trees) {

  let maxTurns = 100

  let statistics = {
    playerWins: trees.map(t => 0),
    draws: 0,
    averageTurns: 0
  }

  for (let i = 0; i < nr; i++) {

    let game = createGame(trees)

    let turns = 0
    while (turns < maxTurns && !game.isFinished) {
      runSimulationStep(game)
      turns++
    }

    // is a draw when not finished or when none wins
    if (turns == maxTurns) {
      statistics.draws++
    } else {
      for (let pi = 0; pi < game.players.length; pi++) {
        statistics.playerWins[pi] += game.players[pi].isWinner ? 1 : 0
      }
      if (!game.players.some(p => p.isWinner)) {
        statistics.draws++
      }
      statistics.averageTurns += turns
    }
  }

  statistics.averageTurns /= nr - statistics.draws

  return statistics
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
