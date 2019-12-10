const ComfyWeb = require( "../index" );

ComfyWeb.APIs[ "/" ] = ( qs, body ) => {
  console.log( qs );
  console.log( body );
  return { "test": "example!" };
};

ComfyWeb.APIs[ "color" ] = ( qs ) => {
  console.log( qs );
  return { "color": "RED" };
};

ComfyWeb.Run( 8099 );
