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

console.log( path.resolve( "." ) );

function startServer( port ) {
  http.createServer( async ( req, res ) => {
    const parsedUrl = url.parse( req.url );
    if( req.url.startsWith( "/web" ) ||
        req.url.startsWith( "/public" ) ) {
      const sanitizePath = path.normalize( parsedUrl.pathname ).replace( /^(\.\.[\/\\])+/, '' );
      let pathname = path.join( path.resolve( "." ), sanitizePath );
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
    else {
      if( comfyWeb.APIs[ parsedUrl.pathname ] ) {
        var qs = querystring.decode( req.url.split( "?" )[ 1 ] );
        var result = comfyWeb.APIs[ parsedUrl.pathname ]( qs );
        // TODO: check if result is a Promise so that we resolve first
        res.setHeader( 'Content-type', 'application/json' );
        res.end( JSON.stringify( result ) );
      }
      else {
        res.statusCode = 500;
        res.end(`Error`);
      }
    }
  }).listen( port );
}

var comfyWeb = {
  APIs: {},
  Run: startServer
};

module.exports = comfyWeb;
