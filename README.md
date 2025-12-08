# PhaRMA T - Pharmacy Risk Management Assessment Tool

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-Proprietary-red.svg)
![Status](https://img.shields.io/badge/status-Production-green.svg)

## 📋 Descrizione

**PhaRMA T** è uno strumento professionale per la gestione del rischio in ambito farmaceutico, basato sulla metodologia FMEA (Failure Mode and Effects Analysis).

Permette di identificare, valutare e gestire i rischi nelle strutture sanitarie attraverso un processo strutturato e conforme alle best practice del settore.

🔗 **Live Demo:** [https://pharma-risk.vercel.app](https://pharma-risk.vercel.app)

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
| Frontend | React 18 + TypeScript |
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
