VERSIONE V10 - FIX VEGGENTE

- Timer automatico base portato a 20 secondi.
- Il Veggente, dopo il controllo, ha 10 secondi dedicati per leggere il risultato.
- Il risultato del Veggente resta visibile solo sul suo dispositivo nel pannello personale, anche se la fase va avanti.
- Il risultato non viene mostrato agli altri giocatori.

LUPUS NARRATORE - VERSIONE COMPLETA V4

File inclusi:
- index.html
- style.css
- script.js
- firestore-rules.txt

MODALITA'
1) Narratore unico
   - Funziona anche senza Firestore.
   - Inserisci i nomi.
   - Scegli i ruoli.
   - Mostri le carte una alla volta.
   - Il telefono parla e guida notte/giorno.
   - Quando una persona muore, i giocatori NON vedono il ruolo.
   - Solo il narratore può vedere/gestire i ruoli.
   - Ora puoi anche saltare la votazione e andare direttamente alla notte.

2) Multi-dispositivo
   - Serve Firestore attivo.
   - Il narratore crea una stanza.
   - I giocatori entrano col codice stanza dal proprio telefono.
   - Ogni giocatore vede solo la propria carta.
   - Durante la notte, i ruoli speciali fanno le azioni dal proprio telefono.
   - Durante il giorno, ogni giocatore vota dal proprio telefono.
   - Il narratore può aprire la votazione oppure saltarla.
   - I morti non mostrano il ruolo agli altri giocatori.

3) Modalità prova
   - Carica nomi finti per testare il gioco subito.

NOVITA V4
- Aggiunte frasi casuali e più simpatiche al narratore.
- Il narratore ora cambia tono in base alla fase: notte, lupi, veggente, guardia, strega, giorno, morti e votazione.
- Le frasi restano brevi per non rallentare la partita.

CORREZIONI V3
- Aggiunto pulsante per saltare la votazione in modalità Narratore unico.
- Aggiunto pulsante per saltare la votazione in modalità Multi-dispositivo.
- Aggiunto controllo iniziale: non puoi scegliere più ruoli dei giocatori.
- Aggiunto controllo iniziale: serve almeno un Lupo Mannaro o un Lupo Alfa.
- Migliorata la gestione del Cacciatore online: se muore, il narratore può scegliere se farlo sparare o no.
- Il ruolo dei morti resta nascosto ai giocatori.
- Le note su Cacciatore, Giullare e ruoli dei morti restano visibili solo al narratore.

DEPLOY SU RENDER
Se vuoi sostituire il vecchio gioco di carte:
1. Copia questi file nella cartella del vecchio progetto.
2. Cancella o ignora i vecchi file non necessari.
3. Esegui:
   git add .
   git commit -m "Aggiorno Lupus narratore completo V4"
   git push

Se Render è uno Static Site:
- Build Command: echo "No build needed"
- Publish Directory: .

NOTE IMPORTANTI
- Alcuni ruoli avanzati come Cupido, Medium, Lupo Alfa e Traditore sono presenti come ruoli/varianti, ma non hanno ancora una gestione automatica completa.
- Le regole Firestore incluse sono aperte per test.
- Per una versione pubblica seria andrebbero rese più sicure con autenticazione.

AGGIORNAMENTO V5
- Corretto bug multiplayer: il narratore non deve essere per forza registrato come giocatore. Prima, dopo l'avvio, poteva perdere il pannello di controllo e restare bloccato sulla notte.
- Corretto flusso notte online: il pulsante Continua fase non resta più su “Fase completata”; dopo l'ultimo passaggio puoi premere ancora Continua fase oppure “Risolvi notte” per passare al giorno.
- Aggiunti bot di prova nella modalità multiplayer: dalla lobby il narratore può aggiungere 6 bot, rimuoverli e poi assegnare i ruoli.
- Aggiunto pulsante “Fai giocare i bot”: durante la notte registra azioni automatiche dei bot; durante la votazione registra voti automatici.

COME TESTARE IL MULTIPLAYER CON I BOT
1. Crea una stanza multiplayer.
2. Premi “Aggiungi 6 bot di prova”.
3. Aggiungi eventualmente anche il tuo telefono come giocatore entrando con il codice stanza.
4. Premi “Assegna ruoli e inizia”.
5. Durante la notte premi “Fai giocare i bot”, poi fai avanzare le fasi con “Continua fase”.
6. A fine notte premi ancora “Continua fase” oppure “Risolvi notte”.
7. Di giorno apri la votazione, premi “Fai giocare i bot”, poi “Conta voti / elimina”.

VERSIONE V6 - MULTIPLAYER AUTOMATICO
- Nel multiplayer non serve più un narratore umano che prema sempre Continua.
- Dopo l'avvio, ogni fase notturna dura massimo 15 secondi.
- Se il ruolo completa prima la sua azione, la fase passa subito alla successiva.
- La votazione dura massimo 15 secondi; se tutti votano prima, il sistema conta subito.
- Nota tecnica: essendo un'app solo HTML/CSS/JS + Firestore, almeno un dispositivo deve restare aperto nella stanza per far avanzare i timer.

VERSIONE V8 - CORREZIONE VOTO E FINE PARTITA
- Corretto voto multiplayer: ogni giocatore vivo può votare una sola volta per ogni giorno.
- Dopo aver votato, il giocatore vede il messaggio “Hai già votato” e non può cambiare voto.
- Alla votazione successiva i voti vengono azzerati, quindi può votare di nuovo una volta.
- Corretto fine partita: se non ci sono più lupi vivi, la fase diventa “gameOver” e il gioco non prosegue più con giorno/notte/votazioni.
- Corretto anche il caso in cui la vittoria arriva dopo la notte, dopo la votazione o dopo il colpo del Cacciatore.
