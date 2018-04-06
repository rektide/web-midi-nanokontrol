import WebMidiNanoKontrol from "./web-midi-nanokontrol.js"

let webMidiNanoKontrol= new WebMidiNanoKontrol();

async function main(){
	webMidiNanoKontrol.requestAccess()
}

export {
	webMidiNanoKontrol,
	main
}
export default main
