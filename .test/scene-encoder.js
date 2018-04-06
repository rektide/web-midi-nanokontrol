"use strict"
import tape from "tape"
import { encode, decode} from "../scene-encoder.js"

function rand(){
	return Math.floor( Math.random()* 256)
}

function randomArray( len){
	var output= new Array( len)
	for( var i= 0; i< len; ++i){
		output[ i]= rand()
	}
	return output
}

tape( "encode then decode then encode", function( t){
	var
	  original= randomArray( 48),
	  encoded= encode( original),
	  decoded= decode( encoded)
	t.equals( decoded.length, original.length, "lengths are equal")
	for( var i in original){
		t.equals( decoded[ i], original[ i], `value at ${i} is equal`)
	}
	t.end()
})
