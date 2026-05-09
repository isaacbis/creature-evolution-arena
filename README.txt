LUPUS NARRATORE ONLINE - FIRESTORE

File inclusi:
- index.html
- style.css
- script.js
- firestore-rules.txt

Come pubblicarlo su Render al posto del gioco di carte:
1) Copia questi file nella cartella del vecchio gioco di carte.
2) Sostituisci index.html, style.css e script.js.
3) Fai commit e push:
   git add .
   git commit -m "Aggiungo Lupus multiplayer con Firestore"
   git push

Firestore:
- Il database deve essere attivo.
- In Firestore Rules puoi usare temporaneamente il contenuto di firestore-rules.txt.
- Sono regole aperte, utili per test e partite tra amici. Per produzione vera vanno rese più sicure.

Modalità:
1) Online multi-dispositivo:
   - Il narratore crea una stanza.
   - Gli altri entrano col codice stanza.
   - Il narratore assegna i ruoli.
   - Ogni giocatore vede solo la propria carta.
   - Lupi, veggente, guardia e votazioni funzionano da dispositivi separati.

2) Narratore unico:
   - Si usa un solo telefono.
   - Inserisci i nomi e mostri le carte una alla volta.
