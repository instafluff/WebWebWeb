import { URL } from "url";
import fs from "fs/promises";
import path from "path";
import querystring from "querystring";
import http from "http";
import https from "https";

// Static File Serve Code based on https://adrianmejia.com/building-a-node-js-static-file-server-files-over-http-using-es6/
const mimeType: { [key: string]: string } = {
	".ico": "image/x-icon",
	".html": "text/html",
	".js": "text/javascript",
	".json": "application/json",
	".css": "text/css",
	".png": "image/png",
	".jpg": "image/jpeg",
	".wav": "audio/wav",
	".mp3": "audio/mpeg",
	".svg": "image/svg+xml",
	".pdf": "application/pdf",
	".doc": "application/msword",
	".eot": "appliaction/vnd.ms-fontobject",
	".ttf": "aplication/font-sfnt",
};

function sanitizePath( filePath: string ): string {
	return path.normalize( filePath ).replace( /^(\.\.[\/\\])+/, "" );
}

function getMatchingRoute( routes: string[], urlPath: string ) {
	let pathParts = urlPath.split( "/" );
	let params: string[] = [];
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
			params: params,
		};
	}
	return null;
}

async function serveFile( pathname: string, res: http.ServerResponse ) {
	try {
		await fs.access( pathname );
		const stat = await fs.stat( pathname );
		if( stat.isDirectory() ) {
			pathname += "/index.html";
		}
		const data = await fs.readFile( pathname );
		const ext = path.parse( pathname ).ext;
		if( !res.getHeader( "Content-Type" ) ) {
			res.setHeader( "Content-type", mimeType[ ext ] || "text/plain" );
		}
		res.end( data );
	}
	catch( err: any ) {
		if( err.code === "ENOENT" ) {
			res.statusCode = 404;
			res.end( `File ${pathname} not found!` );
		}
		else {
			res.statusCode = 500;
			res.end( `Error getting the file: ${err}.` );
		}
	}
}

function readPostData( req: http.IncomingMessage ): Promise<Buffer> {
	return new Promise( ( resolve, reject ) => {
		let body: Buffer | null = null;
		req.on( "data", chunk => {
			if( body === null ) {
				body = chunk;
			}
			else {
				body = Buffer.concat( [ body, chunk ] );
			}
		} );
		req.on( "end", () => resolve( body! ) );
		req.on( "error", ( err ) => reject( err ) );
	} );
}

let isCORSEnabled: boolean = true;

async function webHandler( req: http.IncomingMessage, res: http.ServerResponse ) {
	if( isCORSEnabled ) {
		// Handle CORS
		res.setHeader( "Access-Control-Allow-Origin", "*" );
		res.setHeader( "Access-Control-Request-Method", "*" );
		res.setHeader( "Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE" );
		res.setHeader( "Access-Control-Allow-Headers", "*" );
		if( req.method === "OPTIONS" ) {
			res.writeHead( 204 );
			res.end();
			return;
		}
	}

	try {
		const rawUrl = req.url as string;
		const parsedUrl = new URL( rawUrl, `http://${req.headers.host}` );
		const qs = querystring.decode( parsedUrl.searchParams.toString() );

		// Check for default file paths
		if( rawUrl.startsWith( "/web" ) || rawUrl.startsWith( "/public" ) ) {
			const sanitizedPath = sanitizePath( parsedUrl.pathname );
			let pathname = path.join( path.resolve( "." ), sanitizedPath );
			await serveFile( pathname, res );
			return;
		}

		const urlPath = comfyWeb.APIs[ parsedUrl.pathname ] ? parsedUrl.pathname : parsedUrl.pathname.substring( 1 );
		// Find matching API route
		const apiRoute = comfyWeb.APIs[ urlPath ] ? { route: urlPath, params: [] } : getMatchingRoute( Object.keys( comfyWeb.APIs ), urlPath );

		if( comfyWeb.APIs && apiRoute ) {
			// Handle API Request
			const body = req.method === "POST" ? await readPostData( req ) : null;
			const result = await comfyWeb.APIs[ apiRoute.route ]( qs, body, { req, res, params: apiRoute.params } );
			if( !res.getHeader( "Content-Type" ) ) {
				res.setHeader( "Content-type", Array.isArray( result ) || typeof result === "object" ? "application/json" : "text/plain" );
			}
			res.end( typeof result === "object" ? JSON.stringify( result ) : result );
		}
		else {
			const fileRoute = comfyWeb.Files[ urlPath ] ? { route: urlPath, params: [] } : getMatchingRoute( Object.keys( comfyWeb.Files ), urlPath );
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
						await comfyWeb.Files[ fileRoute.route ]( qs, null, { req, res } );
					}
					await serveFile( possiblePath, res );
					return;
				}
				catch( err: any ) {
					// Skip if file doesn't exist, otherwise throw an error
					if( err.code !== "ENOENT" ) {
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

async function startServer( port: number, { useCORS, Certificate, PrivateKey, CertificateChain, Directory }: { useCORS?: boolean, Certificate?: string, PrivateKey?: string, CertificateChain?: string, Directory?: string } = { useCORS: true } ) {
	let server;
	isCORSEnabled = !!useCORS;
	if( Certificate && PrivateKey ) {
		const privateKey = await fs.readFile( PrivateKey, "utf8" );
		const certificate = await fs.readFile( Certificate, "utf8" );
		const ca = CertificateChain ? await fs.readFile( CertificateChain, "utf8" ) : undefined;
		const credentials = {
			key: privateKey,
			cert: certificate,
			ca: ca,
		};
		server = require( "https" ).createServer( credentials, webHandler );
	}
	else {
		server = require( "http" ).createServer( webHandler );
	}
	comfyWeb.Settings.Directory = Directory;

	server.listen( port, ( err: any ) => {
		if( err ) {
			return console.error( "WebWebWeb could not start:", err );
		}
		console.log( `WebWebWeb is running on ${port}` );
	} );

	return server;
}

const comfyWeb: {
	APIs: { [ key: string ] : ( qs: any, body: Buffer | null, context: { req: http.IncomingMessage, res: http.ServerResponse, params: string[] } ) => Promise<any> | any },
	Files: { [ key: string ] : ( qs: any, body: Buffer | null, context: { req: http.IncomingMessage, res: http.ServerResponse } ) => Promise<any> | any },
	Settings: { Directory?: string },
	Run: ( port: number, { useCORS, Certificate, PrivateKey, CertificateChain, Directory }: { useCORS?: boolean, Certificate?: string, PrivateKey?: string, CertificateChain?: string, Directory?: string } ) => Promise<http.Server | https.Server>,
	default: any,
} = {
	APIs: {},
	Files: {},
	Settings: {},
	Run: startServer,
	default: undefined,
};

comfyWeb.default = comfyWeb; // Make this a default export as well to support ES6 import syntax
export = comfyWeb;
