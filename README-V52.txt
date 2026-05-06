Creature Evolution Arena V52 - FIX DEFINITIVO BARRA FINALE

Problema risolto:
- La barra finale/bottom nav si sovrapponeva alle carte durante il gioco e ai pulsanti nelle altre schermate.

Correzione applicata:
- Barra finale disattivata nel CSS con regole !important finali.
- Barra rimossa anche dal DOM con JavaScript, così non può catturare tocchi.
- Padding inferiore ridotto perché non serve più spazio per la barra.
- Cache aggiornata a v52.
- Query string aggiornata: style.css?v=52, script.js?v=52, service-worker.js?v=52.

Installazione consigliata su telefono:
1. Sostituisci tutti i file del progetto con quelli di questa cartella.
2. Fai deploy.
3. Apri il sito dal browser e fai refresh.
4. Se usi la PWA già installata, eliminala dalla schermata Home e reinstallala.

Questa versione privilegia la giocabilità: niente barra fissa sopra alle carte.
