//// DATA DEFINITION HELPERS ////

var
  _assign= ["none", "cc", "note"],
  _behavior= ["momentary", "toggle"],
  _bool= ["disable", "enable"],
  _channel= [,,,,,,,,,,,,,,,"global"]

function bool(){
	return {
		max: 1,
		values: _bool
	}
}

//// DATA DEFINITIONS ////

// common parameters
export let common= {
	globalMidiChannel: {max: 15},
	contorlMode: {values: ["cc", "cubase", "dp", "live", "protools", "sonar"]},
	ledMode: {values: ["internal", "external"]}
}

// control group params
export let controlGroup= {
	groupMidiChannel: {values: _channel},
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
export let controlGroupOffsets=[ 3, 34, 65, 96, 127, 158, 189, 220]

export let controlGroups= [ 1, 2, 3, 4, 5, 6, 7, 8]

export let transportChannel= normalize({ index: 251, values: _channel}, "transportChannl")

export let transport= {
	assign: {values: _assign},
	behavior: {values: _behavior},
	ccNote: {},
	off: {},
	on: {},
	reserved: {max: 0}
}


export let transportOffsets=[ 252, 258, 264, 270, 276, 282, 288, 294, 300, 306, 312]

export let transports={
	"prev": {},
	"next": {},
	"cycle": {},
	"marker": {},
	"prevMarker": {},
	"nextMarker": {},
	"rew": {},
	"ff": {},
	"stop": {},
	"play": {},
	"rec": {}
}

export let customDAW={ max: 255, valid: [ 0, 42, 42, 46, 47, 48, 49, 50, 127, 255]}

// an array with the definition of each byte
// the above data is used to fill out this array
export let scene= new Array( 338)
export default scene

//// BUILD SCENE ////

function normalize( o, name){
	o.name= name
	if( o.values&& !o.max){
		o.max= o.values.length- 1 // calculate max
	}
	if( o.max=== undefined){
		o.max= 127 // default max
	}
	if( o.min=== undefined){
		o.min= 0 // default min
	}
	for( var i in o.values){
		if( o.values[ i]=== undefined){
			o.values[ i]= i // values are identity if not defined
		}
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

// transport
scene[ 251]= transportChannel
// transport groups
var
  transportKeys= Object.keys( transport), // fields in a transport
  transportNames= Object.keys( transports) // names of all transports
for( var keyNum= 0; keyNum< transportKeys.length; ++keyNum){
	var
	  name= transportKeys[ keyNum],
	  o= normalize( transport[ name], name)
	// each transport group is repeated across all 8 channels,
	// with each channel starting at it's own offset
	for( var transportIndex= 0; transportIndex< transportOffsets.length;){ // we increment transportIndex in the final Object.assign
		var
		  offset= transportOffsets[ transportIndex],
		  index= keyNum+ offset,
		  transportName= transportNames[ transportIndex],
		  val= Object.assign({ index: ++transportIndex, index}, o)
		scene[ index]= val
		transports[ transportName][ name]= val
	}
}

// custom DAW
for( var i= 318; i<= 322; ++i){
	scene[ i]= normalize( customDAW, "customDAW")
}
