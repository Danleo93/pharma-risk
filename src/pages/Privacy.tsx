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
          <li><strong>Dati di profilo e impostazioni:</strong> eventuale struttura di appartenenza indicata dall'utente e preferenze applicative.</li>
          <li><strong>Dati di utilizzo applicativo:</strong> assessment creati, rischi identificati, cause, requisiti, norme, gap, report e azioni correttive.</li>
          <li><strong>Dati documentali generati dall'utente:</strong> testi, note, descrizioni, campi liberi, allegati logici e contenuti esportabili prodotti durante l'utilizzo.</li>
          <li><strong>Dati tecnici:</strong> cookie tecnici necessari per autenticazione e funzionamento del servizio.</li>
        </ul>
        <p className="mt-2">
          L'applicazione non richiede e non e progettata per raccogliere dati identificativi di pazienti,
          operatori o altre persone fisiche all'interno degli assessment.
        </p>
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
          <li>Erogare uno strumento formativo, metodologico e documentale di supporto al risk management.</li>
          <li>Salvare e recuperare assessment FMEA, RCA e Gap Analysis.</li>
          <li>Gestire rischi, cause, requisiti, norme, gap, azioni correttive, dashboard ed export documentali.</li>
          <li>Consentire all'utente di esportare i propri dati e i report generati dall'applicazione.</li>
        </ul>
        <p className="mt-2">
          I dati <strong>non vengono</strong> venduti, condivisi con terze parti per finalita commerciali,
          ne utilizzati per profilazione o marketing.
        </p>
      </>
    ),
  },
  {
    title: '4. Perimetro di utilizzo dei dati',
    content: (
      <>
        <p>
          PhaRMA T e progettata per essere utilizzata con dati simulati, anonimizzati, aggregati o comunque
          non identificativi. L'utente non deve inserire nomi, iniziali, codici paziente, date di nascita,
          numeri di cartella clinica, recapiti, immagini o altri elementi che possano rendere identificabile
          una persona fisica.
        </p>
        <p className="mt-2">
          L'applicazione non e destinata a raccogliere dati sanitari identificativi, ne a supportare decisioni
          cliniche dirette. Eventuali informazioni inserite devono essere coerenti con questa finalita limitata.
        </p>
        <p className="mt-2">
          I dati anonimizzati correttamente non consentono piu l'identificazione della persona interessata.
          I dati pseudonimizzati, invece, possono restare dati personali se l'identificazione e ancora possibile
          tramite informazioni aggiuntive. Per questo motivo l'utente deve privilegiare dati fittizi, aggregati
          o anonimizzati in modo irreversibile.
        </p>
      </>
    ),
  },
  {
    title: '5. Base Giuridica',
    content: (
      <>
        <p>
          Il trattamento dei dati e basato sulla necessita di erogare il servizio richiesto dall'utente,
          sul consenso espresso al momento della registrazione ove applicabile e sul legittimo interesse
          alla sicurezza, manutenzione e corretto funzionamento dell'applicazione, ai sensi dell'art. 6 GDPR.
        </p>
        <p className="mt-2">
          PhaRMA T non richiede l'inserimento di categorie particolari di dati personali ai sensi dell'art. 9 GDPR.
          L'utente e invitato a non inserire dati sanitari identificativi o informazioni riferibili a persone fisiche.
        </p>
      </>
    ),
  },
  {
    title: '6. Conservazione dei Dati',
    content: (
      <>
        <p>
          I dati sono conservati per tutta la durata dell'utilizzo del servizio e fino a richiesta di cancellazione
          da parte dell'utente, salvo obblighi di conservazione applicabili o necessita tecniche di backup e sicurezza.
        </p>
        <p className="mt-2">
          In caso di cancellazione dell'account o richiesta di eliminazione dei dati, i dati applicativi associati
          verranno eliminati o resi non piu accessibili entro un termine ragionevole, indicativamente entro 30 giorni,
          salvo impedimenti tecnici, obblighi legali o conservazioni temporanee nei backup.
        </p>
        <p className="mt-2">
          La richiesta di cancellazione viene gestita come procedura verificata: l'utente deve indicare l'email
          dell'account, confermare la volonta di cancellazione definitiva e puo ricevere conferma di presa in carico
          ed esito dell'operazione all'indirizzo registrato.
        </p>
      </>
    ),
  },
  {
    title: '7. Dove sono i Dati',
    content: (
      <>
        <p>
          I dati applicativi sono gestiti tramite Supabase, utilizzato per autenticazione, database e servizi
          collegati al funzionamento dell'applicazione. L'applicazione web puo essere distribuita tramite Vercel
          o infrastrutture equivalenti dedicate al deployment della single page application.
        </p>
        <p className="mt-2">
          Supabase e Vercel operano come fornitori tecnici o responsabili del trattamento nei limiti dei servizi
          erogati. Eventuali trattamenti, localizzazioni dei dati e trasferimenti sono regolati dalle rispettive
          condizioni contrattuali, misure di sicurezza e Data Processing Addendum.
        </p>
      </>
    ),
  },
  {
    title: '8. I Tuoi Diritti',
    content: (
      <>
        <p>Ai sensi del GDPR, hai diritto di:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li><strong>Accesso:</strong> ottenere conferma dei dati trattati.</li>
          <li><strong>Rettifica:</strong> correggere dati inesatti.</li>
          <li><strong>Cancellazione:</strong> richiedere l'eliminazione dei dati.</li>
          <li><strong>Portabilita:</strong> ricevere i dati in formato strutturato.</li>
          <li><strong>Limitazione:</strong> chiedere la limitazione del trattamento nei casi previsti.</li>
          <li><strong>Opposizione:</strong> opporti al trattamento nei casi previsti.</li>
        </ul>
        <p className="mt-2">
          Le richieste possono essere inviate al Titolare tramite l'indirizzo di contatto indicato nell'applicazione.
          L'utente puo inoltre utilizzare le funzioni di esportazione dati disponibili nelle impostazioni, ove presenti.
        </p>
        <p className="mt-2">
          Prima di richiedere la cancellazione, l'utente e invitato a esportare eventuali dati che intende conservare.
          La cancellazione dell'account e dei dati applicativi e pensata come operazione definitiva, salvo copie
          temporanee presenti nei backup tecnici dei fornitori.
        </p>
      </>
    ),
  },
  {
    title: '9. Sicurezza',
    content: (
      <p>
        PhaRMA T utilizza autenticazione, separazione dei dati per utente e regole di accesso coerenti con il
        principio di minimizzazione. L'utente resta responsabile della custodia delle credenziali e della scelta
        di contenuti coerenti con l'uso previsto dell'applicazione.
      </p>
    ),
  },
  {
    title: '10. Cookie',
    content: (
      <p>
        L'applicazione utilizza esclusivamente cookie tecnici necessari per autenticazione e corretto funzionamento
        del servizio. Non vengono utilizzati cookie di profilazione pubblicitaria.
      </p>
    ),
  },
  {
    title: '11. Contatti',
    content: (
      <p>
        Per richieste relative a privacy, esercizio dei diritti, esportazione o cancellazione dei dati, puoi
        contattare il Titolare all'indirizzo email indicato nella sezione Contatti dell'applicazione.
      </p>
    ),
  },
  {
    title: '12. Modifiche alla Privacy Policy',
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
