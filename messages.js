import kv from "web-midi-message/kv.js"
import Message from "web-midi-message/Message.js"
import MessageFactory from "web-midi-message/MessageFactory.js"

// via https://github.com/overtone/overtone/blob/master/src/overtone/device/midi/nanoKONTROL2.clj#L134-L164

export let defaults= {
	channel: 0
}
const moduleDefaults= defaults

const
  statusExclusive= kv( 0xF0, "status", null,{ label: "exclusive"}),
  messageKorg= kv( 0x42, "message", null,{ label: "korg"}),
  endOfExclusive= kv( 0xF7, "endOfExclusive")

const byteMask= 0xFF


// Transmitted data (1)

export let noteOff= MessageFactory([
	kv( 0x80, "status", "channel",{ label:"noteOff"}),
	kv( 0, null, "note"),
	kv( 0x40)], defaults)
export let noteOffDaw= MessageFactory([
	kv( 0x90, "status", "channel",{ label:"noteOffDaw"}),
	kv( 0, null, "note"),
	kv( 0)], defaults)
export let noteOn= MessageFactory([
	kv( 0x9, "status", "channel",{ label: "noteOn"}),
	kv( 0, null, "note"),
	kv( 0, null, "velocity")], defaults)
export let controlChange= MessageFactory([
	kv( 0xB0, "status", "channel",{ label: "controlChange"}),
	kv( 0, null, "control-change"),
	kv( 0, null, "value")] , defaults)
export let pitchBlend= MessageFactory([
	kv( 0xE0, "status", "channel",{ label: "pitchBlend"}),
	kv( 0, null, "value"),
	kv( 0, null, "value")], defaults)

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
export let deviceInquiryReply= MessageFactory([
	statusExclusive,
	kv( 0x7E, "nonRealtime"),
	kv( 0, "device", "midiChannel"),
	kv( 6, "generalInformation"),
	kv( 2, "identityReply"),
	kv( 0x42, "manufacturerId", null,{ label: "KORG"}),
	kv( 0x13, "softwareProjectFamilyLsb"), //these are static
	kv( 1, "softwareProjectFamilyMsb"),
	kv( 0, "softwareProjectMemberLsb"),
	kv( 0, "softwareProjectMemberMsb"),
	kv( 0, null, "softwareProjectMinorLsb"), // these are variable
	kv( 0, null, "softwareProjectMinorMsb"),
	kv( 0, null, "softwareProjectMajorLsb"),
	kv( 0, null, "softwareProjectMajorLsb"),
	endOfExclusive], defaults)

export let exclusiveTransmitted= MessageFactory([
	statusExclusive,
	messageKorg,
	kv( 0x40, "device", "midiChannel"),
	kv( 0, "softwareProject1"),
	kv( 1, "softwareProject2"),
	kv( 0x13, "softwareProject3"),
	kv( 0, "sub"),
	kv( 0, null, "command", { extraMask: 0x1F}),
	kv( 0, null, "functionOrLength"),
	kv( 0, "data", null, null,{ variable: true}),
	endOfExclusive], defaults)

export let commandMasks= {
	// commands are defined via a struct of these bit-masks:
	controllerToHostMask: 0x40,
	variableLengthMask: 0x20,
	commandMask: 0x1F
}

