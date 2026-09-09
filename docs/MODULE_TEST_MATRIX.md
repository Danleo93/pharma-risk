# Matrice di test degli stati modulo

## Semantica attesa

| Stato | Home/sidebar | Route | SELECT DB proprietario | INSERT | UPDATE | DELETE | Export assessment |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `enabled` | Visibile | Accessibile | Si | Si | Si | Si | Si |
| `read_only` | Visibile, badge | Accessibile | Si | No | No | No | Configurabile |
| `disabled` | Nascosto | Bloccata | Si | No | No | No | No dalla UI |
| `unknown` | Nascosto | Bloccata | Non modificato | No client | No client | No client | No |

## Copertura automatica

Lo script `npm.cmd run security:modules` verifica:

- 87 write gate restrittivi su 29 tabelle;
- sola lettura client di `app_modules`;
- matrice enabled/read_only/disabled per FMEA;
- matrice enabled/read_only/disabled per RCA;
- matrice enabled/read_only/disabled per Gap Analysis;
- lettura DB conservata in stato disabled;
- negazione di insert, update e delete;
- export read-only configurato;
- riattivazione e conservazione dei dati;
- audit dei cambi di stato;
- protezione route centralizzata;
- filtro centralizzato di Home e sidebar;
- blocco mutazioni frontend;
- indipendenza dell'export GDPR.

Lo script ripristina sempre tutti i moduli su `enabled`, anche in caso di errore.

## Scenario RCA prioritario

| Passo | Atteso |
| --- | --- |
| RCA `enabled` | Lettura e CRUD consentiti secondo ownership |
| RCA `disabled` | Dato sintetico preservato, SELECT DB consentito, scritture negate |
| FMEA e Gap | Rimangono `enabled` |
| RCA nuovamente `enabled` | Dato precedente presente, scritture nuovamente consentite |
| RCA `read_only` | Consultazione ed export consentiti, scritture negate |

## Sessione gia aperta

La stessa sessione autenticata viene mantenuta durante il cambio amministrativo
di stato. I tentativi successivi di update/delete non modificano righe. Gli insert
ricevono un errore RLS. Questo dimostra che la configurazione client non puo
superare lo stato corrente nel database.

## Test complementari

La suite completa `npm.cmd run security:test` esegue inoltre:

- routing SPA;
- autenticazione locale;
- RLS CRUD su 30 tabelle;
- protezioni cross-parent;
- smoke funzionale FMEA/RCA/Gap;
- IDOR;
- input ostili;
- export JSON/PNG;
- regressioni Excel e PDF;
- audit dipendenze e segreti;
- build e confronto con baseline lint.

## Test manuali browser

1. Impostare RCA `read_only` e attendere il refresh o riportare la finestra in primo piano.
2. Verificare badge, consultazione ed export.
3. Tentare una modifica e verificare il messaggio di blocco.
4. Impostare RCA `disabled`.
5. Verificare assenza da Home/sidebar e blocco dell'URL diretto.
6. Riattivare RCA e verificare lo storico sintetico.
7. Ripetere almeno una volta per FMEA e Gap Analysis.

