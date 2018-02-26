import { requestMIDIAccess, close} from "web-midi-api"
import EventEmitter from "events"
import Defer from "p-defer"
import * as messages from "./messages"

// MIDI implementation doc: http://www.korg.com/us/support/download/manual/0/159/2710/

const group= {
	fader: 0,
	knob: 16,
	s: 32,
	m: 48,
	r: 64
}

const transport= {
	trackPrev: 58,
	trackNext: 59,
	cycle: 46,

	set: 60,	
	markerPrev: 61,
	markerNext: 62,

	rewind: 43,
	fastForward: 44,
	stop: 42,
	play: 41,
	record: 45
}

class NanoKontrol2 extends EventEmitter{
	static get Group(){
		return group
	}
	static get Transport(){
		return transport
	}

	constructor(){
		super()
	}
	async requestAccess(){
		if( !this.midi){
			this.midi= requestMIDIAccess( this.midiOptions)
			this.midi= await this.midi
		}
		return await this.midi
	}
	_consume( optionalName, category){
		// zalgo zalgo zalgo
		if( !this.midi){
			return this.requestAccess().then( _=> this._consume( optionalName, category))
		}
		var target
		if( !optionalName){
			var firstId= this.midi[ category].keys().next().value
			target= this.midi[ category].get( firstId)
		}else{
			var lowerOptional= optionalName.toLowerCase()
			for( var el of this.midi[ category]){
				var port= el[ 1]
				if( port.name.toLowerCase().indexOf( lowerOptional)!== -1){
					target= port
					break
				}
			}
		}
		if( !target){
			return
		}
		if( target.open){
			target.open()
		}
		return target
	}
	consumeInput( optionalInputName){
		return this._consume( optionalInputName, "inputs")
	}
	consumeOutput( optionalOutputName){
		return this._consume( optionalOutputName, "outputs")
	}
	async dumpScene( optionalName, optionalInputName){
		// get output midi
		var
		  output= await this.consumeOutput( optionalName),
		  name= output.name

		// prepare to read scene dump on input
		var readResponse= this.readOne( messages.currentSceneDataDump, optionalInputName|| name)

		// send requeset
		var req= new messages.currentSceneDataDumpRequest().toBytes()
		output.send( req)

		// wait for scene dump
		var scene= await readResponse
		scene.data= NanoKontrol2.decodeScene( scene.data)
		return scene
	}
	static decodeScene( bytes){
		var
		  n= Math.floor( bytes.length* 7/ 8),
		  output= new Uint8Array( n)
		var
		  highPos= 0, // which byte is the current high byte? data starts with a high byte: 0.
		  highCount= 1, // how many high bytes have we seen? we start by having seen the first one: 1.
		  highBitShifts= 7 // how many left barrel shifts to make the current high bit the 8th bit? 0b1 needs to become 0b1000000: 7
		for( var i= 0; i< n; ++i){
			var
			  val= bytes[ i+ highCount], // base value
			  highBit= (bytes[ highPos]<< highBitShifts)& 0x80 // get the high byte, shift our bit into position, and mask it
			// take the base value and graft on the high bit
			output[ i]= val+ highBit
			// move on to the next bit in the high byte, which will require one less shift
			--highBitShifts
			// see if there are remaining bits
			if( highBitShifts< 1){ // the last bit is 0, unused
				// we've used all 7 bits. the next byte will be a new high byte. advance through it.
				++highCount // there is a new high byte
				highPos+= 8 // we've just read a high byte and seven bytes, so we are +8
				highBitShifts= 7 // high byte is new, has 7 fresh bits. start with lowest bit.
			}
		}
		return output
	}
	static encodeScene( bytes){
		var
		  n= Math.ceil( bytes.length* 8/ 7),
		  output= new UintArray( n)
		var
		  highPos= 0,
		  highCount= 1,
		  highBitShifts= 7
		for( var i= 0; i< bytes.length; ++i){
			var
			  val= bytes[ i],
			  lowerBits= val& 0x7F,
			  highBit= (val& 0x80) >> highBitShifts
			output[ i+ highCount]= lowerBits
			output[ highPos]|= highBit
			--highBitShifts
			if( highBitShifts< 1){
				++highCount
				highPos+= 8
				highBitShifts= 7
			}
		}
	}
	async readOne( messageKlass, optionalOutputName){
		var
		  instance= new messageKlass(),
		  d= Defer()
		var handler= msg=>{
			var success= instance.fromBytes( msg.data)
			if( success){
				d.resolve( instance)
				this.removeListener( "midimessage", handler)
			}
		}
		var port= await this.consumeInput( optionalOutputName)
		port.addEventListener( "midimessage", handler)
		return await d.promise
	}
}

export default NanoKontrol2
export {NanoKontrol2}
