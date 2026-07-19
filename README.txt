LUPUS ONLINE V23 — MOBILE CLEAN

MIGLIORIE PRINCIPALI
- Home mobile con selettore Crea / Entra: viene mostrata una sola scheda alla volta.
- Barra fissa in basso durante la partita.
- Pulsante Azione evidenziato quando è il turno del giocatore.
- Banner chiaro: è il tuo turno / aspetta / hai votato / sei morto.
- Ruolo nascosto automaticamente dopo 10 secondi.
- Card bersaglio più grandi e facili da toccare.
- Votazione con barra di avanzamento.
- Il narratore vede chi deve ancora votare.
- Giocatori che hanno votato indicati senza rivelare il bersaglio.
- Durata più realistica:
  * turni notturni = tempo scelto
  * discussione giorno = 3 volte il tempo scelto
  * votazione = almeno 30 secondi / circa 2 volte il tempo scelto
- Stato connessione online/offline.
- Creazione stanza con controllo collisione codice.
- Entrata con transazione Firestore.
- Nomi duplicati bloccati.
- Limite di 24 giocatori.

CORREZIONI DI SEGRETEZZA
- Il numero dei lupi non viene più mostrato ai giocatori normali.
- Gli innamorati non sono più indicati pubblicamente nella lista.
- Ogni innamorato vede privatamente il proprio partner.
- I lupi vedono privatamente il branco.
- Il Traditore vede privatamente i lupi.
- La Strega vede la vittima scelta dai lupi.
- Cupido conserva privatamente i nomi degli innamorati scelti.

COME CARICARLA
Copia tutti i file nella cartella GitHub, poi:

git add .
git commit -m "Aggiorno Lupus Online V23 Mobile Clean"
git push origin main

DOPO IL DEPLOY
1. Controlla che appaia V23.
2. Apri Impostazioni.
3. Premi “Aggiorna app e svuota cache”.
4. Riapri il sito e prova prima con i bot.
