// detection params
const lineRatio = 0.25
const minBarSizePercent = 0.005
const maxBarSizePercent = 0.05
const minBarsForAverage = 5
const lineAverageRatio = 0.25
const maxGapX = 10
const maxGapY = 10
const scanStepYPercent = 0.001

export default function getCodes(pixels, width, height) {

  let codes = []
  let notLinkedCodes = []

  let digits = 4

  // store average found code sizes
  let codesAverageSizeSum = 0
  let codesAverageSizeCount = 0
  let codesAverageSize = 0

  const minBarSize = minBarSizePercent * width
  const maxBarSize = maxBarSizePercent * width

  const scanStepY = Math.max(Math.floor(scanStepYPercent * height), 1)

  // identify section
  // double check next line(s)

  for (let y = 0; y < height; y += scanStepY) {

    let darkCount = 0
    let lightCount = 0

    let stage = 0
    let initialDark = 0
    let averageSize = 0
    let startX = 0
    let values = [0, 0, 0, 0]

    for (let x = 0; x < width; x++) {

      var colorIndex = (y * width + x) * 4
      let c = (pixels[colorIndex] + pixels[colorIndex + 1] + pixels[colorIndex + 2]) / 3

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