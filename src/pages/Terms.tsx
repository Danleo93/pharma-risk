import { ArrowLeft, FileText } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

const sections = [
  {
    title: '1. Accettazione dei Termini',
    content: (
      <p>
        Utilizzando PhaRMA T (Pharmacy Risk Management Assessment Tool), accetti integralmente i presenti
        Termini di Servizio. Se non accetti questi termini, ti invitiamo a non utilizzare l'applicazione.
      </p>
    ),
  },
  {
    title: '2. Descrizione del Servizio',
    content: (
      <>
        <p>
          PhaRMA T e una web app a finalita formative, metodologiche e di supporto documentale
          per l'applicazione di strumenti di gestione del rischio in ambito farmaceutico e sanitario.
          L'applicazione supporta analisi proattive FMEA, analisi reattive RCA e Gap Analysis.
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Creare e gestire assessment di rischio.</li>
          <li>Identificare e valutare rischi, cause, Root Cause, requisiti e gap di conformita.</li>
          <li>Pianificare e monitorare azioni correttive.</li>
          <li>Esportare report in formato PDF, Excel e immagini dove previsto.</li>
        </ul>
      </>
    ),
  },
  {
    title: '3. Natura e limiti d uso',
    content: (
      <>
        <p>
          PhaRMA T non e un dispositivo medico, non formula diagnosi, non prescrive interventi terapeutici
          e non deve essere utilizzata come strumento decisionale clinico diretto.
        </p>
        <p className="mt-2">
          Gli output generati hanno valore di supporto metodologico, formativo e documentale. Devono essere
          interpretati criticamente da professionisti qualificati, nel rispetto delle procedure aziendali,
          delle responsabilita professionali e della normativa applicabile.
        </p>
      </>
    ),
  },
  {
    title: '4. Uso Consentito',
    content: (
      <>
        <p>L'applicazione e destinata a:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Professionisti del settore farmaceutico e sanitario.</li>
          <li>Attivita di formazione, ricerca, audit e miglioramento continuo.</li>
          <li>Uso interno presso strutture sanitarie.</li>
        </ul>
        <p className="mt-2">
          L'applicazione deve essere utilizzata con dati simulati, anonimizzati, aggregati o comunque non
          identificativi. E vietato utilizzare l'applicazione per scopi illegali o non autorizzati.
        </p>
        <p className="mt-2">
          Non devono essere inseriti nomi, iniziali, codici paziente, numeri di cartella clinica, date di nascita,
          recapiti, immagini o altri riferimenti che possano identificare pazienti, operatori o altre persone fisiche.
        </p>
      </>
    ),
  },
  {
    title: '5. Account Utente',
    content: (
      <p>
        Per utilizzare l'applicazione e necessario creare un account. Sei responsabile della riservatezza
        delle credenziali di accesso e delle attivita svolte tramite il tuo account.
      </p>
    ),
  },
  {
    title: '6. Proprieta Intellettuale',
    content: (
      <>
        <p>
          L'applicazione PhaRMA T, inclusi codice sorgente, design, loghi, testi e contenuti, sono di proprieta
          del <strong>Dott. Daniele Leonardi Vinci</strong> e sono protetti dalle leggi sul diritto d'autore.
        </p>
        <p className="mt-2">
          E vietato copiare, modificare, distribuire, vendere o creare opere derivate senza autorizzazione scritta.
        </p>
      </>
    ),
  },
  {
    title: '7. Limitazione di Responsabilita',
    content: (
      <>
        <p>
          L'applicazione e fornita "cosi com'e" senza garanzie di alcun tipo. Il Titolare non garantisce che
          il servizio sia privo di errori o interruzioni.
        </p>
        <p className="mt-2">
          <strong>Importante:</strong> PhaRMA T e uno strumento di supporto alla gestione del rischio.
          Le decisioni finali rimangono di responsabilita dell'utente e dei professionisti competenti.
          L'applicazione non sostituisce il giudizio professionale, le procedure aziendali vigenti, il
          parere degli organismi competenti ne eventuali valutazioni clinico-organizzative formali.
        </p>
        <p className="mt-2">
          Report, grafici, punteggi e output esportati devono essere utilizzati con cautela come supporto
          documentale e metodologico. Non costituiscono raccomandazioni cliniche automatiche.
        </p>
      </>
    ),
  },
  {
    title: '8. Disponibilita del Servizio',
    content: (
      <p>
        Il Titolare si impegna a mantenere l'applicazione disponibile, ma non garantisce un servizio ininterrotto.
        Potranno verificarsi interruzioni per manutenzione, aggiornamenti o cause di forza maggiore.
      </p>
    ),
  },
  {
    title: '9. Modifiche ai Termini',
    content: (
      <p>
        Il Titolare si riserva il diritto di modificare i presenti Termini. Le modifiche saranno effettive
        dalla pubblicazione nell'applicazione.
      </p>
    ),
  },
  {
    title: '10. Legge Applicabile',
    content: (
      <p>
        I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia sara competente il foro applicabile
        secondo la normativa vigente.
      </p>
    ),
  },
  {
    title: '11. Contatti',
    content: (
      <p>
        Per domande o chiarimenti sui presenti Termini di Servizio, contatta il Titolare all'indirizzo
        daniele.leo93@gmail.com.
      </p>
    ),
  },
]

export default function Terms() {
  const navigate = useNavigate()

  return (
    <div className="clinical-page max-w-4xl">
      <PageHeader
        title="Termini di Servizio"
        description="Ultimo aggiornamento: Dicembre 2025"
        icon={<FileText className="h-5 w-5" />}
        backAction={(
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="h-4 w-4" />
            Indietro
          </button>
        )}
      />

      <Card elevated>
        <CardContent className="space-y-7 p-6 md:p-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="mb-3 text-xl font-semibold text-slate-900">{section.title}</h2>
              <div className="leading-7 text-slate-600">{section.content}</div>
            </section>
          ))}
        </CardContent>
      </Card>

      <p className="mt-8 text-center text-sm text-slate-500">
        Copyright 2025 Dott. Daniele Leonardi Vinci. Tutti i diritti riservati.
      </p>
    </div>
  )
}
