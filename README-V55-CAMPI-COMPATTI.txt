Creature Evolution Arena V55 - Campi mobile compatti

Basata sulla V54 con nuovi mazzi.

Modifica principale:
- Campi di gioco più bassi su telefono.
- Campo bot e campo giocatore ridotti.
- Area interna delle creature ridotta da 88px a 64px su mobile.
- Su telefoni molto piccoli ridotta a 58px.

Dove modificare a mano nel CSS:
Cerca: V55 - Campi più compatti su telefono

Valori principali:
- #gameScreen .field-zone min-height
- #gameScreen .compact-field height / min-height / max-height

Per stringere ancora, abbassa 64px a 58px o 54px.
Per riallargare, alza 64px a 72px o 80px.
