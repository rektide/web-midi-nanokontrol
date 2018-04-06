import { requestMIDIAccess, close} from "web-midi-api-shim"
import once from "eventtarget-once"
import * as messages from "./messages"
import { decode} from "./scene-encoder"
import { loadListenFor} from "web-midi-message/Message.js"

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

export class NanoKontrol2{
	static get Group(){
		return group
	}
	static get Transport(){
		return transport
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
		if( !this.midi|| this.midi.then){
			return this.requestAccess().then( _=> this._consume( optionalName, category))
		}
		var target
		if( !optionalName){
			var firstId= this.midi[ category].keys().next().value
			target= this.midi[ category].get( firstId)
		}else{
			var lowerOptional= optionalName.toLowerCase()
			for( var port of this.midi[ category].values()){
				if( port.name.toLowerCase().indexOf( lowerOptional)!== -1){
					target= port
					break
				}
			}
		}
		if( !target){
			return
		}
		if( target.open&& !portOpenFilter({ port: target})){
			// wait for open state
			var opened= once( target, "statechange", { filter: portOpenFilter})
			// open -- web-midi-api hasn't been updated, in the spec this returns a promise
			target.open()
			// return target once open
			return opened.then( _=> target)
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

		// get input
		await this.consumeInput( optionalInputName|| name)
		// insure listen-for capability used by readOne is loaded
		await loadListenFor()
		// begin waiting for read of scene data
		var readResponse= this.readOne( messages.currentSceneDataDump, optionalInputName|| name)

		// send scene data requeset
		var req= new messages.currentSceneDataDumpRequest().toBytes()
		output.send( req)

		// wait for scene dump
		var scene= await readResponse
		scene.data= decode( scene.data)
		return scene
	}

	async readOne( messageKlass, optionalInputName){
		var port= this.consumeInput( optionalInputName)
		if( port.then){
			port= await port
		}
		return await messageKlass.listenFor( port, "midimessage")
	}
}

function portOpenFilter( msg, {eventType}= {}){
	return msg.port&& msg.port.connection=== "open"&& msg.port.state=== "connected"
}

export default NanoKontrol2
