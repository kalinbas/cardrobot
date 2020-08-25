// detection params
const digits = 5
const lineRatio = 0.4

const minBarSize = 3
const maxBarSize = 100

const maxGapX = 10
const maxGapY = 10

const minWidth = 5
const colorThreshold = 128

const scanStepX = 1


export default function getCodes(pixels, width, height) {

  // store all found codes
  let codes = []
  let notLinkedCodes = []

  // identify section
  // double check next line(s)
  for (let x = 0; x < width; x += scanStepX) {

    // remove linkable codes which are too far
    notLinkedCodes = notLinkedCodes.filter(c => Math.abs(c.endX - x) < maxGapX * scanStepX)

    let y = 0

    while (y < height) {

      let startPattern = scanForPattern(x, y, pixels, width, height)
      if (startPattern) {
        let expectedEndCodeStartY = Math.round(startPattern.startY + startPattern.averageBarSize * (digits + 5))
        // start search for endpattern on bar size earlier
        let endPattern = scanForPattern(x, expectedEndCodeStartY - Math.round(startPattern.averageBarSize), pixels, width, height)
        if (endPattern) {
          let barSizeError = Math.abs(endPattern.averageBarSize - startPattern.averageBarSize) / Math.max(endPattern.averageBarSize, startPattern.averageBarSize)
          let barPositionError = Math.abs(endPattern.startY - expectedEndCodeStartY) / startPattern.averageBarSize

          // collect values if ok
          if (barSizeError < 0.5 && barPositionError < 1) {
            let averageBarSize = (endPattern.averageBarSize + startPattern.averageBarSize) / 2
            let dataStartY = Math.round(startPattern.startY + averageBarSize * 4)
            let value = getNumericalValue(x, dataStartY, averageBarSize, pixels, width, height)

            // find close by code saved before
            let closeBy = notLinkedCodes.find(c => Math.abs(c.startY - startPattern.startY) < maxGapY && Math.abs(c.endY - endPattern.endY) < maxGapY)
            if (closeBy) {
              closeBy.values.push(value)
              closeBy.endX = x
              closeBy.endY = Math.max(y, endPattern.endY)
            } else {
              let code = { startX: x, endX: x, startY: startPattern.startY, endY: endPattern.endY, values: [value] }
              codes.push(code)
              notLinkedCodes.push(code)
            }

            // continue after full code
            y = endPattern.endY
          } else {
            // continue after first section of pattern found
            y = startPattern.startY + Math.round(startPattern.averageBarSize)
          }
        } else {
          // continue after first section of pattern found
          y += startPattern.startY + Math.round(startPattern.averageBarSize)
        }
      } else {
        break;
      }
    }
  }

  // only show codes with min width
  codes = codes.filter(x => x.endX - x.startX > minWidth)

  // remove size outliers (needs at least 4 detected codes)
  if (codes.length >= 4) {
    let avgWidth = codes.reduce((a, c) => a + (c.endX - c.startX), 0) / codes.length
    let avgHeight = codes.reduce((a, c) => a + (c.endY - c.startY), 0) / codes.length
    codes = codes.filter(c => Math.abs(c.endX - c.startX - avgWidth) / avgWidth < 0.5)
    codes = codes.filter(c => Math.abs(c.endY - c.startY - avgHeight)  / avgHeight < 0.5)
  }

  // TODO remove overlapping fake codes

  // calculate most common value for all
  codes.forEach(c => {
    c.value = c.values.reduce((a, b, i, arr) => (arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b), 0)
  })

  return codes
}


// gets a numerical value from color information of data section
function getNumericalValue(x, sY, averageSize, pixels, width, height) {
  let values = new Array(digits).fill(0)
  let maxY = Math.round(averageSize * digits)

  for (let y = sY; y < sY + maxY; y++) {
    let vi = Math.floor((y - sY) / averageSize)
    let c = getColorAtPosition(x, y, pixels, width, height)
    if (c < colorThreshold) values[vi]++
  }

  let averageHalf = Math.floor(averageSize / 2)
  return values.reduce((acc, val, index) => { return acc + (val >= averageHalf ? Math.pow(2, index) : 0) }, 0)
}

function getColorAtPosition(x, y, pixels, width, height) {
  let colorIndex = (y * width + x) * 4
  // smoothing color with neighbour pixels
  return (y < 2 || y === height - 2) ?
    (pixels[colorIndex] + pixels[colorIndex + 1] + pixels[colorIndex + 2]) / 3 :
    (pixels[colorIndex - 4] + pixels[colorIndex - 3] + pixels[colorIndex - 2] + pixels[colorIndex] + pixels[colorIndex + 1] + pixels[colorIndex + 2] + pixels[colorIndex + 4] + pixels[colorIndex + 5] + pixels[colorIndex + 6]) / 9

}

// scans a line for start pattern
function scanForPattern(x, sY, pixels, width, height) {

  let darkCount = 0
  let lightCount = 0
  let stage = 0
  let initialDark = 0
  let startY = 0

  for (let y = sY; y < height; y++) {

    let c = getColorAtPosition(x, y, pixels, width, height)

    if (c < colorThreshold) {
      // if inital dark area similar to initial light area
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
          let averageSize = (y - startY) / 3
          return { startY: startY, averageBarSize: averageSize, endY: y }
        } else {
          stage = 0
        }
      }

      lightCount++
      darkCount = 0
    }
  }
  return null
}
