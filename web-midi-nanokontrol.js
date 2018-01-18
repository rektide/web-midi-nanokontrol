import { requestMIDIAccess, close} from "web-midi-api"
import EventEmitter from "events"
import deferrant from "deferrant"
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
		// debug purposes:
		this.on( "midimessage", m=> console.log( m))
	}
	async requestAccess(){
		if( this.midi){
			return this.midi
		}
		this.midi= await requestMIDIAccess( this.midiOptions)
		return this.midi
	}
	consumeInput( optionalInputName){
		// get midi, embrace zalgo
		if( !this.midi){
			return this.requestAccess().then( _=> this.consumeInput( optionalInputName))
		}
		var
		  inputName= optionalInputName|| this.midi.inputs.keys().next().value,
		  input= this.midi.inputs.get( inputName)
		console.log({inputName, input})
		input.onmidimessage= m=> this.emit( "midimessage", m)
	}
	async consumeOutput( optionalOutputName){
		// zalgo zalgo zalgo
		if( !this.midi){
			return this.requestAccess().then( _=> this.consumeOutput( optionalOutputName))
		}
		var
		  outputName= optionalOutputName|| this.midi.outputs.keys().next().value,
		  output= this.midi.outputs.get( outputName)
		output.open()
		return output
	}
	async dumpScene( optionalOutputName){
		var output= await this.consumeOutput( optionalOutputName)
		readOne( messages.currentSceneDataDump)
		output.send( new messages.currentSceneDataDumpRequest().toBytes())
	}
	async readOne( messageKlass){
		var
		  instance= new messageKlass(),
		  d= new deferrant()
		var handler= msg=>{
			var success= instance.fromBytes( msg.data)
			console.log("READING", {success, instance})
			if( success){
				d.resolve( instance)
				this.removeListener( "midimessage", handler)
			}
		}
		m.on( "midimessage", handler)
		return await d
	}
}

export default NanoKontrol2
export {NanoKontrol2}
