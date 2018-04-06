/**
  Decode the NanoKontrol2's packed 7-bit scene into a normalized array of 8-bit values
*/
export function decode( bytes){
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

/**
  Encode an array of 8-bit values into the packed 7-bit value format ready to transmit to the NanoKontrol2
*/
export function encode( bytes){
	var
	  n= Math.ceil( bytes.length* 8/ 7),
	  output= new Uint8Array( n)
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
	return output
}

export default { encode, decode} 
