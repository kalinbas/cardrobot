// detection params
const digits = 5
const lineRatio = 0.3
const minBarSizePercent = 0.0001
const maxBarSizePercent = 0.05
const maxGapX = 10
const maxGapY = 10
const scanStepXPercent = 0.001
const minWidth = 4

export default function getCodes2(pixels, width, height) {

  let codes = []
  let notLinkedCodes = []

  const minBarSize = Math.max(Math.floor(minBarSizePercent * width), 1)
  const maxBarSize = Math.max(Math.floor(maxBarSizePercent * width), 1)
  const scanStepX = Math.max(Math.floor(scanStepXPercent * width), 1)

  // identify section
  // double check next line(s)
  for (let x = 0; x < width; x += scanStepX) {

    let darkCount = 0
    let lightCount = 0

    let stage = 0
    let initialDark = 0
    let averageSize = 0
    let startY = 0
    let values = null

    for (let y = 0; y < height; y++) {

      let colorIndex = (y * width + x) * 4

      // smoothing color 
      let c = (y === 0 || y === height -1) ? 
        (pixels[colorIndex] + pixels[colorIndex + 1] + pixels[colorIndex + 2]) / 3 :
        (pixels[colorIndex - 4] + pixels[colorIndex - 3] + pixels[colorIndex - 2] + pixels[colorIndex] + pixels[colorIndex + 1] + pixels[colorIndex + 2] + pixels[colorIndex + 4] + pixels[colorIndex + 5] + pixels[colorIndex + 6]) / 9

      // collecting data
      if (stage === 3) {

        let vi = Math.floor((y - (startY + averageSize * 4)) / averageSize)
        if (vi >= digits + 4) {

          // cleanup old entries
          notLinkedCodes = notLinkedCodes.filter(c => Math.abs(c.endX - x) < maxGapX * scanStepX)

          let avgHalf = averageSize / 2

          // create value from barcode
          let value = values.slice(0, digits).reduce((acc, val, index) => { return acc + (val >= avgHalf ? Math.pow(2, index) : 0) }, 0)

          // use last digits for validation
          let valid = values[digits] <= avgHalf && values[digits + 1] >= avgHalf && values[digits + 2] <= avgHalf && values[digits + 3] >= avgHalf

          // if code is valid
          if (valid) {
            // find closeby
            let closeBy = notLinkedCodes.find(c => Math.abs(c.startY - startY) < maxGapY && Math.abs(c.endY - y) < maxGapY)

            if (closeBy) {
              closeBy.values.push(value)
              closeBy.endX = x
              closeBy.endY = y
            } else {
              let code = { startX: x, endX: x, startY, endY: y, values: [value] }
              codes.push(code)
              notLinkedCodes.push(code)
            }
          }

          stage = 0
        } else if (vi >= 0) {
          if (c < 128) values[vi]++
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
            if (darkCount >= minBarSize && darkCount < maxBarSize) {
              initialDark = darkCount
              startY = y - darkCount
              stage = 1
            } else {
              stage = 0
            }
          } else if (stage === 2) {
            let ratio = Math.abs(initialDark - darkCount) / Math.max(initialDark, darkCount)
            if (ratio < lineRatio) {
              averageSize = (y - startY) / 3
              stage = 3
              values = new Array(digits + 4).fill(0)
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
  codes = codes.filter(x => x.endY - x.startY > x.endX - x.startX && x.endX - x.startX > minWidth)

  // calculate most common value for all
  codes.forEach(c => {
    c.value = c.values.reduce((a, b, i, arr) => (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b), 0)
  })

  return codes
}