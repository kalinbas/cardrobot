import { boardSize } from './constants.js';

let stage = null
let backGroundLayer = null
let playerLayer = null
let players = []

const stageSize = 500

export function initStage() {
  stage = new Konva.Stage({ container: 'simulation', width: stageSize, height: stageSize });
  backGroundLayer = createBackgroundLayer()
  stage.add(backGroundLayer);

  // adapt the stage on any window resize
  fitStageIntoParentContainer();
  window.addEventListener('resize', fitStageIntoParentContainer);
}

function fitStageIntoParentContainer() {
  var container = document.getElementById('simulation-wrapper');

  // now we need to fit stage into parent
  var containerWidth = container.offsetWidth;
  // to do this we need to scale the stage
  var scale = containerWidth / stageSize;

  stage.width(stageSize * scale);
  stage.height(stageSize * scale);
  stage.scale({ x: scale, y: scale });
  stage.draw();
}

function clearGame() {
  players = []
  if (playerLayer !== null) {
    playerLayer.destroy()
  }
  playerLayer = null
}

export function setupGame(game) {

  clearGame()

  playerLayer = new Konva.Layer()

  let imageObj = new Image();
  imageObj.src = "assets/sprite.png"
  imageObj.onload = function () {
    players = game.players.map((p, i) => createPlayer(i, p.x, p.y, p.d.x, p.d.y, imageObj))
    players.forEach(p => playerLayer.add(p.playerGroup))
    stage.add(playerLayer);
  }
}

export function animateStepResult(playersResults) {
  for (const [i, playerResult] of playersResults.entries()) {
    if (playerResult.deltaLives !== 0) {
      changeHeartsAnimated(players[i].hearts, playerResult.lives)
    }
    if (playerResult.action === "attack") {
      let tx = Math.min(450, Math.max(50, players[i].playerGroup.x() + (playerResult.attackDistance * playerResult.d.x * 100)))
      let ty = Math.min(450, Math.max(50, players[i].playerGroup.y() + (playerResult.attackDistance * playerResult.d.y * 100)))
      shotAnimated(tx, ty, players[i].playerGroup, playerLayer)
    }
    if (playerResult.isCrash) {
      // TODO crash animation
    } else {
      if (["goahead", "goright", "goleft", "goback"].includes(playerResult.action)) {
        moveToCoordsAnimated(playerResult.x * 100 + 50, playerResult.y * 100 + 50, players[i].playerGroup)
      }
    }
    if (playerResult.action === "turnleft") {
      rotateAnimated(false, players[i].playerGroup)
    }
    if (playerResult.action === "turnright") {
      rotateAnimated(true, players[i].playerGroup)
    }
    if (playerResult.lives <= 0 && players[i].playerGroup.opacity() > 0) {
      dieAnimated(players[i].playerGroup)
    }
  }
}

function createBackgroundLayer() {

  let backgroundLayer = new Konva.Layer();

  {
    let rect = new Konva.Rect({
      x: 0,
      y: 0,
      width: 500,
      height: 500,
      stroke: 'black',
      strokeWidth: 8,
    })
    backgroundLayer.add(rect)
  }

  for (let x = 0; x < 5; x++) {
    let rect = new Konva.Rect({
      x: x * 100,
      y: 0,
      width: 100,
      height: 500,
      stroke: 'black',
      strokeWidth: 1,
    })
    backgroundLayer.add(rect)
  }
  for (let y = 0; y < 5; y++) {
    let rect = new Konva.Rect({
      x: 0,
      y: 100 * y,
      width: 500,
      height: 100,
      stroke: 'black',
      strokeWidth: 1,
    })
    backgroundLayer.add(rect)
  }

  return backgroundLayer
}

function createPlayer(i, x, y, dx, dy, imageObj) {
  let animations = {
    idle: [
      0, 0, 90, 90, 90, 0, 90, 90,
    ],
    punch: [
      90, 0, 90, 90, 0, 0, 90, 90,
    ],
  }

  let playerGroup = new Konva.Group({
    x: x * 100 + 50,
    y: y * 100 + 50,
    rotation: dx === 1 ? 90 : dx === -1 ? 270 : dy === -1 ? 0 : 180,
    offset: {
      x: 45,
      y: 45,
    }
  });

  let player = new Konva.Sprite({
    x: 0,
    y: 0,
    image: imageObj,
    animation: i === 0 ? 'idle' : 'punch',
    animations: animations,
    frameRate: 2,
    frameIndex: 0
  })
  playerGroup.add(player)

  let hearts = []

  for (let index = 0; index < 5; index++) {
    let heart = new Konva.Circle({
      x: index * 20 + 5,
      y: 5,
      radius: 5,
      fill: 'red',
      stroke: 'red',
      strokeWidth: 0,
    });
    playerGroup.add(heart)
    hearts.push(heart)
  }
  return { playerGroup, hearts, player }
}

function moveToCoordsAnimated(x, y, obj) {
  let tween = new Konva.Tween({
    node: obj,
    duration: 1,
    x: x,
    y: y,
    //easing: Konva.Easings.EaseInOut,
  })
  tween.play()
}

function rotateAnimated(isRight, obj) {
  let tween = new Konva.Tween({
    node: obj,
    duration: 1,
    rotation: obj.rotation() + (isRight ? 90 : -90),
    //easing: Konva.Easings.EaseInOut,
  })
  tween.play()
}

function dieAnimated(obj) {
  // die after animation
  setTimeout(() => {
    let tween = new Konva.Tween({
      node: obj,
      duration: 1,
      opacity: 0
    })
    tween.play()
  }, 1000)
}


function shotAnimated(tx, ty, obj, layer) {

  // shot after half animation time
  setTimeout(() => {
    let shot = new Konva.Circle({
      x: obj.x(),
      y: obj.y(),
      radius: 5,
      fill: 'black',
      stroke: 'black',
      strokeWidth: 0,
    });

    layer.add(shot)

    let tween = new Konva.Tween({
      node: shot,
      duration: 0.5,
      x: tx,
      y: ty,
      //easing: Konva.Easings.EaseIn,
      onFinish: function () {
        shot.destroy()
      },
    })
    tween.play()
  }, 500)
}

function changeHeartsAnimated(hearts, lives) {
  for (let index = 0; index < 5; index++) {
    let tween = new Konva.Tween({
      node: hearts[index],
      duration: 1,
      opacity: lives > index ? 1 : 0
    })
    tween.play()
  }
}
