# Cookie, storage e tracker

## Evidenza tecnica

- **NESSUN TRACKER APPLICATIVO RILEVATO NEL REPOSITORY**.
- Nessun SDK analytics, advertising, Sentry, Hotjar o AI/LLM applicativo rilevato.
- Nessun uso esplicito di `localStorage`, `sessionStorage` o IndexedDB per i contenuti assessment.
- Supabase Auth usa la persistenza necessaria alla sessione secondo il proprio client.
- Vercel e Supabase possono produrre log infrastrutturali indipendenti dal codice applicativo.

## Controlli manuali necessari

1. Ispezione cookie/storage su dominio production prima e dopo login.
2. Verifica richieste di rete e domini terzi.
3. Stato Analytics/Speed Insights Vercel.
4. Configurazione Auth e provider esterni Supabase.
5. Eventuali banner o script inseriti fuori dal repository.
6. Documentazione provider su cookie e log.

L'assenza di tracker nel repository non determina automaticamente l'assenza di adempimenti cookie. La valutazione definitiva spetta a SIFO/DPO sulla configurazione effettiva.

