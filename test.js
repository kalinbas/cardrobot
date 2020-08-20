const getPixels = require("get-pixels")
const getTree = require("./logic/getTree.js")
const getCodes2 = require("./logic/getCodes2.js")

let img1 = new Promise((res, rej) => {
  getPixels("bots/simple.jpg", function (err, pixels) { if (err) { rej(err) } else { res(pixels) } })
})


Promise.all([img1]).then(images => {
  const codes = images.map(img => getCodes2(img.data, img.shape[0], img.shape[1]))
  const tree = getTree
  console.log(codes)
}).catch(err => {
  console.log(err)
})
