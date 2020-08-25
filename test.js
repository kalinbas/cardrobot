const getPixels = require("get-pixels")
const getTree = require("./logic/getTree.js")
const getCodes = require("./logic/getCodes.js")

let img1 = new Promise((res, rej) => {
  getPixels("bots/simple.jpg", function (err, pixels) { if (err) { rej(err) } else { res(pixels) } })
})

Promise.all([img1]).then(images => {
  const codes = images.map(img => getCodes(img.data, img.shape[0], img.shape[1]))
  console.log(codes)
}).catch(err => {
  console.log(err)
})
