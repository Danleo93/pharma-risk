# Governance privacy degli export

## Formati

| Formato | Moduli | Generazione | Protezioni verificate | Limite dopo download |
| --- | --- | --- | --- | --- |
| PDF | FMEA, RCA, Gap | Client-side | Warning privacy, filename/metadata neutri, test PDF | Nessuna RLS sul file |
| XLSX | FMEA, RCA, Gap | Client-side | Formula injection neutralizzata, isolamento dati, filename neutri | Nessuna RLS sul file; foglio modificabile |
| PNG | Grafici e diagrammi | Rasterizzazione DOM client-side | Warning/nome neutro; verifica visuale ancora manuale | Immagine copiabile e condivisibile |
| JSON GDPR | Dati utente | Client-side dopo letture autorizzate | Isolamento utente e serializzazione testati | Contiene dataset esteso in chiaro sul dispositivo |

## Principio operativo

**Dopo il download il file non è più protetto dalle RLS, dalla sessione Supabase o dagli stati runtime dei moduli.** Custodia, cifratura del dispositivo, destinatari, canale di invio e cancellazione delle copie dipendono dall'utente e dalle regole organizzative approvate.

## Checklist finale con dataset sintetico realistico

1. Accedere come USER_A e verificare assenza di record USER_B.
2. Usare titoli neutri, Unicode, stringhe lunghe e prefissi Excel `=`, `+`, `-`, `@`.
3. Generare ogni formato disponibile per FMEA, RCA e Gap.
4. Verificare warning, filename e proprietà documento.
5. Aprire XLSX in Excel/LibreOffice e confermare assenza di formule attive.
6. Aprire PDF multipagina e verificare layout, grafici e assenza di payload attivi.
7. Controllare PNG per area catturata, leggibilità e contenuti fuori frame.
8. Aprire JSON in editor testuale e confermare completezza/assenza dati USER_B.
9. Eliminare i file sintetici dal dispositivo di test.
10. Registrare data, browser, sistema operativo, versione app e risultato.

## Decisioni SIFO/DPO

- classificazione e avvertenze dei file;
- canali di condivisione ammessi;
- retention delle copie locali;
- uso di cifratura/password per specifici scenari;
- responsabilità del destinatario;
- gestione di invio errato o perdita del dispositivo.

