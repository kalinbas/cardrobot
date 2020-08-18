import { cards, paramCards } from './constants.js'


export default function getTree(codes) {
  let level = 0
  let tree = []

  if (codes.length === 0) {
    throw new Error("Keine Karten gefunden. Versuche es erneut.")
  }

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
          throw new Error("Fehlende Karten in der Reihe " + level)
        }

        const code = sameLevelCodes[sameLevelIndex]
        const card = cards[code.value]

        if (!card) {
          throw new Error("Ungültiger Kartencode " + code.value)
        }

        sameLevelIndex++

        if (card.isAction || !card.hasParam) {
          tree[index] = { card }
        } else {
          if (sameLevelIndex === sameLevelCodes.length) {
            throw new Error("Fehlende Parameterkarte in Reihe " + level)
          }
          const paramCode = sameLevelCodes[sameLevelIndex]
          const paramCard = paramCards[paramCode.value]
          if (!paramCard) {
            throw new Error("Ungültiger Parameterkartencode " + paramCode.value)
          }
          tree[index] = { card, paramCard }
          sameLevelIndex++
        }
      }
    }

    if (sameLevelIndex < sameLevelCodes.length) {
      throw new Error("Zuviele Karten in Reihe " + level)
    }

    // continue with remaining codes on next level
    codes = codes.filter(c => !(c.startY < codes[0].endY && codes[0].startY < c.endY))
    level++
  }

  return tree
}
