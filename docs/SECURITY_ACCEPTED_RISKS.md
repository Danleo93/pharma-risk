# Rischi di sicurezza accettati

Data valutazione: 25 agosto 2026  
Ambito: Milestone 2B.3, dipendenze residue.

## AR-001 - `@babel/core` build-only

| Campo | Valutazione |
| --- | --- |
| Package | `@babel/core@7.28.5` |
| Advisory | GHSA-4x5r-pxfx-6jf8 - lettura file tramite commento `sourceMappingURL` |
| Severity nominale | LOW |
| Reachability | `BUILD_ONLY` |
| Motivo | Babel e usato dalla toolchain React durante sviluppo/build. Non e incluso come servizio eseguibile nell'app statica distribuita. Lo scenario richiede input sorgente o sourcemap locale controllato dall'attaccante e condizioni specifiche nel processo di build. Il repository non elabora sorgenti caricati dagli utenti. |
| Misure compensative | Build eseguita da sorgenti versionati e revisionati; Vite limitato a localhost; nessun upload di codice; dipendenze bloccate nel lockfile; security suite e build eseguite dopo ogni remediation. |
| Motivo mancata remediation | Il fix proposto comporta un cambio piu ampio della toolchain Babel/plugin React non proporzionato a un rischio LOW non raggiungibile nel runtime. |
| Decisione | Accettazione temporanea e monitoraggio. |
| Data | 25 agosto 2026 |

Rivalutare se:

1. viene adottata una nuova major di `@vitejs/plugin-react` o Babel;
2. la build elabora sorgenti, plugin o sourcemap forniti da utenti;
3. il processo di build viene esposto come servizio remoto;
4. cambia la severity o viene pubblicato un fix compatibile nella stessa toolchain;
5. viene effettuata la revisione dipendenze precedente a un rilascio istituzionale.
