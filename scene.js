//// DATA DEFINITION HELPERS ////

var
  _assign= ["none", "cc", "note"],
  _behavior= ["momentary", "toggle"],
  _bool= ["disable", "enable"];

function bool(){
	return {
		max: 1,
		values: _bool
	}
}

//// DATA DEFINITIONS ////

// common parameters
var common= {
	globalMidiChannel: {max: 15},
	contorlMode: {values: ["cc", "cubase", "dp", "live", "protools", "sonar"]},
	ledMode: {values: ["internal", "external"]}
}

// control group params
var controlGroup= {
	groupMidiChannel: {values: [,,,,,,,,,,,,,,,"global"]},
	sliderAssign: bool(),
	reserved: {max: 0},
	sliderCcNote: {},
	sliderMin: {},
	sliderMax: {},
	reserved2: {max: 0},
	knobAssign: bool(),
	reserved3: {max: 0},
	knobCcNote: {},
	knobMin: {},
	knobMax: {},
	reserved4: {max: 0},
	soloAssign: {values: _assign},
	soloBehavior: {values: _behavior},
	soloCcNote: {},
	soloOff: {},
	soloOn: {},
	reserved5: {max: 0},
	muteAssign: {values: _assign},
	muteBehavior: {values: _behavior},
	muteCcNote: {},
	muteOff: {},
	muteOn: {},
	reserved6: {max: 0},
	recAssign: {values: _assign},
	recBehavior: {values: _behavior},
	recCcNote: {},
	recOff: {},
	recOn: {},
	reserved7: {}
}

// index where each control group begins
var controlGroupOffsets= [3, 34, 65, 96, 127, 158, 189, 220]

//// BUILD EXPORTS ////

export let scene= new Array(338)
export default scene

function normalize( o, name){
	o.name= name
	if( o.values&& !o.max){
		o.max= o.values.length- 1
	}
	if( o.max=== undefined){
		o.max= 127
	}
	if( o.min=== undefined){
		o.min= 0
	}
	return o
}

// common
var commonKeys= Object.keys( common)
for( var index= 0; index< commonKeys.length; ++index){
	var
	  name= commonKeys[ index],
	  o= normalize( common[ name], name)
	o.index= index
	scene[ index]= o
}
// control groups
var controlGroupKeys= Object.keys( controlGroup)
for( var keyNum= 0; keyNum< controlGroupKeys.length; ++keyNum){
//for( var keyNum in controlGroupKeys){
	var
	  name= controlGroupKeys[ keyNum],
	  o= normalize( controlGroup[ name], name)
	// each control group is repeated across all 8 channels,
	// with each channel starting at it's own offset
	for( var channel= 0; channel< controlGroupOffsets.length;){ // we increment channel in the final Object.assign
		var
		  offset= controlGroupOffsets[ channel],
		  index= keyNum+ offset
		scene[ index]= Object.assign({ channel: ++channel, index}, o)
	}
}
