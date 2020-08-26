const cards = {}
cards[0] = { isAction: true, name: "goahead" }
cards[1] = { isAction: true, name: "goright" }
cards[2] = { isAction: true, name: "goleft" }
cards[3] = { isAction: true, name: "goback" }
cards[4] = { isAction: true, name: "turnright" }
cards[5] = { isAction: true, name: "turnleft" }
cards[6] = { isAction: true, name: "heal" }
cards[7] = { isAction: true, name: "attack" }
cards[8] = { name: "random" }
cards[9] = { hasParam: true, name: "heartcheck" }
cards[10] = { hasParam: true, name: "enemycheck" }
cards[11] = { hasParam: true, name: "wallcheck" }
cards[12] = { name: "alertcheck" }
cards[13] = { name: "directviewcheck" }
cards[14] = { hasParam: true, name: "setflags", hasOneOutput: true }
cards[15] = { hasParam: true, name: "flagscheck" }

const paramCards = {}
paramCards[0] = { values: [1] }
paramCards[1] = { values: [2] }
paramCards[2] = { values: [3] }
paramCards[3] = { values: [4] }
paramCards[4] = { values: [5] }
paramCards[5] = { values: [1, 2] }
paramCards[6] = { values: [2, 3] }
paramCards[7] = { values: [3, 4] }
paramCards[8] = { values: [4, 5] }
paramCards[9] = { values: [1, 2, 3] }
paramCards[10] = { values: [2, 3, 4] }
paramCards[11] = { values: [3, 4, 5] }
paramCards[12] = { values: [1, 2, 3, 4] }
paramCards[13] = { values: [2, 3, 4, 5] }
paramCards[14] = { values: [1, 2, 3, 4, 5] }

const maxLives = 5
const boardSize = 5

export { cards, paramCards, maxLives, boardSize }