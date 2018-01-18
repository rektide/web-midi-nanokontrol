import { requestMIDIAccess, close} from "web-midi-api"

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

class NanoKontrol2{
	static get Group(){
		return group
	}
	static get Transport(){
		return transport
	}

	constructor(){
		
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
		  input= this.midi.inputs.get( optionalInputName)
		input.open()
		input.onmidimessage= m=> console.log( m)
	}
	async consumeOutput( optionalOutputName){
		// zalgo zalgo zalgo
		if( !this.midi){
			return this.requestAccess().then( _=> this.consumeOutput( optionalOutputName))
		}
		var
		  outputName= optionalOutputName|| this.midi.outputs.keys().next().value,
		  output= this.midi.outputs.get( optionalOutputName)
		output.open()
	}
}

export default NanoKontrol2
export {NanoKontrol2}
