var createGame = require('voxel-engine')
var voxel = require('voxel')
var skin = require('minecraft-skin')
var oculus = require('./voxel-oculus')

var game = createGame({
  generate: voxel.generator['Valley'],
  startingPosition: [185, 100, 0],
  texturePath: 'textures/',
  statsDisabled: true // not working :-(
})

window.game = game // for debugging

var container = document.body

game.appendTo(container)

container.addEventListener('click', function() {
  game.requestPointerLock(container)
})

// rotate camera left so it points at the characters
game.controls.yawObject.rotation.y = 1.5

var maxogden = skin(game.THREE, 'textures/maxogden.png').createPlayerObject()
maxogden.position.set(0, 62, 20)
game.scene.add(maxogden)

var substack = skin(game.THREE, 'textures/substack.png').createPlayerObject()
substack.position.set(0, 62, -20)
game.scene.add(substack)

var currentMaterial = 1

game.on('mousedown', function (pos) {
  if (erase) game.setBlock(pos, 0)
  else game.createBlock(pos, currentMaterial)
})

var erase = true
window.addEventListener('keydown', function (ev) {
  if (ev.keyCode === 'X'.charCodeAt(0)) {
    erase = !erase
  }
})

function ctrlToggle (ev) { erase = !ev.ctrlKey }
window.addEventListener('keyup', ctrlToggle)
window.addEventListener('keydown', ctrlToggle)

var effect = new oculus(game, {distortion: 0.2, separation: 5});
