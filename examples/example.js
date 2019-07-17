const ComfyWeb = require( "../index" );

ComfyWeb.APIs[ "/" ] = ( qs ) => {
  console.log( qs );
  return { "test": "example!" };
};

ComfyWeb.APIs[ "/color" ] = ( qs ) => {
  console.log( qs );
  return { "color": "RED" };
};

ComfyWeb.Run( 8099 );
