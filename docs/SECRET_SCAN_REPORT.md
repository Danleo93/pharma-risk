# Secret scan report

Data: 25 agosto 2026  
Ambito: working tree, file tracciati e cronologia Git completa.

## Esito

**WARNING senza segreti ad alta confidenza.**

- potenziali segreti ad alta confidenza: 0;
- elementi da revisione manuale: 0;
- fixture/placeholder locali: 5;
- valori dei match: mai stampati o salvati nel report.

## Pattern verificati

- Supabase secret/service-role key;
- Supabase JWT secret;
- GitHub PAT classici e fine-grained;
- Vercel token;
- connection string PostgreSQL con credenziali;
- assegnazioni letterali di password o API key;
- file `.env` e regole `.gitignore`.

## Elementi attesi

Le occorrenze rilevate sono password sintetiche locali in:

- `supabase/seed.sql`;
- `scripts/verify-local-supabase.mjs`;
- `scripts/security/lib.mjs`;
- test Auth con password deliberatamente errata.

Non sono credenziali production e sono destinate soltanto al dataset locale USER_A/USER_B.

## File ambiente

`.gitignore`:

- ignora `.env`;
- ignora `.env.*`;
- ammette esplicitamente `.env.example`;
- ammette esplicitamente `.env.development`.

L'eccezione `.env.development` e accettabile soltanto finche il file contiene URL localhost e chiave pubblica dell'istanza Supabase locale. Il guardrail della suite verifica questa condizione prima dei test.

## Limiti del controllo

Il controllo usa un pattern scanner locale equivalente e non introduce gitleaks come dipendenza. Riduce i falsi positivi e non espone i valori, ma non puo dimostrare l'assenza assoluta di segreti con formati sconosciuti, codificati o suddivisi.

Prima di ogni rilascio istituzionale si raccomanda:

1. riesecuzione della suite;
2. secret scanning GitHub abilitato, se disponibile;
3. verifica manuale di variabili Vercel e Supabase Dashboard;
4. rotazione immediata di ogni credenziale reale eventualmente comparsa in Git, anche se rimossa dal file corrente.
