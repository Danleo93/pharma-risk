# Checklist manuale export FMEA, RCA e Gap

Questa verifica completa i test automatici con un controllo reale di apertura e impaginazione. Usare esclusivamente dataset sintetici.

## Dataset di prova

Per ogni modulo predisporre almeno:

- titolo e descrizioni con accenti italiani e caratteri Unicode;
- una descrizione lunga, superiore a 500 caratteri;
- almeno tre elementi e due azioni correttive;
- valori mancanti o `N/D` dove ammessi;
- testo che inizi con `=`, `+`, `-` e `@` per verificare la neutralizzazione delle formule;
- date, percentuali e stati differenti.

## PDF

Ripetere per FMEA, RCA e Gap:

- [ ] Il file viene scaricato e aperto senza errori.
- [ ] Titolo, data e identificazione del modulo sono corretti.
- [ ] Tutte le sezioni previste sono presenti e nell'ordine atteso.
- [ ] Tabelle e testi non escono dai margini e non si sovrappongono.
- [ ] Le descrizioni lunghe vanno a capo e proseguono su pagina successiva.
- [ ] Accenti e Unicode sono leggibili.
- [ ] Grafici e immagini previsti sono presenti e non vuoti.
- [ ] Header, footer e numeri pagina sono coerenti, se previsti.
- [ ] Non compaiono script, link inattesi o contenuto attivo.

## XLSX

Ripetere per FMEA, RCA e Gap in Microsoft Excel; usare LibreOffice solo se gia disponibile:

- [ ] Il workbook viene aperto senza richiesta di riparazione.
- [ ] I fogli previsti sono presenti, nominati correttamente e non duplicati.
- [ ] Intestazioni, larghezze e righe sono leggibili.
- [ ] Date, percentuali e numeri mantengono il significato atteso.
- [ ] Accenti e Unicode sono leggibili.
- [ ] Le stringhe lunghe non corrompono celle o fogli.
- [ ] I valori che iniziano con `=`, `+`, `-` o `@` sono visualizzati come testo e non eseguiti come formule.
- [ ] Non vengono mostrate richieste di collegamenti esterni, macro o contenuto attivo.

## Registrazione esito

Annotare per ogni file: modulo, formato, data, versione applicazione/commit, software usato per l'apertura, esito PASS/FAIL, screenshot o descrizione dell'anomalia. La checklist resta manuale: i test automatici verificano struttura e sicurezza di base, non la resa visiva completa nel programma dell'utente.
