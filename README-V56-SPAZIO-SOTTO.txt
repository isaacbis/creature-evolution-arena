Creature Evolution Arena V56 - spazio sotto corretto

Modifica principale:
- Tolto il padding-bottom eccessivo dal gameplay mobile.
- Campi bot e giocatore resi davvero compatti.
- HUD superiore ancora più basso.
- Log nascosto durante il gameplay mobile.
- Mano carte mantenuta visibile in basso senza spazio vuoto inutile.
- Cache aggiornata a v56.

Dove regolare tu:
Nel file style.css cerca: V56 - Tolto spazio vuoto sotto

Valori principali:
- #gameScreen .field-zone height: 76px
- #gameScreen .compact-field height: 54px
- #gameScreen.game-screen:not(.hidden) padding-bottom

Se vuoi campi ancora più stretti, abbassa 76px e 54px.
