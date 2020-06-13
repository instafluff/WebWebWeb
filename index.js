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

function isArray( o ) {
    return ( !!o ) && ( o.constructor === Array );
}

function isObject( o ) {
    return ( !!o ) && ( o.constructor === Object );
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

var isCORSEnabled = true;

async function webHandler( req, res ) {
  if( isCORSEnabled ) {
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
    var urlPath = comfyWeb.APIs[ parsedUrl.pathname ] ? parsedUrl.pathname : parsedUrl.pathname.substring( 1 );
    if( comfyWeb.APIs[ urlPath ] ) {
      var qs = querystring.decode( req.url.split( "?" )[ 1 ] );
      if( req.method === "POST" ) {
        let body = null;
        req.on( 'data', chunk => {
          if( body === null ) {
            body = chunk;
		  }
		  else {
            body = Buffer.concat([ body, chunk ]);
		  }
        });
        req.on( 'end', async () => {
          if( isAsync( comfyWeb.APIs[ urlPath ] ) ) {
            var result = await comfyWeb.APIs[ urlPath ]( qs, body, { req, res } );
            if( isArray( result ) || isObject( result ) ) {
                res.setHeader( 'Content-type', 'application/json' );
                res.end( JSON.stringify( result ) );
            }
            else {
                res.setHeader( 'Content-type', 'text/plain' );
                res.end( result );
            }
          }
          else {
            var result = comfyWeb.APIs[ urlPath ]( qs, body, { req, res } );
            if( isArray( result ) || isObject( result ) ) {
                res.setHeader( 'Content-type', 'application/json' );
                res.end( JSON.stringify( result ) );
            }
            else {
                res.setHeader( 'Content-type', 'text/plain' );
                res.end( result );
            }
          }
        });
      }
      else {
        if( isAsync( comfyWeb.APIs[ urlPath ] ) ) {
          var result = await comfyWeb.APIs[ urlPath ]( qs, null, { req, res } );
          if( isArray( result ) || isObject( result ) ) {
              res.setHeader( 'Content-type', 'application/json' );
              res.end( JSON.stringify( result ) );
          }
          else {
              res.setHeader( 'Content-type', 'text/plain' );
              res.end( result );
          }
        }
        else {
          var result = comfyWeb.APIs[ urlPath ]( qs, null, { req, res } );
          if( isArray( result ) || isObject( result ) ) {
              res.setHeader( 'Content-type', 'application/json' );
              res.end( JSON.stringify( result ) );
          }
          else {
              res.setHeader( 'Content-type', 'text/plain' );
              res.end( result );
          }
        }
      }
    }
    else {
      const sanitizePath = path.normalize( parsedUrl.pathname ).replace( /^(\.\.[\/\\])+/, '' );
      let pathname = path.join( path.resolve( "index.html" ), sanitizePath ).replace( /\/$/, "" );
      if( fs.existsSync( pathname ) ) {
        serveFile( pathname, res );
      }
      else {
        pathname = path.join( path.resolve( "./web" ), sanitizePath );
        if( fs.existsSync( pathname ) ) {
          serveFile( pathname, res );
        }
        else {
          pathname = path.join( path.resolve( "./public" ), sanitizePath );
          if( fs.existsSync( pathname ) ) {
            serveFile( pathname, res );
          }
          else if( ( sanitizePath.endsWith( ".html" ) || sanitizePath.endsWith( ".css" ) ) && fs.existsSync( path.join( path.resolve( "./" ), sanitizePath ) ) ) {
            serveFile( path.join( path.resolve( "./" ), sanitizePath ), res );
          }
          else {
            res.statusCode = 500;
            res.end(`Error`);
          }
        }
      }
    }
  }
}

function startServer( port, { useCORS, Certificate, PrivateKey, CertificateChain } = { useCORS: true } ) {
  var server;
  isCORSEnabled = useCORS;
  if( Certificate && PrivateKey ) {
    const privateKey = fs.readFileSync( PrivateKey, 'utf8' );
    const certificate = fs.readFileSync( Certificate, 'utf8' );
    const ca = fs.readFileSync( CertificateChain, 'utf8' );
    const credentials = {
      key: privateKey,
      cert: certificate,
      ca: ca
    };
    server = require( 'https' ).createServer( credentials, webHandler );
  }
  else {
    server = require( 'http' ).createServer( webHandler );
  }

  server.listen( port, ( err ) => {
    if( err ) {
      return console.error( 'WebWebWeb could not start:', err );
    }
    console.log( `WebWebWeb is running on ${port}` );
  } );

  return server;
}

var comfyWeb = {
  APIs: {},
  Run: startServer
};

module.exports = comfyWeb;
