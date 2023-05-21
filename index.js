const url = require('url');
const fs = require('fs').promises;
const path = require('path');
const querystring = require( "querystring" );
const http = require('http');
const https = require('https');

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

function sanitizePath( filePath ) {
  return path.normalize( filePath ).replace( /^(\.\.[\/\\])+/, '' );
}

function getMatchingRoute( routes, urlPath ) {
    let pathParts = urlPath.split( "/" );
    let params = [];
    let route = routes.find( route => {
        if( urlPath !== route ) {
            // Check if any patterns match the urlPath
            let routeParts = route.split( "/" );
            if( pathParts.length !== routeParts.length ) {
                return false;
            }
            params = [];
            for( let p = 0; p < pathParts.length; p++ ) {
                if( routeParts[ p ] === "*" ) {
                    params.push( pathParts[ p ] ); // Push the parameter
                }
                else if( pathParts[ p ] !== routeParts[ p ] ) {
                    return false;
                }
            }
        }
        // We matched!
        return true;
    } );
    if( route ) {
        return {
            route: route,
            params: params
        };
    }
    return null;
}

async function serveFile( pathname, res ) {
  try {
    await fs.access( pathname );
    const stat = await fs.stat( pathname );
    if( stat.isDirectory() ) {
      pathname += '/index.html';
    }
    const data = await fs.readFile( pathname );
    const ext = path.parse( pathname ).ext;
    if( !res.getHeader( 'Content-Type' ) ) {
      res.setHeader( 'Content-type', mimeType[ext] || 'text/plain' );
    }
    res.end( data );
  }
  catch( err ) {
    if( err.code === 'ENOENT' ) {
      res.statusCode = 404;
      res.end( `File ${pathname} not found!` );
    }
    else {
      res.statusCode = 500;
      res.end( `Error getting the file: ${err}.` );
    }
  }
}

function readPostData( req ) {
  return new Promise( ( resolve, reject ) => {
    let body = null;
    req.on( 'data', chunk => {
      if( body === null ) {
        body = chunk;
      }
      else {
        body = Buffer.concat([ body, chunk ]);
      }
    });
    req.on( 'end', () => resolve( body ) );
    req.on( 'error', ( err ) => reject( err ) );
  } );
}

let isCORSEnabled = true;

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

  try {
    const parsedUrl = new URL( req.url, `http://${req.headers.host}` );
    const qs = querystring.decode( parsedUrl.searchParams.toString() );
    
    // Check for default file paths
    if( req.url.startsWith( "/web" ) || req.url.startsWith( "/public" ) ) {
      const sanitizedPath = sanitizePath( parsedUrl.pathname );
      let pathname = path.join( path.resolve( "." ), sanitizedPath );
      await serveFile( pathname, res );
      return;
    }

    const urlPath = comfyWeb.APIs[ parsedUrl.pathname ] ? parsedUrl.pathname : parsedUrl.pathname.substring( 1 );
    // Find matching API route
    const apiRoute = getMatchingRoute( Object.keys( comfyWeb.APIs ), urlPath );
    const fileRoute = getMatchingRoute( Object.keys( comfyWeb.Files ), urlPath );

    if( comfyWeb.APIs && apiRoute ) {
      // Handle API Request
      const body = req.method === "POST" ? await readPostData( req ) : null;
      const result = await comfyWeb.APIs[ apiRoute.route ]( qs, body, { req, res, params: apiRoute.params } );
      if( !res.getHeader( "Content-Type" ) ) {
        res.setHeader( 'Content-type', Array.isArray( result ) || typeof result === 'object' ? 'application/json' : 'text/plain' );
      }
      res.end( typeof result === 'object' ? JSON.stringify( result ) : result );
    }
    else {
      // Handle File/Default Request
      const sanitizedPath = sanitizePath( parsedUrl.pathname );
      // Check for index.html and default file paths
      const possibleFilePaths = [
        path.join( comfyWeb.Settings.Directory || ".", sanitizedPath ),
        path.join( ".", "web", sanitizedPath ),
        path.join( ".", "public", sanitizedPath ),
        path.join( comfyWeb.Settings.Directory || ".", sanitizedPath, "index.html" ),
        path.join( ".", "web", sanitizedPath, "index.html" ),
        path.join( ".", "public", sanitizedPath, "index.html" ),
      ];
      if( sanitizedPath.endsWith( ".html" ) || sanitizedPath.endsWith( ".css" ) ) {
        // Add root path as an additional possible path
        possibleFilePaths.push( path.join( ".", sanitizedPath ) );
      }
      for( const possiblePath of possibleFilePaths ) {
        try {
          await fs.access( possiblePath );
          if( comfyWeb.Files && fileRoute ) {
            await comfyWeb.Files[ filePath ]( qs, null, { req, res } );
          }
          await serveFile( possiblePath, res );
          return;
        }
        catch( err ) {
          // Skip if file doesn't exist, otherwise throw an error
          if( err.code !== 'ENOENT' ) {
            throw err;
          }
        }
      }
      // No file found
      res.statusCode = 404;
      res.end( `File not found` );
    }
  }
  catch( err ) {
    console.error( "Web Request Error:", req.url, err );
    res.statusCode = 500;
    res.end( `Error` );
  }
}

async function startServer( port, { useCORS, Certificate, PrivateKey, CertificateChain, Directory } = { useCORS: true } ) {
  let server;
  isCORSEnabled = useCORS;
  if( Certificate && PrivateKey ) {
    const privateKey = await fs.readFile( PrivateKey, 'utf8' );
    const certificate = await fs.readFile( Certificate, 'utf8' );
    const ca = await fs.readFile( CertificateChain, 'utf8' );
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
  comfyWeb.Settings.Directory = Directory;

  server.listen( port, ( err ) => {
    if( err ) {
      return console.error( 'WebWebWeb could not start:', err );
    }
    console.log( `WebWebWeb is running on ${port}` );
  } );

  return server;
}

let comfyWeb = {
  APIs: {},
  Files: {},
  Settings: {},
  Run: startServer
};

module.exports = comfyWeb;
