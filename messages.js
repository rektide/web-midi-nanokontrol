// via https://github.com/overtone/overtone/blob/master/src/overtone/device/midi/nanoKONTROL2.clj#L134-L164

export let defaults= {
	exclusive: 0xF0,
	message: 0x42,
	device: 0x40,
	channel: 0,
	softwareProject: [ 0, 1, 0x13],
	sub: 0,
	terminator: 0xF7
}
const moduleDefaults= defaults

/**
  @param value - the matching part of the byte
  @param name - the general description for this byte
  @param extra - description of the free bits in this byte. if name is null, assume entire byte is this description.
  @param label - description if this is a particular static value of a byte
  @param variable - true if this might represent a variable number of bytes
*/
function kv( value, name, extra, label, variable){
	const noName= name=== undefined|| name=== null
	if( noName&& extra!== undefined){
		name= extra
	}
	if( name=== null){
		name= undefined
	}
	if( extra=== null){
		extra= undefined
	}
	if( label=== null){
		label= undefined
	}
	if( variable=== null){
		variable= undefined
	}
	return { value, name, extra, label, variable}
}

function MessageFactory( kvs, staticDefaults){
	return class extends Message {
		constructor( vals, defaults){
			super( kvs, defaults)
			Object.assign( this, moduleDefaults, defaults|| staticDefaults, this, vals) // i dunno i'm making this defaults stuff up
		}
	}
}

const byteMask= 0xFF

/**
  create a mask of all bits in the byte right of first bit
*/
function extraMask( bite, kvFilter){
	var rightShifts= 8 // pessemistically shift an entire byte

	var
	  cursor= bite,
	  prev,
	  leftToFill= 0
	do{
		prev= cursor
		cursor= cursor| ( cursor<< 1)
		cursor= cursor& byteMask
		++leftToFill
	}while( cursor!= prev)
	var extraMask= (cursor^ byteMask)& byteMask
	return extraMask
}

class Message( kvs){
	constructor( kvs, defaults){
		this.kvs= kvs
		this.defaults= defaults|| moduleDefaults
		this.names= {}
		for( var kv of kvs){
			this.kv[ kv.name]= kv
		}
		this.defaults()
	}
	defaults(){
		for( var kv of this.kvs){
			var val= kv.value!== undefined? kv.value: this.defaults[ kv.name]
			if( val!== undefined){
				this[ kv.name]= val
			}
		}
	}
	assign( options){
		Object.assign( this, options)
	}
	toBytes(){
		var
		  defaults= this.defaults|| {},
		  output= [],
		  missing= []
		for( var kv of this.kvs){
			var
			  extra= kv.extra&& (this[ kv.extra]|| defaults[ kv.extra]),
			  value= kv.value+ extra
			if( val=== undefined){
				missing.push( kv.name)
				continue
			}
			output.push( val)
		}
		if( missing.length){
			throw new Error("Missing properties "+ missing.join(", "))
		}
		return output
	}
	fromBytes( bytes){
		var
		  variable= false,
		  load= i=>{
			var
			  kv= this.kvs[ i],
			  bite= bytes[ i],
			  em= extraMask( bite, kv)
			this[ kv.name]= kv.value // re- defaults()
			if( kv.extra){
				var
			  	  em= extraMask( bite, kv),
			  	  extra= bite& em
				this[ kv.extra]= extra // read in extra
			}
		  }
		// forward
		for( var i in this.kvs){
			load( i)
			var kv= this.kvs[ i]
			if( kv.variable){
				variable= i
				break
			}
		}
		if( !variable){
			return
		}
		// walk backwards
		var j
		for( j= this.kvs.length- 1; i> variable; --i){
			load( i)
		}
	}
}

// Transmitted data (1)

export let noteOff= MessageFactory([
	kv( 0x80, "status", "channel", "noteOff"),
	kv( 0, null, "note"),
	kv( 0x40)])
export let noteOffDaw= MessageFactory([
	kv( 0x90, "status", "channel", "noteOffDaw"),
	kv( 0, null, "note"),
	kv( 00)])
