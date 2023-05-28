"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
const url_1 = require("url");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const querystring_1 = __importDefault(require("querystring"));
// Static File Serve Code based on https://adrianmejia.com/building-a-node-js-static-file-server-files-over-http-using-es6/
const mimeType = {
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
function sanitizePath(filePath) {
    return path_1.default.normalize(filePath).replace(/^(\.\.[\/\\])+/, "");
}
function getMatchingRoute(routes, urlPath) {
    let pathParts = urlPath.split("/");
    let params = [];
    let route = routes.find(route => {
        if (urlPath !== route) {
            // Check if any patterns match the urlPath
            let routeParts = route.split("/");
            if (pathParts.length !== routeParts.length) {
                return false;
            }
            params = [];
            for (let p = 0; p < pathParts.length; p++) {
                if (routeParts[p] === "*") {
                    params.push(pathParts[p]); // Push the parameter
                }
                else if (pathParts[p] !== routeParts[p]) {
                    return false;
                }
            }
        }
        // We matched!
        return true;
    });
    if (route) {
        return {
            route: route,
            params: params,
        };
    }
    return null;
}
function serveFile(pathname, res) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield promises_1.default.access(pathname);
            const stat = yield promises_1.default.stat(pathname);
            if (stat.isDirectory()) {
                pathname += "/index.html";
            }
            const data = yield promises_1.default.readFile(pathname);
            const ext = path_1.default.parse(pathname).ext;
            if (!res.getHeader("Content-Type")) {
                res.setHeader("Content-type", mimeType[ext] || "text/plain");
            }
            res.end(data);
        }
        catch (err) {
            if (err.code === "ENOENT") {
                res.statusCode = 404;
                res.end(`File ${pathname} not found!`);
            }
            else {
                res.statusCode = 500;
                res.end(`Error getting the file: ${err}.`);
            }
        }
    });
}
function readPostData(req) {
    return new Promise((resolve, reject) => {
        let body = null;
        req.on("data", chunk => {
            if (body === null) {
                body = chunk;
            }
            else {
                body = Buffer.concat([body, chunk]);
            }
        });
        req.on("end", () => resolve(body));
        req.on("error", (err) => reject(err));
    });
}
let isCORSEnabled = true;
function webHandler(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        if (isCORSEnabled) {
            // Handle CORS
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Request-Method", "*");
            res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, PUT, POST, DELETE");
            res.setHeader("Access-Control-Allow-Headers", "*");
            if (req.method === "OPTIONS") {
                res.writeHead(204);
                res.end();
                return;
            }
        }
        try {
            const rawUrl = req.url;
            const parsedUrl = new url_1.URL(rawUrl, `http://${req.headers.host}`);
            const qs = querystring_1.default.decode(parsedUrl.searchParams.toString());
            // Check for default file paths
            if (rawUrl.startsWith("/web") || rawUrl.startsWith("/public")) {
                const sanitizedPath = sanitizePath(parsedUrl.pathname);
                let pathname = path_1.default.join(path_1.default.resolve("."), sanitizedPath);
                yield serveFile(pathname, res);
                return;
            }
            const urlPath = comfyWeb.APIs[parsedUrl.pathname] ? parsedUrl.pathname : parsedUrl.pathname.substring(1);
            // Find matching API route
            const apiRoute = getMatchingRoute(Object.keys(comfyWeb.APIs), urlPath);
            const fileRoute = getMatchingRoute(Object.keys(comfyWeb.Files), urlPath);
            if (comfyWeb.APIs && apiRoute) {
                // Handle API Request
                const body = req.method === "POST" ? yield readPostData(req) : null;
                const result = yield comfyWeb.APIs[apiRoute.route](qs, body, { req, res, params: apiRoute.params });
                if (!res.getHeader("Content-Type")) {
                    res.setHeader("Content-type", Array.isArray(result) || typeof result === "object" ? "application/json" : "text/plain");
                }
                res.end(typeof result === "object" ? JSON.stringify(result) : result);
            }
            else {
                // Handle File/Default Request
                const sanitizedPath = sanitizePath(parsedUrl.pathname);
                // Check for index.html and default file paths
                const possibleFilePaths = [
                    path_1.default.join(comfyWeb.Settings.Directory || ".", sanitizedPath),
                    path_1.default.join(".", "web", sanitizedPath),
                    path_1.default.join(".", "public", sanitizedPath),
                    path_1.default.join(comfyWeb.Settings.Directory || ".", sanitizedPath, "index.html"),
                    path_1.default.join(".", "web", sanitizedPath, "index.html"),
                    path_1.default.join(".", "public", sanitizedPath, "index.html"),
                ];
                if (sanitizedPath.endsWith(".html") || sanitizedPath.endsWith(".css")) {
                    // Add root path as an additional possible path
                    possibleFilePaths.push(path_1.default.join(".", sanitizedPath));
                }
                for (const possiblePath of possibleFilePaths) {
                    try {
                        yield promises_1.default.access(possiblePath);
                        if (comfyWeb.Files && fileRoute) {
                            yield comfyWeb.Files[fileRoute.route](qs, null, { req, res });
                        }
                        yield serveFile(possiblePath, res);
                        return;
                    }
                    catch (err) {
                        // Skip if file doesn't exist, otherwise throw an error
                        if (err.code !== "ENOENT") {
                            throw err;
                        }
                    }
                }
                // No file found
                res.statusCode = 404;
                res.end(`File not found`);
            }
        }
        catch (err) {
            console.error("Web Request Error:", req.url, err);
            res.statusCode = 500;
            res.end(`Error`);
        }
    });
}
function startServer(port, { useCORS, Certificate, PrivateKey, CertificateChain, Directory } = { useCORS: true }) {
    return __awaiter(this, void 0, void 0, function* () {
        let server;
        isCORSEnabled = !!useCORS;
        if (Certificate && PrivateKey) {
            const privateKey = yield promises_1.default.readFile(PrivateKey, "utf8");
            const certificate = yield promises_1.default.readFile(Certificate, "utf8");
            const ca = CertificateChain ? yield promises_1.default.readFile(CertificateChain, "utf8") : undefined;
            const credentials = {
                key: privateKey,
                cert: certificate,
                ca: ca,
            };
            server = require("https").createServer(credentials, webHandler);
        }
        else {
            server = require("http").createServer(webHandler);
        }
        comfyWeb.Settings.Directory = Directory;
        server.listen(port, (err) => {
            if (err) {
                return console.error("WebWebWeb could not start:", err);
            }
            console.log(`WebWebWeb is running on ${port}`);
        });
        return server;
    });
}
const comfyWeb = {
    APIs: {},
    Files: {},
    Settings: {},
    Run: startServer,
    default: undefined,
};
comfyWeb.default = comfyWeb; // Make this a default export as well to support ES6 import syntax
module.exports = comfyWeb;
//# sourceMappingURL=index.js.map