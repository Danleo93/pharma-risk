# Test privacy

## Esecuzione

Con Supabase locale avviato e ricostruito:

```powershell
npm.cmd run privacy:test
```

La suite rifiuta endpoint remoti tramite il guardrail comune e usa solo USER_A/USER_B sintetici.

## Copertura automatica

- email positiva e falso positivo;
- codice fiscale formalmente plausibile e controllo errato;
- telefoni italiani mobile/fisso e numeri tecnici negativi;
- Unicode NFKC e copia/incolla;
- esclusione di data e ora;
- assenza del valore grezzo nei finding;
- filename neutri;
- provider pre-save e warning export;
- metadati neutri;
- assenza di assessment in browser storage esplicito;
- assenza di tracker/telemetria inattesi;
- controllo statico dei logging point;
- isolamento USER_A/USER_B;
- disponibilità tecnica dei dati propri per GDPR export con moduli `read_only` e `disabled`.

I risultati macchina sono salvati in `.security-results/privacy.json`.

## Verifiche manuali richieste

1. Inserire una email sintetica in una descrizione FMEA/RCA/Gap: deve comparire il modal senza mostrare il valore.
2. Selezionare **Torna a modificare**: la richiesta non deve raggiungere Supabase.
3. Ripetere e confermare falso positivo: il salvataggio deve proseguire.
4. Verificare che data e ora RCA non producano warning.
5. Esportare PDF, Excel, PNG e JSON: il warning deve comparire una volta nella sessione browser.
6. Controllare filename e proprietà documento.
7. Provare un modulo `read_only` e `disabled`: la privacy scan non deve aggirare il blocco di scrittura.

## Limite del test

La suite verifica pattern e integrazione, non certifica anonimizzazione, conformità giuridica o assenza di identificabilità indiretta.

## Esito validazione Milestone 4A

- `supabase db reset`: PASS su database esclusivamente locale.
- `privacy:test`: 18 PASS, 0 FAIL.
- `security:test`: 14 suite senza failure; RLS 30/30, cross-parent 22/22 con 0 relazioni consentite, smoke 6/6, module state 22/22, PDF 4/4 ed Excel 11/11.
- `build`: PASS.
- controllo browser locale: notice presente nei form FMEA, RCA e Gap; modal pre-salvataggio visibile; valore rilevato non ripetuto; annullamento senza scrittura.
- `lint`: baseline nota di 46 errori e 1 warning, senza nuovi finding attribuibili alla Milestone 4A.

Restano manuali la verifica visuale completa dei PNG, l'IDOR via browser autenticato e il comportamento UI con Auth locale intenzionalmente arrestato. Le barriere dati corrispondenti sono comunque coperte dai test API/RLS locali.
