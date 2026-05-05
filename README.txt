CREATURE EVOLUTION ARENA - VERSIONE v22 MAX

File inclusi:
- index.html
- style.css
- script.js
- firebase.js
- service-worker.js
- manifest.json
- app-icon.svg

Cosa è stato migliorato:
1. Grafica più premium da mobile game
   - sfondo più profondo e cinematografico
   - particelle ambientali leggere
   - home più curata
   - dashboard rapida nella home
   - bottoni più premium
   - HUD battaglia più leggibile
   - campi giocatore/nemico più separati
   - carte più lucide con effetto foil
   - icona app ridisegnata

2. Esperienza mobile
   - barra inferiore stile app
   - safe area per iPhone
   - maggiore leggibilità su schermi piccoli
   - feedback aptico leggero sui pulsanti se il dispositivo lo supporta

3. Gameplay/logica
   - mazzi elementali resi puri:
     Fuoco solo Fuoco, Acqua solo Acqua, Foresta solo Foresta, Ombra solo Ombra, Luce solo Luce
   - mazzo Bilanciato resta misto
   - aggiunte nuove creature per ogni elemento
   - aggiunte nuove magie, equipaggiamenti e terreni
   - bot migliorato: sceglie bersagli più pericolosi invece di attaccare quasi a caso
   - uso magie del bot più intelligente

4. PWA/cache
   - service worker aggiornato a v22
   - versioni CSS/JS aggiornate a v22
   - manifest aggiornato

Come provarlo:
1. Apri index.html in locale oppure carica la cartella su Render/Netlify/Vercel/Firebase Hosting.
2. Se lo provi online, usa HTTPS.
3. Da telefono controlla soprattutto:
   - splash iniziale
   - home
   - scelta mazzo
   - partita contro bot
   - trascinamento carte
   - fine turno
   - boss
   - draft
   - online con codice stanza

Nota importante:
Se dopo averlo caricato online vedi ancora la vecchia versione, svuota cache del browser o cambia URL con ?v=22. Il service worker ora usa cache v22.
