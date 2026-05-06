Creature Evolution Arena V60 - Carte scalabili + campi più alti

MODIFICHE:
- Campi gameplay mobile più alti.
- Campo avversario e tuo campo portati a 132px su telefono normale.
- Campo interno portato a 100px.
- Su telefoni molto piccoli: campi 122px e interno 92px.
- Informazioni dentro le carte rese proporzionali alla larghezza della carta tramite container units CSS.
- Se rimpicciolisci le carte cambiando --card-w / --card-h, testi, costo, badge, statistiche e spazi interni si adattano molto meglio.
- Cache aggiornata a v60.

DOVE MODIFICARE:
Nel file style.css cerca:
V60 - Carte scalabili + campi più alti

Valori principali:
--field-h: altezza campo esterno
--field-inner-h: altezza area interna creature
--card-w: larghezza carte nel campo
--card-h: altezza carte nel campo
--hand-card-w: larghezza carte nella mano
--hand-card-h: altezza carte nella mano
