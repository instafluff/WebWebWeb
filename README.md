# WebWebWeb
We built the Comfiest Way to make web APIs and static file servers live on Twitch for Coding Cafe!

**WebWebWeb** lets you create a web server with JSON APIs ***SUPER EASILY*** in just a few lines of code.

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

2. Any static files (e.g. index.html) can go into `/web` or `/public` and it will be served automagically in `http://locahost:8099/web` or `http://localhost:8099/public`

3. Add APIs
```javascript
var ComfyWeb = require("webwebweb");
ComfyWeb.APIs[ "/" ] = ( qs ) => {
  return { "test": "example!" };
};
ComfyWeb.Run( 8099 );
```

## Credits ##
Thank you to all the participants of this project!

**MacABearMan, Instafriend, That_MS_Gamer, Instafluff, ChatTranslator, sethorizer, simrose4u, Gilokk0, RIKACHET, UltraHal1, SaltPrincessGretchen, Ella_Fint, DutchGamer46, AntiViGames, aj2017, SoundOfGaming, DEAD_P1XL, smilesandtea, MerlinLeWizard, my_sweet_clementine, rockysenpai24, tabetaicooking, sparky_pugwash, violettepanda, TheSkiDragon, radiocaf, LinkoNetwork, jawibae, ElysiaGriffin, DarrnyH, jellydance, DevMerlin, marss112, roberttables, tiger_k1ng, LilyHazel, Psychosys82, BungalowGlow, Stay_Hydrated_Bot, pookiepew, Copperbeardy, TheHugoDahl, wil_bennett, WolvesGamingDen, FuriousFur, SausageCam, Kyoslilmonster, EndlessMoonfall, JD_Hirsch, guthron, shinageeexpress, JMSWRNR, schmiel_show, KitAnnLIVE, space_butts, lukepistachio, pipskidoodle, Kara_Kim, SIeepyMia, itsmechrisg, tapemoose, XandyCTz, Thrennenne, kollecz, Hytheria, YoursTrulyGreed**
