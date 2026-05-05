WEREWOLF 3D FIREBASE

Questa versione usa Firebase Firestore, quindi NON serve un server Node.

COME SI USA
1. Apri Firebase Console.
2. Nel progetto creature-evolution-arena attiva Firestore Database.
3. Per provare velocemente, inserisci le regole presenti in firestore.rules.
4. Apri index.html.
5. Crea una stanza, per esempio TOMMI38.
6. Gli altri aprono la stessa pagina e inseriscono lo stesso codice stanza.

IMPORTANTE
- Per giocare da telefoni diversi, tutti devono aprire la stessa pagina web.
- Puoi caricare questi file su Firebase Hosting, Render Static Site, Netlify o anche provarli da browser locale.
- La apiKey Firebase Web non è una password segreta, ma le regole Firestore sono fondamentali.
- Le regole incluse sono aperte solo per test. Per produzione vanno ristrette.

FILE
- index.html
- styles.css
- firebase-config.js
- app.js
- firestore.rules

COSA FA
- stanza con codice
- nickname per ogni giocatore
- movimenti realtime
- pupini visibili
- task simultanee
- lupo con kill live
- cadaveri e segnalazione
- meeting e voto
- sabotaggi
- ruoli base
