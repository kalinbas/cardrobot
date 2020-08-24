import { cards, paramCards } from './constants.js'


export default function getTree(codes) {
  let level = 0
  let tree = []

  if (codes.length === 0) {
    throw new Error("No cards detected. Try again")
  }

  // sort by y
  codes.sort((a, b) => a.startY - b.startY)

  while (codes.length > 0) {

    // get from same level
    let sameLevelCodes = codes.filter(c => c.startY < codes[0].endY && codes[0].startY < c.endY)
    sameLevelCodes.sort((a, b) => a.startX - b.startX)

    // process indexes to fill
    let sameLevelIndex = 0
    for (let index = Math.pow(2, level) - 1; index <= Math.pow(2, level + 1) - 2; index++) {

      let parentIndex = Math.floor((index - 1) / 2)

       // fill it if root or parent condition not an action or first if only one output action
      const doProcessIndex = level === 0 || (tree[parentIndex] && !tree[parentIndex].card.isAction) && !(tree[parentIndex].card.hasOneOutput && (index % 2 === 0))

      if (doProcessIndex) {

        if (sameLevelIndex === sameLevelCodes.length) {
          throw new Error(`Missing cards in row ${level}`)
        }

        const code = sameLevelCodes[sameLevelIndex]
        const card = cards[code.value]

        if (!card) {
          throw new Error(`Invalid card code in row ${level}: ${code.value}`)
        }

        sameLevelIndex++

        if (card.isAction || !card.hasParam) {
          tree[index] = { card }
        } else {
          if (sameLevelIndex === sameLevelCodes.length) {
            throw new Error(`Missing param card in row ${level}`)
          }
          const paramCode = sameLevelCodes[sameLevelIndex]
          const paramCard = paramCards[paramCode.value]
          if (!paramCard) {
            throw new Error(`Invalid param card code in row ${level}: ${paramCode.value}`)
          }
          tree[index] = { card, paramCard }
          sameLevelIndex++
        }
      }
    }

    if (sameLevelIndex < sameLevelCodes.length) {
      throw new Error(`Too many cards in row ${level}`)
    }

    // continue with remaining codes on next level
    codes = codes.filter(c => !(c.startY < codes[0].endY && codes[0].startY < c.endY))
    level++
  }

  return tree
}
