Creature Evolution Arena V54 - Nuovi mazzi + campi leggermente stretti

Aggiunto:
- Mazzo Drago
- Mazzo Non Morti
- Mazzo Meccanico
- Mazzo Bestie
- Mazzo Maghi
- Mazzo Pirati
- Mazzo Demoni
- Mazzo Ghiaccio

Modificato:
- Campi di gioco mobile leggermente più stretti rispetto alla versione campi larghi.
- Cache aggiornata a v54.
- Query string aggiornate a v54.

Dove stringere/allargare i campi nel CSS:
Cerca nel file style.css il blocco:
V54 - Nuovi mazzi + campi un po' più stretti

Poi modifica questi valori:
- grid-template-rows: minmax(116px...) per altezza dei due campi
- .field-zone min-height: 116px
- .compact-field height/min-height/max-height: 88px

Se vuoi campi più stretti: abbassa quei numeri.
Se vuoi campi più larghi: alza quei numeri.
