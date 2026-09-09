# Checklist manuale Supabase

Legenda priorità: **Prima del pilot** oppure **Hardening futuro**. Nessuna voce è stata modificata nella Milestone 4B.

| Controllo | Priorità | Evidenza da acquisire | Stato |
| --- | --- | --- | --- |
| Account owner e organization | Prima del pilot | Screenshot/export membri, owner e recovery contact | CONTROLLO MANUALE NECESSARIO |
| Piano attivo | Prima del pilot | Pagina billing/usage datata | CONTROLLO MANUALE NECESSARIO |
| Regione progetto/database | Prima del pilot | Project settings | CONTROLLO MANUALE NECESSARIO |
| DPA sottoscritto/applicabile | Prima del pilot | Copia/versione/data | CONTROLLO MANUALE NECESSARIO |
| Elenco subprocessors | Prima del pilot | Elenco datato e meccanismo aggiornamenti | CONTROLLO MANUALE NECESSARIO |
| Backup e restore | Prima del pilot | Piano, frequenza, retention, prova restore | CONTROLLO MANUALE NECESSARIO |
| Log retention e accessi | Prima del pilot | Auth/API/database log settings | CONTROLLO MANUALE NECESSARIO |
| Conferma email Auth | Prima del pilot | Sign In/Providers | CONTROLLO MANUALE NECESSARIO; locale configurato `true` |
| Password policy | Prima del pilot | Lunghezza/requisiti effettivi | CONTROLLO MANUALE NECESSARIO; locale 12 + classi complete |
| Rate limiting | Prima del pilot | Auth Rate Limits | CONTROLLO MANUALE NECESSARIO |
| MFA team/admin | Prima del pilot | Organization security/membri | CONTROLLO MANUALE NECESSARIO |
| Session lifetime/refresh | Prima del pilot | Auth Sessions | CONTROLLO MANUALE NECESSARIO |
| API key e rotazione | Prima del pilot | Inventory key senza copiarne i valori | CONTROLLO MANUALE NECESSARIO |
| `service_role` | Prima del pilot | Dove è conservata e chi può usarla | CONTROLLO MANUALE NECESSARIO; assente dal client/repository |
| SSL enforcement | Prima del pilot | Database settings | CONTROLLO MANUALE NECESSARIO |
| Network restrictions | Hardening futuro, anticipare se piano consente | Restrizioni database/API | CONTROLLO MANUALE NECESSARIO |
| CAPTCHA | Hardening futuro/risk-based | Auth protection | CONTROLLO MANUALE NECESSARIO |
| Storage/bucket | Prima del pilot | Buckets e policy | CONTROLLO MANUALE NECESSARIO; app non usa storage per assessment |
| Edge Functions | Prima del pilot | Inventory/deploy | CONTROLLO MANUALE NECESSARIO; nessuna function versionata |
| Log drains | Hardening futuro | Destinazioni e accessi | CONTROLLO MANUALE NECESSARIO |
| Custom SMTP | Prima del pilot | Provider, DPA, DKIM/SPF e accessi | CONTROLLO MANUALE NECESSARIO |
| Schema/policy production | Prima del pilot | Confronto migration + test autorizzato | NON VALIDATO REMOTAMENTE |

