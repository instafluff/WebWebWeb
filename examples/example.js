// const ComfyWeb = require( "../index" );
const ComfyWeb = require( "../build/index" );
console.log( ComfyWeb );

ComfyWeb.APIs[ "/" ] = ( qs, body ) => {
	console.log( qs );
	console.log( body );
	return { "test": "example!" };
};

ComfyWeb.APIs[ "color" ] = ( qs ) => {
	console.log( qs );
	return { "color": "RED" };
};

ComfyWeb.APIs[ "string" ] = ( qs ) => {
	console.log( qs );
	return "test string";
};

ComfyWeb.APIs[ "array" ] = ( qs ) => {
	console.log( qs );
	return [ "one", "2", "three" ];
};

ComfyWeb.APIs[ "route/*" ] = ( qs, body, opts ) => {
	console.log( opts.params );
	return opts.params;
};

function sleep( ms ) {
	return new Promise( resolve => setTimeout( resolve, ms ) );
}

ComfyWeb.APIs[ "async" ] = async ( qs ) => {
	console.log( qs );
	await sleep( 1000 );
	return "complete";
};

ComfyWeb.Run( 8099, { Directory: "dir" } );
