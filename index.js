const http = require( "http" );
const url = require('url');
const fs = require('fs');
const path = require('path');
const querystring = require( "querystring" );

// Static File Serve Code based on https://adrianmejia.com/building-a-node-js-static-file-server-files-over-http-using-es6/
const mimeType = {
  '.ico': 'image/x-icon',
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.eot': 'appliaction/vnd.ms-fontobject',
  '.ttf': 'aplication/font-sfnt'
};

function isAsync( fn ) {
   return fn.constructor.name === 'AsyncFunction';
}

function serveFile( pathname, res ) {
  fs.exists( pathname, function ( exist ) {
    if( !exist ) {
      res.statusCode = 404;
      res.end(`File ${pathname} not found!`);
      return;
    }

    if( fs.statSync(pathname).isDirectory() ) {
      pathname += '/index.html';
    }

    fs.readFile(pathname, function(err, data){
      if( err ){
        res.statusCode = 500;
        res.end(`Error getting the file: ${err}.`);
      }
      else {
        const ext = path.parse(pathname).ext;
        res.setHeader( 'Content-type', mimeType[ ext ] || 'text/plain' );
        res.end( data );
      }
    });
  });
}

function startServer( port, { useCORS } = { useCORS: true } ) {
  http.createServer( async ( req, res ) => {
    if( useCORS ) {
      // Handle CORS
      res.setHeader( 'Access-Control-Allow-Origin', '*' );
      res.setHeader( 'Access-Control-Request-Method', '*' );
      res.setHeader( 'Access-Control-Allow-Methods', 'OPTIONS, GET, PUT, POST, DELETE' );
      res.setHeader( 'Access-Control-Allow-Headers', '*' );
      if( req.method === 'OPTIONS' ) {
        res.writeHead( 204 );
        res.end();
        return;
      }
    }

    const parsedUrl = url.parse( req.url );
    if( req.url.startsWith( "/web" ) ||
        req.url.startsWith( "/public" ) ) {
      const sanitizePath = path.normalize( parsedUrl.pathname ).replace( /^(\.\.[\/\\])+/, '' );
      let pathname = path.join( path.resolve( "." ), sanitizePath );
      serveFile( pathname, res );
    }
    else {
      if( comfyWeb.APIs[ parsedUrl.pathname ] ) {
        var qs = querystring.decode( req.url.split( "?" )[ 1 ] );
        if( isAsync( comfyWeb.APIs[ parsedUrl.pathname ] ) ) {
          var result = await comfyWeb.APIs[ parsedUrl.pathname ]( qs );
          res.setHeader( 'Content-type', 'application/json' );
          res.end( JSON.stringify( result ) );
        }
        else {
          var result = comfyWeb.APIs[ parsedUrl.pathname ]( qs );
          res.setHeader( 'Content-type', 'application/json' );
          res.end( JSON.stringify( result ) );
        }
      }
      else {
        const sanitizePath = path.normalize( parsedUrl.pathname ).replace( /^(\.\.[\/\\])+/, '' );
        let pathname = path.join( path.resolve( "./web" ), sanitizePath );
        if( fs.existsSync( pathname ) ) {
          serveFile( pathname, res );
        }
        else {
          pathname = path.join( path.resolve( "./public" ), sanitizePath );
          if( fs.existsSync( pathname ) ) {
            serveFile( pathname, res );
          }
          else {
            res.statusCode = 500;
            res.end(`Error`);
          }
        }
      }
    }
  }).listen( port, ( err ) => {
    if( err ) {
      return console.log( 'WebWebWeb could not start:', err );
    }
    console.log( `WebWebWeb is running on ${port}` );
  } );
}

var comfyWeb = {
  APIs: {},
  Run: startServer
};

module.exports = comfyWeb;
