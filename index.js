function loadFile(event) {
  var image = new Image();
  image.src = URL.createObjectURL(event.target.files[0]);
  image.onload = function () {
    var canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    var context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);
    var imgd = context.getImageData(0, 0, canvas.width, canvas.height);
    console.log(imgd)
    URL.revokeObjectURL(image.src) // free memory
  }
}