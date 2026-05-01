import { ArrowLeft, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

const sections = [
  {
    title: '1. Titolare del Trattamento',
    content: (
      <>
        <p>Il Titolare del trattamento dei dati personali e il <strong>Dott. Daniele Leonardi Vinci</strong>.</p>
        <p className="mt-2">
          Per qualsiasi richiesta relativa ai tuoi dati personali, puoi contattare il Titolare tramite
          l'indirizzo email indicato nell'applicazione.
        </p>
      </>
    ),
  },
  {
    title: '2. Dati Raccolti',
    content: (
      <>
        <p>L'applicazione PhaRMA T raccoglie i seguenti dati:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Dati di registrazione:</strong> indirizzo email e password criptata.</li>
          <li><strong>Dati di utilizzo:</strong> assessment creati, rischi identificati, cause e azioni correttive.</li>
          <li><strong>Dati tecnici:</strong> cookie tecnici necessari per autenticazione e funzionamento del servizio.</li>
        </ul>
      </>
    ),
  },
  {
    title: '3. Finalita del Trattamento',
    content: (
      <>
        <p>I dati sono trattati esclusivamente per:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Permettere registrazione e accesso all'applicazione.</li>
          <li>Erogare il servizio di gestione del rischio farmaceutico e clinico.</li>
          <li>Salvare e recuperare assessment, rischi, cause, report e azioni correttive.</li>
        </ul>
        <p className="mt-2">
          I dati <strong>non vengono</strong> venduti, condivisi con terze parti per finalita commerciali,
          ne utilizzati per profilazione o marketing.
        </p>
      </>
    ),
  },
  {
    title: '4. Base Giuridica',
    content: (
      <p>
        Il trattamento dei dati e basato sul consenso espresso al momento della registrazione e sulla
        necessita contrattuale per l'erogazione del servizio, ai sensi dell'art. 6 GDPR.
      </p>
    ),
  },
  {
    title: '5. Conservazione dei Dati',
    content: (
      <p>
        I dati sono conservati per tutta la durata dell'utilizzo del servizio. In caso di cancellazione
        dell'account, i dati associati verranno eliminati entro 30 giorni, salvo obblighi di conservazione applicabili.
      </p>
    ),
  },
  {
    title: '6. Dove sono i Dati',
    content: (
      <p>
        I dati sono memorizzati su server Supabase situati nell'Unione Europea, in conformita con il GDPR.
        L'applicazione puo essere ospitata su infrastrutture cloud dedicate al deployment web.
      </p>
    ),
  },
  {
    title: '7. I Tuoi Diritti',
    content: (
      <>
        <p>Ai sensi del GDPR, hai diritto di:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Accesso:</strong> ottenere conferma dei dati trattati.</li>
          <li><strong>Rettifica:</strong> correggere dati inesatti.</li>
          <li><strong>Cancellazione:</strong> richiedere l'eliminazione dei dati.</li>
          <li><strong>Portabilita:</strong> ricevere i dati in formato strutturato.</li>
          <li><strong>Opposizione:</strong> opporti al trattamento nei casi previsti.</li>
        </ul>
      </>
    ),
  },
  {
    title: '8. Cookie',
    content: (
      <p>
        L'applicazione utilizza esclusivamente cookie tecnici necessari per autenticazione e corretto funzionamento
        del servizio. Non vengono utilizzati cookie di profilazione pubblicitaria.
      </p>
    ),
  },
  {
    title: '9. Modifiche alla Privacy Policy',
    content: (
      <p>
        Il Titolare si riserva il diritto di modificare questa Privacy Policy. Eventuali modifiche saranno
        comunicate tramite l'applicazione o rese disponibili in questa pagina.
      </p>
    ),
  },
]

export default function Privacy() {
  const navigate = useNavigate()

  return (
    <div className="clinical-page max-w-4xl">
      <PageHeader
        title="Privacy Policy"
        description="Ultimo aggiornamento: Dicembre 2025"
        icon={<ShieldCheck className="h-5 w-5" />}
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
