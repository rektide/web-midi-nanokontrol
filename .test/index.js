#!/usr/bin/env node
"use strict"

var stdEsm= require( "@std/esm")( module)
module.exports= main
module.exports.main= main
module.exports.sceneEncoder= function(){
	stdEsm("./scene-encoder")
}

function main(){
	module.exports.sceneEncoder()
}

if( require.main=== module){
	module.exports.main()
}
