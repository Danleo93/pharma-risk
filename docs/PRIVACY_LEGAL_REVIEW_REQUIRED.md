# Punti che richiedono revisione SIFO/DPO

Questo documento separa le evidenze tecniche dalle decisioni legali e organizzative. Non costituisce parere legale.

## Affermazioni tecnicamente supportate

- L'app tratta email, UUID, sessione e metadati tecnici necessari all'account.
- I contenuti assessment non sono destinati a dati personali e devono essere anonimizzati prima dell'inserimento.
- Esistono RLS user-owned e test di isolamento locale.
- Non risultano analytics o tracker nel repository.
- I contenuti sono inviati a Supabase; Vercel distribuisce la SPA e i relativi asset.
- Gli export sono generati lato browser e salvati sul dispositivo.

## Affermazioni da approvare o correggere

- identità e contatti del titolare/responsabili;
- basi giuridiche e finalità dettagliate;
- ruoli tra SIFO, autore/gestore e strutture utilizzatrici;
- qualificazione di Supabase e Vercel e DPA applicabili;
- localizzazione, subfornitori e garanzie per eventuali trasferimenti;
- termini di conservazione e cancellazione, incluso il riferimento attuale a 30 giorni in `Privacy.tsx` e `Settings.tsx`;
- necessità e perimetro di DPIA;
- disciplina di nominativi professionali quando metodologicamente necessari;
- gestione di backup, log Auth, IP/device metadata e richieste degli interessati;
- necessità di cookie banner sulla base della configurazione effettiva dei provider;
- formulazioni definitive di Informativa e Termini.

## Formulazione tecnica raccomandata

“L'app tratta i dati necessari alla gestione degli account e del servizio. I contenuti degli assessment non sono destinati a contenere dati personali e devono essere previamente anonimizzati.”

Non utilizzare formulazioni assolute quali “l'app non tratta dati personali” o “il controllo garantisce l'anonimizzazione”.

