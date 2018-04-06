var stdEsm= require( "@std/esm")( module)
var WebMidiNanoKontrol= stdEsm( "../web-midi-nanokontrol.js")
var Scene= stdEsm( "../scene.js")
var Messages= stdEsm( "../messages.js")
var nanoKontrol= new WebMidiNanoKontrol()

async function externalLed(){
	var scene= nanoKontrol.readScene()
	scene[ Scene.common.ledMode.index]= Scene.common.ledMode.external
	var written= nanoKontrol.readOne([ Messages.writeComplete, Messages.writeError])
	return {
		scene,
		written
	}
}
