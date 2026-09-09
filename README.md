# PhaRMA T - Pharmacy Risk Management Assessment Tool

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Status](https://img.shields.io/badge/status-Production-green.svg)

## 📋 Descrizione

**PhaRMA T** è uno strumento formativo, metodologico e documentale per la gestione del rischio in ambito farmaceutico. Integra i moduli FMEA, RCA e Gap Analysis.

Permette di identificare, valutare e gestire i rischi nelle strutture sanitarie attraverso un processo strutturato e conforme alle best practice del settore.

🔗 **Live Demo:** [https://pharma-risk.vercel.app](https://pharma-risk.vercel.app)

**Hosting, 9 settembre 2026:** preparazione della migrazione a Cloudflare Workers
Static Assets avviata; nessun passaggio del servizio effettuato. Vercel resta
invariato. Stato, verifiche e passaggi manuali sono registrati in
[CLOUDFLARE_MIGRATION.md](docs/CLOUDFLARE_MIGRATION.md).

---

## ✨ Funzionalità Principali

- **Assessment Wizard** - Creazione guidata di valutazioni del rischio
- **Catalogo Rischi** - Database di 150+ rischi pre-configurati per area
- **Valutazione FMEA** - Calcolo automatico RPN (Severità × Probabilità × Rilevabilità)
- **Matrice di Rischio 5×5** - Visualizzazione grafica interattiva
- **Analisi di Pareto** - Identificazione dei rischi prioritari (80/20)
- **Azioni Correttive** - Pianificazione e tracciamento interventi
- **Export Professionale** - Report PDF multi-pagina ed Excel
- **Rischi Personalizzati** - Possibilità di aggiungere rischi custom

---

## 🛠️ Stack Tecnologico

| Categoria | Tecnologia |
|-----------|------------|
| Frontend | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL) |
| Autenticazione | Supabase Auth |
| Grafici | Recharts |
| Export PDF | jsPDF + jspdf-autotable |
| Export Excel | SheetJS (xlsx) |
| Hosting | Vercel |

---

## 📊 Metodologia FMEA

Il sistema utilizza la metodologia FMEA con tre parametri di valutazione:

| Parametro | Descrizione | Scala |
|-----------|-------------|-------|
| **Severità (S)** | Gravità delle conseguenze | 1-5 |
| **Probabilità (P)** | Frequenza di accadimento | 1-5 |
| **Rilevabilità (D)** | Capacità di individuazione | 1-5 |

**RPN** = S × P × D (Range: 1-125)

| Classe | RPN | Azione |
|--------|-----|--------|
| 🔴 Alta | ≥ 50 | Intervento immediato |
| 🟡 Media | 20-49 | Azione programmata |
| 🟢 Bassa | < 20 | Monitoraggio |

---

## 📁 Struttura Progetto
```
pharma-risk/
├── src/
│   ├── components/     # Componenti React riutilizzabili
│   ├── pages/          # Pagine dell'applicazione
│   ├── services/       # Logica di business e API
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   └── lib/            # Configurazioni (Supabase)
├── public/             # Asset statici
└── supabase/           # Migrations e seed database
```

---

## Sviluppo locale

Con Node.js, Docker Desktop e Supabase CLI installati:

```powershell
git clone <URL_REPOSITORY>
cd pharma-risk
npm install
supabase start
supabase db reset
npm run dev
```

L'ambiente locale usa esclusivamente dati sintetici distinti per USER_A e USER_B. La procedura completa, i controlli automatici e i guardrail per production sono descritti in [docs/LOCAL_DEVELOPMENT.md](./docs/LOCAL_DEVELOPMENT.md).

Il report delle verifiche della Milestone 1 e disponibile in [docs/MILESTONE_1_VALIDATION.md](./docs/MILESTONE_1_VALIDATION.md); il confronto con lo schema remoto e in [docs/SCHEMA_DRIFT_MILESTONE_1.md](./docs/SCHEMA_DRIFT_MILESTONE_1.md).

### Security baseline locale

Con Supabase locale attivo e ricostruito:

```powershell
npm.cmd run security:test
```

La suite rifiuta endpoint non locali, usa soltanto USER_A/USER_B sintetici e produce risultati macchina in `.security-results/`. La baseline della Milestone 2A e in [docs/SECURITY_BASELINE.md](./docs/SECURITY_BASELINE.md); la remediation RLS relazionale della Milestone 2B.1 e documentata in [docs/RLS_REMEDIATION.md](./docs/RLS_REMEDIATION.md); la remediation delle dipendenze CRITICAL della Milestone 2B.2a e in [docs/DEPENDENCY_REMEDIATION_CRITICAL.md](./docs/DEPENDENCY_REMEDIATION_CRITICAL.md); React Router e SheetJS/xlsx sono documentati in [docs/DEPENDENCY_REMEDIATION_HIGH_RUNTIME.md](./docs/DEPENDENCY_REMEDIATION_HIGH_RUNTIME.md); la chiusura degli advisory residui e in [docs/RESIDUAL_DEPENDENCY_REVIEW.md](./docs/RESIDUAL_DEPENDENCY_REVIEW.md).

### Privacy by design tecnica

PhaRMA T distingue i dati tecnici di identita e sessione dai contenuti degli assessment, che sono progettati per informazioni anonime e non identificative. I form includono avvisi contestuali e un controllo locale pre-salvataggio per email, codici fiscali italiani plausibili e numeri telefonici plausibili. Il controllo e un ausilio alla compilazione e non certifica l'anonimizzazione.

Con Supabase locale attivo e ricostruito:

```powershell
npm.cmd run privacy:test
```

La suite usa soltanto dati sintetici e verifica detector, warning e nomi file degli export, isolamento USER_A/USER_B, stati modulari e assenza di persistenza o destinazioni esterne inattese. La documentazione tecnica e disponibile in:

- [Privacy tecnica](./docs/PRIVACY_TECHNICAL.md)
- [Inventario dei campi](./docs/PRIVACY_FIELD_INVENTORY.md)
- [Test privacy](./docs/PRIVACY_TESTING.md)
- [Flussi di rete e dati](./docs/NETWORK_DATA_FLOW.md)
- [Revisione cancellazione account](./docs/ACCOUNT_DELETION_TECHNICAL_REVIEW.md)
- [Readiness per la conservazione](./docs/DATA_RETENTION_TECHNICAL_READINESS.md)
- [Punti da validare con SIFO/DPO](./docs/PRIVACY_LEGAL_REVIEW_REQUIRED.md)

---

## 🚀 Deployment

L'applicazione è deployata su **Vercel** con CI/CD automatico da GitHub.

Ogni push sul branch `main` triggera automaticamente un nuovo deployment.

---

## 📄 Licenza

**© 2025 Dott. Daniele Leonardi Vinci, PharmD. Tutti i diritti riservati.**

Questo software è proprietario. Nessuna parte può essere riprodotta, distribuita o trasmessa senza autorizzazione scritta del titolare del copyright.

Consulta il file [LICENSE](./LICENSE) per i dettagli completi.

---

## 👨‍💻 Autore

**Dott. Daniele Leonardi Vinci, PharmD**
contact: daniele.leo93@gmail.com
- 🌐 Website: [pharma-risk.vercel.app](https://pharma-risk.vercel.app)
- 📧 Per informazioni e licenze: contattare l'autore

---

## ⚠️ Disclaimer

PhaRMA T è uno strumento di supporto alla gestione del rischio. Non sostituisce il giudizio professionale, le normative vigenti o le procedure specifiche della struttura sanitaria. L'utilizzo delle informazioni generate è sotto la responsabilità dell'utente.

---

<p align="center">
  <strong>PhaRMA T</strong> - Pharmacy Risk Management Assessment Tool<br>
  <em>Sviluppato per la sicurezza in farmacia</em>
</p>
