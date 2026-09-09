# Readiness per un eventuale trasferimento istituzionale

Nessun trasferimento viene eseguito nella Milestone 4B.

## GitHub

| Voce | Valutazione |
| --- | --- |
| Stato attuale | Account/repository esistente del proponente; controllo manuale necessario |
| Trasferibile | Repository, branch e history secondo funzioni GitHub |
| Prerequisiti | Organization SIFO, ruoli, MFA, visibility, ruleset e approvazione licenza/IP |
| Da preservare | History, tag, release, issue/PR utili, documentazione |
| Da riconfigurare | Actions secrets, Apps, deploy keys, branch protection, Vercel integration |
| Backup | Clone mirror/bundle e inventario configurazioni prima del trasferimento |
| Rollback | Re-transfer solo se consentito o ripristino da backup in repository autorizzato |
| Accesso coordinatore | Ruolo minimo necessario da deliberare |
| Impatto su Codex | Aggiornare remote/workspace; nessun impatto sul codice se accessi preservati |

## Supabase

| Voce | Valutazione |
| --- | --- |
| Stato attuale | Progetto esistente; piano, regione, owner e DPA da verificare manualmente |
| Trasferibile | Organization/project transfer se supportato dal piano e provider; alternativa migrazione controllata |
| Prerequisiti | Organization SIFO, billing, DPA, regione, owner, backup e finestra manutenzione |
| Da preservare | Schema, dati, Auth users, policy, funzioni, configurazione email e log necessari |
| Da riconfigurare | URL/keys frontend, redirect Auth, SMTP, secrets, integrazioni e accessi |
| Backup | Dump schema/dati autorizzato, export Auth secondo strumenti provider, prova restore |
| Rollback | Mantenere progetto origine non distrutto finché collaudo e approvazione non sono conclusi |
| Accesso coordinatore | Ruolo tecnico limitato e formalizzato |
| Impatto su Codex | Aggiornare env locali/remoti; repository resta riproducibile con Supabase locale |

## Vercel

| Voce | Valutazione |
| --- | --- |
| Stato attuale | Progetto/team esistente; controllo manuale necessario |
| Trasferibile | Project transfer/team move se supportato; alternativa nuovo progetto dalla stessa repository |
| Prerequisiti | Team SIFO, dominio/DNS, variabili ambiente e Git integration |
| Da preservare | Configurazione build, dominio, env names, production branch e header |
| Da riconfigurare | Env values Supabase, accessi, protection, analytics/log settings |
| Backup | Export/inventario settings e build riproducibile dal repository |
| Rollback | Conservare deployment precedente e DNS rollback fino al collaudo |
| Accesso coordinatore | Ruolo deployment/manutenzione da deliberare |
| Impatto su Codex | Nessuno sul codice; cambia workflow deploy e autorizzazioni |

## Criterio di completamento futuro

Trasferimento riuscito solo dopo test Auth, isolamento RLS, CRUD FMEA/RCA/Gap, export, dominio/TLS, recovery account e approvazione SIFO. Fino ad allora nessun account origine deve essere dismesso.
