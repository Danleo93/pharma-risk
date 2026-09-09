# Checklist manuale Vercel

| Controllo | Priorità | Evidenza da acquisire | Stato |
| --- | --- | --- | --- |
| Owner/team e recovery | Prima del pilot | Membri, ruoli e owner | CONTROLLO MANUALE NECESSARIO |
| Piano | Prima del pilot | Billing/usage datato | CONTROLLO MANUALE NECESSARIO |
| DPA | Prima del pilot | Versione/data/accettazione | CONTROLLO MANUALE NECESSARIO |
| Subprocessors | Prima del pilot | Elenco datato e notifiche | CONTROLLO MANUALE NECESSARIO |
| Regioni Functions | Prima del pilot se Functions presenti | Project settings | CONTROLLO MANUALE NECESSARIO; nessuna Function applicativa rilevata |
| Variabili ambiente | Prima del pilot | Nomi, scope e accessi senza valori | CONTROLLO MANUALE NECESSARIO |
| Production branch | Prima del pilot | Git/project settings | CONTROLLO MANUALE NECESSARIO |
| Preview deployments | Prima del pilot | Accesso e variabili preview | CONTROLLO MANUALE NECESSARIO |
| Deployment protection | Prima del pilot | Protezione preview/production | CONTROLLO MANUALE NECESSARIO |
| Analytics/Speed Insights | Prima del pilot | Stato effettivo | CONTROLLO MANUALE NECESSARIO; SDK non rilevati nel repository |
| Log e retention | Prima del pilot | Runtime/deploy/access logs | CONTROLLO MANUALE NECESSARIO |
| Firewall/WAF | Hardening futuro o risk-based | Regole disponibili/applicate | CONTROLLO MANUALE NECESSARIO |
| Dominio e TLS | Prima del pilot | DNS, certificato, redirect | CONTROLLO MANUALE NECESSARIO |
| Git integration | Prima del pilot | Repository, branch, account autorizzati | CONTROLLO MANUALE NECESSARIO |
| Accessi e MFA | Prima del pilot | Membri/team/provider identity | CONTROLLO MANUALE NECESSARIO |
| Header browser | Prima del pilot | Verifica HTTP production | CONFIGURATI IN `vercel.json`, DA VALIDARE REMOTAMENTE |

