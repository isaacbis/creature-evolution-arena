Lupus Narratore V18 - Gameplay Pro

Novità:
- QR code per entrare nella stanza online.
- Bottone copia codice stanza.
- Preset ruoli consigliati: consigliati, semplice, avanzato.
- Log privato narratore in locale e online.
- Schermata finale con ruoli rivelati.
- Conferme anti-tap per azioni importanti.
- Service worker per esperienza più da app/PWA.
- Manifest migliorato.
- Miglioramenti grafici per QR, log, finale e conferme.

File:
- index.html
- style.css
- script.js
- manifest.webmanifest
- firestore-rules.txt
- sw.js

Deploy:
git add .
git commit -m "Aggiorno Lupus V18 gameplay pro"
git push

Nota:
Le regole Firestore sono aperte per test. Per uso pubblico serio vanno rese più sicure.


Patch V18.1:
- Corretto errore creazione stanza multiplayer.
- Rimosse righe sbagliate hostLog: voteLog dentro createRoom().
- Migliorato messaggio errore in caso Firestore Rules/connessione.


Patch V18.2:
- Corretto problema probabile di cache/service worker che poteva continuare a servire script.js vecchio.
- Service worker passato a network-first per i file dell'app.
- Aggiunto badge V18.2 visibile in alto.
- Il pulsante Reset ora prova anche a cancellare service worker e cache.
- Aggiunto pannello errore tecnico con code/message reali.


Patch V18.3:
- Corretto QR code che poteva non apparire se la libreria QRCode CDN non veniva caricata.
- Aggiunto fallback QR tramite immagine esterna.
- Aggiunto box con codice stanza e link invito.
- Aggiunto bottone copia link invito.
- Aggiornato badge visibile a V18.3.
- Aggiornato service worker cache a v18-3.
