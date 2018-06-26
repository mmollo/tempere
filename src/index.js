const fs = require('fs')
module.exports.decode = decode
module.exports.debody = debody


var types = {
	0: readNumber,
	1: readBool,
	2: readString,
	3: readObject,
	5: readNull
}

var gbuffer = Buffer.from([])
var glength

function decode(buffer) {
	if(67 == buffer.readUInt8())
	return debody(buffer.slice(8))
}
function decodeN(buffer) {
	if( 67 == buffer.readUInt8()) {
		glength = buffer.readUInt16BE(5)
		gbuffer = buffer.slice(8)
	} else {
		if(!gbuffer.length) return false
		gbuffer = Buffer.concat([gbuffer, buffer])
	}


	if(gbuffer.length < glength) {
		return false
	}

	var nbuffer = gbuffer.slice(0, glength)
	try {
		return debody(nbuffer)
	} catch (e) {
		throw new Error(e)
	}
}

function debody(body) {
	var t, f
	var item
	var u
	var a
	var b
	var msg = []
	while (body.length) {
		var [t, body ] = readType(body)
		if(typeof t === 'undefined') {
			return
		}
		var [item,body] = t(body)
		msg.push(item)
	}

	return msg
}

function readType(body)
{
	var type = body.readUInt8(0)

	return [types[type], body.slice(1)]
}


function readBool(body)
{
	return [body.readUInt8() === 1, body.slice(1)]	
}

function readNumber(body)
{
	return [body.readDoubleBE(0), body.slice(8)]
}

function readString(body)
{
	var size = body.readUInt16BE(0)
	var string = body.slice(2, size + 2)
	body = body.slice(size + 2)
	return [string.toString(), body]
}

function readObject(body)
{
	var obj = {}
	var [prop, body] = readProperty(body)
	while(prop !== null) {
		obj[prop.key] = prop.value
		var [prop, body] = readProperty(body)
	}
	return [obj, body]
	
}


function readProperty(body)
{
	if(0 === Buffer.compare(Buffer.from('000009', 'hex'), body.slice(0,3))) {
		return [null, body.slice(3)]
	}

	var [key, body] = readString(body)
	try {
		var [t, body] = readType(body)
	} catch (e) {
	}
	var [value, body] = t(body)

	var obj = {key: key, value:value}
	return [obj, body]


}

function readNull(body)
{
	return [null, body]
}
