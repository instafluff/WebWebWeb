# WebWebWeb
We built the Comfiest Way to make web APIs and static file servers live on Twitch for Coding Cafe!

**WebWebWeb** lets you create a web server with APIs ***SUPER EASILY*** in just a few lines of code.

*If you need a secure web server with SSL certificates from [Let's Encrypt](https://www.letsencrypt.org), check out [WebWebWebs](https://www.github.com/instafluff/WebWebWebs) which will automatically retrieve and renew them for you while maintaining the simplicity of WebWebWeb!*

## Instafluff ##
> *Like these projects? The best way to support my open-source projects is by becoming a Comfy Sponsor on GitHub!*

> https://github.com/sponsors/instafluff

> *Come and hang out with us at the Comfiest Corner on Twitch!*

> https://twitch.tv/instafluff

## Instructions ##

1. Install `webwebweb`
```
npm install webwebweb --save
```

2. Start the server on a port (e.g. 8099). Any HTML pages (e.g. index.html) can be placed in the root directory `/` and static files (e.g. images, scripts, and other HTML pages) can go into `/web` or `/public` and it will be served automagically in `http://locahost:8099/web` or `http://localhost:8099/public`
```javascript
require( "webwebweb" ).Run( 8099 );
```

3. (Optional) Add APIs
```javascript
var ComfyWeb = require( "webwebweb" );
ComfyWeb.APIs[ "/" ] = ( qs, body, opts ) => {
  return { "test": "example!" };
};
ComfyWeb.Run( 8099 );
```

### Options ###

The `Run()` function in **WebWebWeb** accepts several optional parameters:
- useCORS (default: true)
- Certificate
- PrivateKey
- CertificateChain

## Handling POST/PUT/DELETE requests ##
All request methods are sent to the API handler. You can check the `opts.req.method` value to response accordingly and parse the body object for data.
```javascript
var ComfyWeb = require( "webwebweb" );
ComfyWeb.APIs[ "/account" ] = ( qs, body, opts ) => {
    switch( opts.req.method ) {
        case "GET":
            return { "account": "test" };
        case "POST":
            return JSON.parse( body );
        case "PUT":
            return { "status": "updated" };
        case "DELETE":
            return {};
    }
};
ComfyWeb.Run( 8099 );
```

## Reading Request Headers ##
The request object is passed in to the API handler. You can check for header values in `opts.req.headers`.
```javascript
var ComfyWeb = require( "webwebweb" );
ComfyWeb.APIs[ "/" ] = ( qs, body, opts ) => {
    return opts.req.headers;
};
ComfyWeb.Run( 8099 );
```

## Enabling CORS ##
Actually, CORS is enabled by default. To disable CORS, set the `useCORS` parameter:
```javascript
var ComfyWeb = require( "webwebweb" );
ComfyWeb.Run( 8099, {
    useCORS: false
} );
```

## Using SSL Certificates ##
To add TLS support, pass in the paths to your Certificate, Key, and Certificate Chain files:
```javascript
var ComfyWeb = require( "webwebweb" );
ComfyWeb.Run( 8099, {
    Certificate: "cert.pem",
    PrivateKey: "key.pem",
    CertificateChain: "chain.pem"
} );
```

## Credits ##
Thank you to all the participants of this project!

**MacABearMan, Instafriend, That_MS_Gamer, Instafluff, ChatTranslator, sethorizer, simrose4u, Gilokk0, RIKACHET, UltraHal1, SaltPrincessGretchen, Ella_Fint, DutchGamer46, AntiViGames, aj2017, SoundOfGaming, DEAD_P1XL, smilesandtea, MerlinLeWizard, my_sweet_clementine, rockysenpai24, tabetaicooking, sparky_pugwash, violettepanda, TheSkiDragon, radiocaf, LinkoNetwork, jawibae, ElysiaGriffin, DarrnyH, jellydance, DevMerlin, marss112, roberttables, tiger_k1ng, LilyHazel, Psychosys82, BungalowGlow, Stay_Hydrated_Bot, pookiepew, Copperbeardy, TheHugoDahl, wil_bennett, WolvesGamingDen, FuriousFur, SausageCam, Kyoslilmonster, EndlessMoonfall, JD_Hirsch, guthron, shinageeexpress, JMSWRNR, schmiel_show, KitAnnLIVE, space_butts, lukepistachio, pipskidoodle, Kara_Kim, SIeepyMia, itsmechrisg, tapemoose, XandyCTz, Thrennenne, kollecz, Hytheria, YoursTrulyGreed**
