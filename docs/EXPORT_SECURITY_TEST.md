# Export security test

Data: 25 agosto 2026  
Formati: PDF, Excel, JSON e PNG.

## Risultati

| Controllo | Esito | Nota |
| --- | --- | --- |
| Excel: stringhe con `=`, `+`, `-`, `@` | PASS | Le celle generate dal percorso testato restano testo, non formule XLSX |
| PDF: payload HTML/JavaScript | PASS | PDF valido e nessuna action `/JavaScript` rilevata nel percorso testato |
| JSON GDPR: round-trip | PASS | HTML, Unicode, emoji e testo lungo preservati come dati JSON |
| Isolamento dati prima dell'export | PASS | USER_A non legge assessment USER_B in FMEA/RCA/Gap |
| Filename servizi principali | PASS/WARNING | I servizi PDF/Excel/GDPR normalizzano i nomi; `exportImage.ts` richiede revisione manuale |
| PNG | WARNING | La rasterizzazione DOM deve essere controllata visivamente con payload sintetici |

## Formula injection

Aggiornamento Milestone 2B.2b: tutti gli export Excel FMEA, RCA e Gap usano ora `src/lib/spreadsheetSecurity.ts`. Il regression test dedicato genera e riapre i workbook dei tre moduli, verifica i prefissi `=`, `+`, `-`, `@`, Unicode, stringhe lunghe e isolamento USER_A/USER_B. Esito: 11/11 PASS. Vedere [review SheetJS](./XLSX_SECURITY_REVIEW.md).

Sono state provate celle che iniziano con:

```text
=1+1
+SUM(1,1)
-1+2
@SUM(1,1)
```

Nel workbook XLSX generato e riletto le celle non risultano di tipo formula. Il test copre la serializzazione SheetJS usata dall'app, ma non sostituisce la verifica di ogni foglio applicativo e non copre CSV, formato non generato dai servizi correnti.

## PDF

Il test automatico verifica:

- firma `%PDF-` valida;
- testo ostile trattato come contenuto;
- assenza di action JavaScript nel file prodotto dal percorso semplice.

Limite importante: l'inventario dipendenze segnala jsPDF come critico. Il PASS del payload semplice non rende sicure tutte le API del pacchetto. Restano da testare dopo l'upgrade: immagini, AcroForm, metadata, HTML, tabelle e documenti multipagina.

## JSON GDPR

Il contenuto viene serializzato come `application/json`. Il file puo includere tutti i dati dell'utente e deve essere trattato come documento riservato dall'utente che lo scarica. Il test conferma integrita sintattica, non cifratura a riposo dopo il download.

## PNG

Gli export PNG derivano dalla rasterizzazione del DOM React. Non sono state rilevate API sorgente come `dangerouslySetInnerHTML`, `innerHTML=`, `document.write`, `eval` o `new Function`. Restano necessari:

1. controllo visuale con Unicode e stringhe lunghe;
2. controllo filename con caratteri speciali;
3. conferma che nessun contenuto fuori area venga catturato;
4. verifica su Chrome/Edge e viewport laptop.

## Test manuale consigliato

Per ciascun modulo:

1. usare esclusivamente un assessment sintetico;
2. inserire apostrofi, virgolette, Unicode e stringhe che iniziano con caratteri formula;
3. esportare PDF/Excel e, dove disponibile, PNG;
4. aprire i file con un visualizzatore standard;
5. verificare che Excel non proponga formule o collegamenti esterni;
6. verificare layout, filename, paginazione e assenza di contenuti di altri utenti.