export let noteOn= MessageFactory([
	kv( 0x9, "status", "channel", "noteOn"),
	kv( 0, null, "note"),
	kv( 0, null, "velocity")])
export let controlChange= MessageFactory([
	kv( 0xB0, "status", "channel", "controlChange"),
	kv( 0, null, "control-change"),
	kv( 0, null, "value")])
export let pitchBlend= MessageFactory([
	kv( 0xE0, "status", "channel", "pitchBlend"),
	kv( 0, null, "value"),
	kv( 0, null, "value")
])

/**
  Channel Messages (1-1)
*/
export let channelMessage= {
	noteOff,
	noteOffDaw,
	noteOn,
	controlChange,
	pitchBlend
}

/**
 Device Inquiry Reply: transmitted when inquiry message request received (1-2)
*/
export deviceInquiryReply= MessageFactory([
	kv( 0xF0, "status", null, "deviceInquiryRepl")
	kv( 0x7E, "nonRealtime"),
	kv( 0, "device", "midiChannel"),
	kv( 6, "generalInformation"),
	kv( 2, "identityReply"),
	kv( 0x42, "manufacturerId", null, "KORG"),
	kv( 0x13, "softwareProjectFamilyLsb"), //these are static
	kv( 1, "softwareProjectFamilyMsb"),
	kv( 0, "softwareProjectMemberLsb"),
	kv( 0, "softwareProjectMemberMsb"),
	kv( 0, null, "softwareProjectMinorLsb"), // these are variable
	kv( 0, null, "softwareProjectMinorMsb"),
	kv( 0, null, "softwareProjectMajorLsb"),
	kv( 0, null, "softwareProjectMajorLsb"),
	kv( 0xF7, "endOfExclusive")
])

export let exclusiveTransmitted= MessageFactory([
	kv( 0xF0, "status", null, "exclusive")
	kv( 0x42, "message", null, "korg"),
	kv( 0x40, "device", "midiChannel"),
	kv( 0, "softwareProject1"),
	kv( 1, "softwareProject2"),
	kv( 0x13, "softwareProject3"),
	kv( 0, "sub"),
	kv( 0, null, "command"),
	kv( 0, null, "functionOrLength"),
	kv( 0, "data", null, null, true)
	kv( 0xF7, "endOfExclusive")
])

// 8th byte in Korg exclusive messages transmitted
export let exclusiveTransmittedCommand= {
	// these are complete, documented commands
	nativeMode: 0x40,
	packetCommunication: 0x5F, // "function" follows
	dataDump: 0x7F, // "function" follows

	// commands are defined via a struct of these bit-masks:
	controllerToHostMask: 0x40,
	variableLengthMask: 0x20,
	commandMask: 0x1F
}

// 9th byte, either one of these function ids, or variable data length
export let exclusiveTransmittedFunctionOnRequest= {
	currentSceneDataDump: 0x40, // when req message received
	modeData: 0x42 // when req message received
}
export let exclusiveTransmittedFunctionOnExclusive= {
	dataLoadCompleted: 0x23, // when exclusive message received
	dataLoadError: 0x24, // when exclusive message received
	writeCompleted: 0x21, // when exclusive message received
	writeError: 0x22 // when exclusive message received
}
export let exclusiveTransmittedFunction= Object.assign({}, requestFunction, exclusiveFunction)

export searchDeviceReply= MessageFactory([
	kv( 0xF0, "status", null, "exclusive")
	kv( 0x42, "message", null, "korg"),
	kv( 0x50, "device", null, "search"),
	kv( 1, "request"),
	kv( 0, "device", "device", "midiChannel"),
	kv( 0, null, "echoBack"),
	kv( 0x13, "softwareProjectFamilyLsb"), //these are static
	kv( 1, "softwareProjectFamilyMsb"),
	kv( 0, "softwareProjectMemberLsb"),
	kv( 0, "softwareProjectMemberMsb"),
	kv( 0, null, "softwareProjectMinorLsb"), // these are variable
	kv( 0, null, "softwareProjectMinorMsb"),
	kv( 0, null, "softwareProjectMajorLsb"),
	kv( 0, null, "softwareProjectMajorLsb"),
	kv( 0x7F, "endOfExclusive")
])

