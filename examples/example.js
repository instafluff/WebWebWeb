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

ComfyWeb.APIs[ "string" ] = ( qs ) => {
  console.log( qs );
  return "test string";
};

ComfyWeb.APIs[ "array" ] = ( qs ) => {
  console.log( qs );
  return [ "one", "2", "three" ];
};

ComfyWeb.Run( 8099 );
