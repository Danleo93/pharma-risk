# Governance tecnica

## Stato attuale

Secondo il perimetro dichiarato della Milestone 4B, GitHub, Supabase e Vercel restano su account esistenti del proponente. È uno stato progettuale e non viene qualificato automaticamente come illecito.

## Requisiti minimi per il pilot

Devono essere definiti formalmente:

- owner di ogni account e contatto di recovery;
- amministratori e privilegi minimi;
- approvazione dei provider e relativi documenti;
- chi può intervenire su database, Auth, deploy e repository;
- canale e reperibilità per incidenti;
- backup e ripristino;
- gestione accessi in caso di indisponibilità del coordinatore;
- change management, approvazione release e rollback.

## Scenario futuro possibile

Senza effettuarlo ora, è tecnicamente valutabile il passaggio a:

- GitHub Organization SIFO;
- Supabase Organization/progetto SIFO;
- Vercel Team SIFO.

Il trasferimento deve essere preceduto da backup, inventario configurazioni, prova su ambiente non production, piano rollback e definizione dell'accesso futuro del coordinatore.

## Separazione delle responsabilità

| Piano | Oggetto | Decisione |
| --- | --- | --- |
| Proprietà intellettuale | Codice, licenza, riuso, manutenzione | Accordo progettuale/legale |
| Governance tecnica | Account, privilegi, deploy, recovery | SIFO + owner tecnico |
| Ruoli GDPR | Finalità, mezzi, responsabili, autorizzati | SIFO/DPO |
| Esercizio operativo | Supporto, incidenti, cancellazioni, release | Procedura approvata |