// 8th byte in Korg exclusive messages transmitted
export let exclusiveTransmittedCommand= {
	// these are complete, documented commands
	nativeMode: 0x40,
	packetCommunication: 0x5F, // "function" follows
	dataDump: 0x7F // "function" follows
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
export let exclusiveTransmittedFunction= Object.assign({}, exclusiveTransmittedFunctionOnRequest, exclusiveTransmittedFunctionOnExclusive)

export let searchDeviceReply= MessageFactory([
	statusExclusive,
	messageKorg,
	kv( 0x50, "device", null,{ label: "search"}),
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
	endOfExclusive], defaults)

// Recognized receive data (2)

// Universal system exclusive message, non-realtime (2-1)

export let inquiry= MessageFactory([
	statusExclusive,
	kv( 0x7E, "message", null, "nonRealtime"),
	kv( 0, "device", "midiChannel"),
	kv( 6, "generalInformation"),
	kv( 1, "identityRequest"),
	endOfExclusive], defaults)

export let exclusiveReceiveCommand= {
	nativeMode: 0,
	dataDumpRequest: 0x1F,
	dataDump: 0x7F
}

export let exclusiveReceiveFunction= {
	currentSceneDataDumpRequest: 0x10,
	currentSceneDataDump: 0x40,
	sceneWriteRequest: 0x11,
	modeRequest: 0x12
}
function erc( name){
	return kv( exclusiveReceiveCommand[ name], "command", null,{ label: name})
}
function erf( name){
	return kv( exclusiveReceiveFunction[ name], "function", null,{ label: name})
}

export let searchDeviceRequest= MessageFactory([
	statusExclusive,
	messageKorg,
	kv( 0x50, "device", null,{ label: "search"}),
	kv( 0, "request"),
	kv( 0, null, "echoBack"),
	endOfExclusive], defaults)

// MIDI Exclusive Format (3)

// Standard messages (3-1)

// 3-1-1, receve
export let currentSceneDataDumpRequest= MessageFactory([
	statusExclusive,
	messageKorg,
	kv( 0x40, "device", "midiChannel"),
	kv( 0, "softwareProject1"),
	kv( 1, "softwareProject2"),
	kv( 0x13, "softwareProject3"),
	kv( 0, "sub"),
	erc( "dataDumpRequest"),
	erf( "currentSceneDataDumpRequest"),
	kv( 0, "unused"),
	endOfExclusive], defaults)

// 3-1-2, receive
export let sceneWriteRequest= MessageFactory([
	statusExclusive,
	messageKorg,
	kv( 0x40, "device", "midiChannel"),
	kv( 0, "softwareProject1"),
	kv( 1, "softwareProject2"),
	kv( 0x13, "softwareProject3"),
	kv( 0, "sub"),
	erc( "dataDumpRequest"),
	erf( "sceneWriteRequest"),
	kv( 0, "unused"),
	endOfExclusive], defaults)

export let nativeModeInOut= MessageFactory([
	statusExclusive,
	messageKorg,
	kv( 0x40, "device", "midiChannel"),
	kv( 0, "softwareProject1"),
	kv( 1, "softwareProject2"),
	kv( 0x13, "softwareProject3"),
	kv( 0, "sub"),
	kv( 0, "native1"),
	kv( 0, "native2"),
	kv( 0, null, "req",{ extraMask: 0x7F}),
	endOfExclusive], defaults)

export let modeRequest= MessageFactory([
	statusExclusive,
	messageKorg,
	kv( 0x40, "device", "midiChannel"),
	kv( 0, "softwareProject1"),
	kv( 1, "softwareProject2"),
	kv( 0x13, "softwareProject3"),
	kv( 0, "sub"),
	erc( "dataDumpCommand"),
	erf( "modeRequest"),
	kv( 0, "unused"),
	endOfExclusive], defaults)

// 3-1-5, r/t
export let currentSceneDataDump= MessageFactory([
	statusExclusive,
	messageKorg,
	kv( 0x40, "device", "midiChannel"),
	kv( 0, "softwareProject1"),
	kv( 1, "softwareProject2"),
	kv( 0x13, "softwareProject3"),
	kv( 0, "sub"),
	erc( "dataDump"),
	kv( 0x7F, "over"),
	kv( 3, "numDataMsb"),
	kv( 5, "numDataLsb"),
	erc( "currentSceneDataDump"),
	kv( 0, "data", null,{ variable: true}),
	endOfExclusive], defaults);


//export let modeRequest= message([ 0x1F, 0x12, 0x00])
//export let currentSceneDataDumpRequest= message([ 0x1F, 0x10, 0])
//export let currentSceneDataDump= [
//	0xF0, 0x42, 0x40, 0x00, 0x01, 0x13, 0x00, 0x7F, 0x7F, 0x02, 0x03, 0x05, 0x40, 0x00, 0x00, 0x00,
//	0x01, 0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x10, 0x00, 0x00, 0x7F, 0x00,
//	0x01, 0x00, 0x20, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x30, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
//	0x40, 0x00, 0x7F, 0x00, 0x10, 0x00, 0x01, 0x00, 0x01, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x11,
//	0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x21, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x31, 0x00, 0x00, 0x7F,
//	0x00, 0x01, 0x00, 0x41, 0x00, 0x00, 0x7F, 0x00, 0x10, 0x01, 0x00, 0x02, 0x00, 0x00, 0x7F, 0x00,
//	0x01, 0x00, 0x12, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x22, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
//	0x32, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x42, 0x00, 0x7F, 0x00, 0x10, 0x01, 0x00, 0x00, 0x03,
//	0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x13, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x23, 0x00, 0x00, 0x7F,
//	0x00, 0x01, 0x00, 0x33, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x43, 0x00, 0x7F, 0x00, 0x00, 0x10,
//	0x01, 0x00, 0x04, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x14, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
//	0x24, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x34, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x44, 0x00,
//	0x7F, 0x00, 0x10, 0x01, 0x00, 0x00, 0x05, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x15, 0x00, 0x00, 0x7F,
//	0x00, 0x01, 0x00, 0x25, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x35, 0x00, 0x7F, 0x00, 0x00, 0x01,
//	0x00, 0x45, 0x00, 0x7F, 0x00, 0x00, 0x10, 0x01, 0x00, 0x06, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
//	0x16, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x26, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x36, 0x00,
//	0x7F, 0x00, 0x01, 0x00, 0x46, 0x00, 0x00, 0x7F, 0x00, 0x10, 0x01, 0x00, 0x07, 0x00, 0x00, 0x7F,
//	0x00, 0x01, 0x00, 0x17, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x27, 0x00, 0x7F, 0x00, 0x00, 0x01,
//	0x00, 0x37, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x47, 0x00, 0x7F, 0x00, 0x10, 0x00, 0x01, 0x00,
//	0x3A, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x3B, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x2E, 0x00,
//	0x7F, 0x00, 0x01, 0x00, 0x3C, 0x00, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x3D, 0x00, 0x00, 0x7F, 0x00,
//	0x01, 0x00, 0x3E, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00, 0x2B, 0x00, 0x7F, 0x00, 0x00, 0x01, 0x00,
//	0x2C, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x2A, 0x00, 0x7F, 0x00, 0x01, 0x00, 0x00, 0x29, 0x00,
//	0x7F, 0x00, 0x01, 0x00, 0x2D, 0x00, 0x00, 0x7F, 0x00, 0x7F, 0x7F, 0x7F, 0x7F, 0x00, 0x7F, 0x00,
//	0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
//	0x00, 0xF7]
//// inquiry again
//export let sceneWriteRequest= [ 0xF0, 0x42, 0x40, 0x00, 0x01, 0x13, 0x00, 0x1F, 0x11, 0x00, 0xF7]