// Recognized receive data (2)

export let inquiry= MessageFactory([
	kv( 0xF0, "status", null, "exclusive")
	kv( 0x7E, "message", null, "nonRealtime")
	kv( 0, "device", "midiChannel")
	kv( 6, "generalInformation"),
	kv( 1, "identityRequest"),
	kv( 0xF7, "endOfExclusive")
])

function message( payload, messageOptions){
	return function( options){
		const o= Object.assign( {}, defaults, messageOptions, options)
		if( Number.isNaN( o.channel)){
			o.device+= o.channel
		}
		return [].concat(
			o.exclusive|| [],
			o.message|| [],
			o.device,
			o.softwareProject|| [],
			o.sub|| [],
			payload|| [],
			o.terminator|| []
		)
	}
}

export let modeRequest= message([ 0x1F, 0x12, 0x00])
export let currentSceneDataDumpRequest= message([ 0x1F, 0x10, 0])
export let currentSceneDataDump= [
	0xF0, 0x42, 0x40, 0x00, 0x01, 0x13, 0x00, 0x7F, 0x7F, 0x02, 0x03, 0x05, 0x40, 0x00, 0x00, 0x00,
	0x01, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x10, 0x00, 0x00, 0x7F, 0x00,
	0x01, 0x00, 0x20, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x30, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
	0x40, 0x00, 0x7F, 0x00, 0x10, 0x00, 0x01, 0x00, 0x01, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x11,
	0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x21, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x31, 0x00, 0x00, 0x7F,
	0x00, 0x01, 0x00, 0x41, 0x00, 0x00, 0x7F, 0x00, 0x10, 0x01, 0x00, 0x02, 0x00, 0x00, 0x7F, 0x00,
	0x01, 0x00, 0x12, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x22, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
	0x32, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x42, 0x00, 0x7F, 0x00, 0x10, 0x01, 0x00, 0x00, 0x03,
	0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x13, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x23, 0x00, 0x00, 0x7F,
	0x00, 0x01, 0x00, 0x33, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x43, 0x00, 0x7F, 0x00, 0x00, 0x10,
	0x01, 0x00, 0x04, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x14, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
	0x24, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x34, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x44, 0x00,
	0x7F, 0x00, 0x10, 0x01, 0x00, 0x00, 0x05, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x15, 0x00, 0x00, 0x7F,
	0x00, 0x01, 0x00, 0x25, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x35, 0x00, 0x7F, 0x00, 0x00, 0x01,
	0x00, 0x45, 0x00, 0x7F, 0x00, 0x00, 0x10, 0x01, 0x00, 0x06, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
	0x16, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x26, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x36, 0x00,
	0x7F, 0x00, 0x01, 0x00, 0x46, 0x00, 0x00, 0x7F, 0x00, 0x10, 0x01, 0x00, 0x07, 0x00, 0x00, 0x7F,
	0x00, 0x01, 0x00, 0x17, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x27, 0x00, 0x7F, 0x00, 0x00, 0x01,
	0x00, 0x37, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x47, 0x00, 0x7F, 0x00, 0x10, 0x00, 0x01, 0x00,
	0x3A, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x3B, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x2E, 0x00,
	0x7F, 0x00, 0x01, 0x00, 0x3C, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x3D, 0x00, 0x00, 0x7F, 0x00,
	0x01, 0x00, 0x3E, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x2B, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
	0x2C, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x2A, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x29, 0x00,
	0x7F, 0x00, 0x01, 0x00, 0x2D, 0x00, 0x00, 0x7F, 0x00, 0x7F, 0x7F, 0x7F, 0x7F, 0x00, 0x7F, 0x00,
	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
	0x00, 0xF7]
// inquiry again
export let sceneWriteRequest= [ 0xF0, 0x42, 0x40, 0x00, 0x01, 0x13, 0x00, 0x1F, 0x11, 0x00, 0xF7]
