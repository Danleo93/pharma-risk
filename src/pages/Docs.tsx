import { useMemo, useState, type ReactNode } from 'react'
import {
  AlertTriangle,
  BarChart3,
  BookMarked,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  ClipboardList,
  ClipboardPlus,
  Download,
  FileText,
  HelpCircle,
  Info,
  Lightbulb,
  Network,
  PieChart,
  Rocket,
  Search,
  ShieldCheck,
  Target,
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/Card'
import { PageHeader } from '../components/ui/PageHeader'

type GuideModuleId = 'general' | 'fmea' | 'rca' | 'gap'
type BoxVariant = 'info' | 'tip' | 'warning'

interface GuideSection {
  id: string
  title: string
  moduleId: GuideModuleId
  icon: ReactNode
  content: ReactNode
}

interface GuideModule {
  id: GuideModuleId
  title: string
  subtitle: string
  color: 'sky' | 'amber' | 'teal' | 'slate'
  sections: GuideSection[]
}

interface FaqItem {
  id: string
  q: string
  a: ReactNode
}

const boxStyles: Record<BoxVariant, { wrapper: string; icon: string; title: string; Icon: typeof Info }> = {
  info: {
    wrapper: 'bg-sky-50 border-sky-200',
    icon: 'text-sky-600',
    title: 'text-sky-900',
    Icon: Info,
  },
  tip: {
    wrapper: 'bg-amber-50 border-amber-200',
    icon: 'text-amber-600',
    title: 'text-amber-900',
    Icon: Lightbulb,
  },
  warning: {
    wrapper: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    Icon: AlertTriangle,
  },
}

function InfoBox({
  title,
  children,
  variant = 'info',
}: {
  title: string
  children: ReactNode
  variant?: BoxVariant
}) {
  const styles = boxStyles[variant]
  const Icon = styles.Icon

  return (
    <div className={`rounded-lg border p-4 ${styles.wrapper}`}>
      <div className="flex gap-3">
        <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />
        <div>
          <h4 className={`font-semibold ${styles.title}`}>{title}</h4>
          <div className="text-sm text-gray-700 mt-1 leading-relaxed">{children}</div>
        </div>
      </div>
    </div>
  )
}

function BulletList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2 text-gray-700">
      {items.map((item, index) => (
        <li key={index} className="flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

function NumberedSteps({ steps }: { steps: { title: string; description: ReactNode }[] }) {
  return (
    <ol className="space-y-4 text-gray-700">
      {steps.map((step, index) => (
        <li key={step.title} className="flex gap-3">
          <span className="flex-shrink-0 w-8 h-8 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-semibold text-sm">
            {index + 1}
          </span>
          <div>
            <strong>{step.title}</strong>
            <div className="text-sm text-gray-600 mt-1">{step.description}</div>
          </div>
        </li>
      ))}
    </ol>
  )
}

function Badge({ children, color = 'sky' }: { children: ReactNode; color?: 'sky' | 'amber' | 'green' | 'red' | 'slate' }) {
  const classes = {
    sky: 'bg-sky-100 text-sky-700 border-sky-200',
    amber: 'bg-amber-100 text-amber-800 border-amber-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
  }[color]

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${classes}`}>{children}</span>
}

function MiniTable({
  columns,
  rows,
}: {
  columns: string[]
  rows: ReactNode[][]
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200">
      <div className="grid bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
        {columns.map((column) => (
          <div key={column} className="px-4 py-2 border-r last:border-r-0 border-gray-200">
            {column}
          </div>
        ))}
      </div>
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid border-t border-gray-100 text-sm text-gray-700" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {row.map((cell, cellIndex) => (
            <div key={cellIndex} className="px-4 py-2 border-r last:border-r-0 border-gray-100">
              {cell}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

const fmeaFaqs: FaqItem[] = [
  {
    id: 'fmea-faq-1',
    q: 'Posso modificare un rischio dopo averlo valutato?',
    a: 'Si, puoi modificare i punteggi S, P e D di un rischio. Il RPN e la classe di rischio vengono ricalcolati automaticamente.',
  },
  {
    id: 'fmea-faq-2',
    q: "Come elimino un rischio dall'assessment?",
    a: 'Apri il dettaglio del rischio e usa il comando di eliminazione. L operazione rimuove il rischio dall assessment corrente.',
  },
  {
    id: 'fmea-faq-3',
    q: 'Posso creare piu assessment?',
    a: 'Si, ogni assessment e indipendente e puo coprire aree, periodi o processi differenti.',
  },
  {
    id: 'fmea-faq-4',
    q: 'I miei dati sono al sicuro?',
    a: 'I dati sono protetti da autenticazione e ogni utente visualizza solo le informazioni associate al proprio account.',
  },
  {
    id: 'fmea-faq-5',
    q: 'Posso usare PhaRMA T su tablet o smartphone?',
    a: 'Si, l interfaccia e responsive. Per valutazioni estese e reportistica l esperienza migliore resta su desktop.',
  },
]

const rcaFaqs: FaqItem[] = [
  {
    id: 'rca-faq-1',
    q: 'Posso modificare una causa dopo averla inserita?',
    a: 'Si, finche l assessment non viene archiviato e possibile rivedere le cause inserite e aggiornare il percorso di analisi. Le modifiche devono comunque rispettare la tracciabilita metodologica del caso.',
  },
  {
    id: 'rca-faq-2',
    q: 'E obbligatorio completare una 5 Whys per ogni causa?',
    a: 'No, non e obbligatorio per tutte le cause. E pero fortemente raccomandato per le cause candidate piu rilevanti, soprattutto quando l esito deve supportare audit, decisioni clinico-organizzative o piani di miglioramento.',
  },
  {
    id: 'rca-faq-3',
    q: 'Posso modificare lo stato di una Root Cause?',
    a: 'Si. L esito metodologico puo essere aggiornato in qualsiasi momento: una causa puo rimanere candidata, essere confermata come Root Cause o essere marcata come non confermata. E consigliabile inserire una nota quando si cambia esito.',
  },
  {
    id: 'rca-faq-4',
    q: 'Le azioni correttive possono essere modificate?',
    a: 'Si. E possibile aggiornare descrizione, responsabile, data di scadenza, priorita e stato di avanzamento. Le azioni devono restare coerenti con la causa a cui sono collegate.',
  },
  {
    id: 'rca-faq-5',
    q: 'Posso creare azioni anche da una causa non ancora confermata?',
    a: 'Si. Le azioni possono essere collegate a cause candidate o a Root Cause confermate. Hanno maggiore valore metodologico quando sono collegate a cause confermate, ma in alcuni casi puo essere utile pianificare interventi anche prima della chiusura completa dell analisi.',
  },
]

const gapFaqs: FaqItem[] = [
  {
    id: 'gap-faq-1',
    q: 'Qual e la differenza tra libreria e assessment Gap?',
    a: 'La libreria contiene macro-processi, Domini/Sezioni, Attivita/Requisiti, target attesi e norme riutilizzabili. L assessment contiene invece la valutazione specifica: stato attuale, gap, conformita, priorita, note e azioni correttive.',
  },
  {
    id: 'gap-faq-2',
    q: 'Posso aggiungere un requisito durante un assessment?',
    a: 'Si. Dal dettaglio assessment puoi aggiungere un Dominio/Sezione o una Attivita/Requisito. Puoi decidere se salvarli nella libreria personale oppure mantenerli solo nello specifico assessment.',
  },
  {
    id: 'gap-faq-3',
    q: 'Quando una valutazione diventa una criticita?',
    a: 'Una valutazione viene considerata criticita quando lo stato di conformita e non conforme o parzialmente conforme. Il testo libero del gap aiuta a descrivere lo scostamento, ma non determina da solo la criticita.',
  },
  {
    id: 'gap-faq-4',
    q: 'Posso collegare norme cogenti a un requisito?',
    a: 'Si. Le norme possono essere collegate all Attivita/Requisito, possono essere marcate come cogenti e possono avere un ambito di applicazione. Nell assessment le norme cogenti sono evidenziate per facilitare la lettura.',
  },
  {
    id: 'gap-faq-5',
    q: 'Come si verifica l efficacia di un azione correttiva?',
    a: 'Dopo il completamento dell azione, puoi registrare metodo di verifica, esito, note e verificatore. Gli esiti previsti sono efficace, parzialmente efficace o inefficace.',
  },
]

export default function Docs() {
  const [activeSection, setActiveSection] = useState('intro')
  const [expandedModules, setExpandedModules] = useState<Record<GuideModuleId, boolean>>({
    general: true,
    fmea: true,
    rca: true,
    gap: true,
  })
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const faqList = (items: FaqItem[]) => (
    <div className="space-y-3">
      {items.map((faq) => (
        <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
          >
            <span className="font-medium text-gray-800">{faq.q}</span>
            {expandedFaq === faq.id ? (
              <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
            )}
          </button>
          {expandedFaq === faq.id && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
              <div className="text-gray-700 leading-relaxed">{faq.a}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )

  const modules = useMemo<GuideModule[]>(() => {
    const generalSections: GuideSection[] = [
      {
        id: 'intro',
        moduleId: 'general',
        title: 'Introduzione',
        icon: <Rocket className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              <strong>PhaRMA T</strong> e una web app professionale per la gestione del rischio in ambito sanitario e farmaceutico.
              La guida e organizzata in moduli per separare chiaramente l analisi proattiva FMEA, l analisi reattiva RCA
              e la Gap Analysis per la verifica di conformita rispetto a requisiti e standard.
            </p>

            <InfoBox title="Finalita e limiti d uso" variant="warning">
              PhaRMA T e uno strumento formativo, metodologico e di supporto documentale. Non e un dispositivo medico,
              non formula diagnosi, non prescrive interventi terapeutici e non deve essere utilizzata come strumento
              decisionale clinico diretto. Usa dati simulati, anonimizzati, aggregati o comunque non identificativi.
            </InfoBox>

            <InfoBox title="Struttura della guida">
              La sezione e pensata per crescere nel tempo: nuovi moduli come Audit, HACCP, Checklist o controlli periodici possono
              essere aggiunti alla sidebar mantenendo la stessa struttura di navigazione.
            </InfoBox>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-5 h-5 text-sky-600" />
                  <h3 className="font-semibold text-sky-900">Analisi proattiva</h3>
                </div>
                <p className="text-sm text-sky-800 leading-relaxed">
                  Il modulo FMEA permette di anticipare i rischi, valutare priorita e pianificare azioni prima che si verifichi un evento.
                </p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="w-5 h-5 text-amber-600" />
                  <h3 className="font-semibold text-amber-900">Analisi reattiva</h3>
                </div>
                <p className="text-sm text-amber-800 leading-relaxed">
                  Il modulo RCA supporta l analisi di eventi gia accaduti, near miss e non conformita, fino alla definizione di azioni correttive.
                </p>
              </div>
              <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardCheck className="w-5 h-5 text-teal-600" />
                  <h3 className="font-semibold text-teal-900">Verifica di conformita</h3>
                </div>
                <p className="text-sm text-teal-800 leading-relaxed">
                  Il modulo Gap Analysis confronta lo stato attuale con target, requisiti e norme, generando criticita e piani di azione.
                </p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800">Funzionalita principali</h3>
            <BulletList
              items={[
                'Creazione guidata di assessment FMEA, RCA e Gap Analysis.',
                'Gestione strutturata di rischi, cause, Root Cause, requisiti, norme e azioni correttive.',
                'Dashboard operative per monitorare stato, severita, priorita e avanzamento.',
                'Report professionali ed export PDF, Excel e immagini dove previsti.',
                'Impostazione modulare pensata per audit, revisioni e miglioramento continuo.',
              ]}
            />
          </div>
        ),
      },
    ]

    const fmeaSections: GuideSection[] = [
      {
        id: 'fmea-intro',
        moduleId: 'fmea',
        title: 'Introduzione FMEA',
        icon: <BookOpen className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              La <strong>FMEA</strong> (Failure Mode and Effects Analysis) e una metodologia proattiva per identificare,
              valutare e prioritizzare i potenziali modi di guasto di un processo prima che si traducano in eventi avversi.
            </p>
            <InfoBox title="Obiettivo FMEA">
              L obiettivo e anticipare i rischi, stimare la loro criticita e definire azioni correttive proporzionate al livello
              di priorita calcolato.
            </InfoBox>
            <BulletList
              items={[
                'Identificazione guidata dei rischi da catalogo o personalizzati.',
                'Valutazione con parametri Severita, Probabilita e Rilevabilita.',
                'Calcolo automatico del RPN e classificazione del rischio.',
                'Gestione delle azioni correttive collegate ai rischi prioritari.',
              ]}
            />
          </div>
        ),
      },
      {
        id: 'fmea-assessment',
        moduleId: 'fmea',
        title: 'Creare un Assessment',
        icon: <FileText className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Un assessment FMEA rappresenta una valutazione completa del rischio per una struttura, un processo o un periodo specifico.
            </p>
            <NumberedSteps
              steps={[
                { title: 'Vai alla Dashboard FMEA', description: 'Dalla sezione FMEA seleziona la dashboard e avvia un nuovo assessment.' },
                { title: 'Inserisci i dettagli', description: 'Compila titolo, descrizione e informazioni organizzative utili alla reportistica.' },
                { title: 'Seleziona le aree', description: 'Scegli le aree o i processi da valutare, ad esempio approvvigionamento, stoccaggio, allestimento o distribuzione.' },
                { title: 'Conferma la creazione', description: 'Crea l assessment e passa alla fase di inserimento e valutazione dei rischi.' },
              ]}
            />
            <InfoBox title="Suggerimento" variant="tip">
              Nella sezione Impostazioni puoi configurare il nome della struttura, utilizzato nei report PDF.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'fmea-risks',
        moduleId: 'fmea',
        title: 'Aggiungere Rischi',
        icon: <AlertTriangle className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Dopo la creazione dell assessment puoi aggiungere i rischi da valutare. Puoi selezionare rischi da catalogo o creare rischi personalizzati.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {['Approvvigionamento', 'Stoccaggio', 'Allestimento', 'Distribuzione', 'Somministrazione', 'Monitoraggio', 'Formazione', 'Tecnologia'].map((area) => (
                <div key={area} className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                  {area}
                </div>
              ))}
            </div>
            <InfoBox title="Rischi personalizzati" variant="tip">
              Se il rischio non e presente nel catalogo, puoi inserirlo manualmente indicando nome, descrizione e categoria.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'fmea-evaluation',
        moduleId: 'fmea',
        title: 'Valutazione FMEA',
        icon: <BarChart3 className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Ogni rischio viene valutato con tre parametri. Il prodotto genera il <strong>RPN</strong> (Risk Priority Number).
            </p>
            <MiniTable
              columns={['Parametro', 'Significato', 'Scala']}
              rows={[
                ['Severita (S)', 'Gravita delle conseguenze se il rischio si manifesta.', '1-5'],
                ['Probabilita (P)', 'Frequenza o probabilita di accadimento.', '1-5'],
                ['Rilevabilita (D)', 'Capacita del sistema di intercettare il rischio.', '1-5'],
              ]}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-red-700">&gt;= 50</div>
                <div className="text-sm font-medium text-red-800">Alta</div>
                <div className="text-xs text-red-600 mt-1">Intervento immediato</div>
              </div>
              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-yellow-700">20-49</div>
                <div className="text-sm font-medium text-yellow-800">Media</div>
                <div className="text-xs text-yellow-600 mt-1">Azione programmata</div>
              </div>
              <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-700">&lt; 20</div>
                <div className="text-sm font-medium text-green-800">Bassa</div>
                <div className="text-xs text-green-600 mt-1">Monitoraggio</div>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'fmea-actions',
        moduleId: 'fmea',
        title: 'Azioni Correttive',
        icon: <CheckCircle2 className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Per ogni rischio identificato puoi pianificare una o piu azioni correttive per mitigare il rischio e ridurre il RPN.
            </p>
            <NumberedSteps
              steps={[
                { title: 'Seleziona assessment', description: 'Scegli l assessment a cui appartiene il rischio da gestire.' },
                { title: 'Seleziona rischio', description: 'Individua il rischio, visualizzando RPN e classe di priorita.' },
                { title: 'Inserisci dettagli', description: 'Compila descrizione azione, responsabile, scadenza e stato.' },
              ]}
            />
            <InfoBox title="Azione rapida dall assessment" variant="tip">
              Puoi aggiungere azioni anche dal dettaglio assessment, usando l icona <ClipboardPlus className="inline w-4 h-4 text-sky-600" /> accanto al rischio.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'fmea-charts',
        moduleId: 'fmea',
        title: 'Grafici',
        icon: <PieChart className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Il modulo FMEA include viste grafiche per interpretare priorita e distribuzione dei rischi.
            </p>
            <BulletList
              items={[
                <><strong>Matrice 5x5:</strong> visualizza i rischi per severita e probabilita.</>,
                <><strong>Pareto:</strong> ordina i rischi per RPN e supporta la concentrazione sui rischi piu critici.</>,
                <><strong>Filtri:</strong> permettono di analizzare top risk, categorie e classi di priorita.</>,
              ]}
            />
          </div>
        ),
      },
      {
        id: 'fmea-export',
        moduleId: 'fmea',
        title: 'Export PDF ed Excel',
        icon: <Download className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              L export FMEA produce documenti utili per audit, riunioni di miglioramento e archiviazione interna.
            </p>
            <BulletList
              items={[
                <><strong>PDF:</strong> copertina, executive summary, metodologia, rischi, Pareto e raccomandazioni.</>,
                <><strong>Excel:</strong> dataset tabellare con informazioni assessment, rischi e azioni correttive.</>,
                <><strong>PNG:</strong> esportazione grafica dove disponibile, ad esempio per matrice o grafici.</>,
              ]}
            />
          </div>
        ),
      },
      {
        id: 'fmea-faq',
        moduleId: 'fmea',
        title: 'FAQ FMEA',
        icon: <HelpCircle className="w-5 h-5" />,
        content: faqList(fmeaFaqs),
      },
    ]

    const rcaSections: GuideSection[] = [
      {
        id: 'rca-intro',
        moduleId: 'rca',
        title: 'Introduzione RCA',
        icon: <Search className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              La <strong>Root Cause Analysis (RCA)</strong> e una metodologia strutturata di analisi reattiva utilizzata per investigare
              eventi avversi, quasi eventi (near miss) e non conformita nei processi sanitari. A differenza della FMEA, che ha
              un approccio proattivo, la RCA interviene a posteriori, con l obiettivo di comprendere in modo sistematico cosa e
              accaduto, perche e accaduto, quali fattori hanno contribuito e quali interventi possono prevenire il ripetersi
              dell evento.
            </p>
            <InfoBox title="RCA vs FMEA">
              La FMEA anticipa scenari di rischio prima che si verifichino; la RCA parte da un evento reale o da un near miss
              e ricostruisce le cause profonde per prevenire recidive.
            </InfoBox>
            <h3 className="text-lg font-semibold text-gray-800">Obiettivi della RCA</h3>
            <BulletList
              items={[
                'Identificare le cause profonde, non solo i sintomi o le conseguenze immediate.',
                'Analizzare le interazioni tra fattori organizzativi, umani, clinici e tecnologici.',
                'Supportare decisioni basate su evidenze, dati oggettivi e ragionamento documentato.',
                'Definire azioni correttive efficaci, sostenibili e tracciabili.',
              ]}
            />
            <h3 className="text-lg font-semibold text-gray-800">Strumenti metodologici utilizzati</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
                <Network className="w-5 h-5 text-sky-600 mb-2" />
                <h4 className="font-semibold text-sky-900">Diagramma di Ishikawa</h4>
                <p className="text-sm text-sky-800 mt-1">Struttura e classifica le cause per categoria.</p>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4">
                <Target className="w-5 h-5 text-amber-600 mb-2" />
                <h4 className="font-semibold text-amber-900">5 Whys</h4>
                <p className="text-sm text-amber-800 mt-1">Approfondisce progressivamente le cause candidate.</p>
              </div>
              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <ClipboardCheck className="w-5 h-5 text-green-600 mb-2" />
                <h4 className="font-semibold text-green-900">Azioni correttive</h4>
                <p className="text-sm text-green-800 mt-1">Trasformano l analisi in miglioramento operativo.</p>
              </div>
            </div>
          </div>
        ),
      },
      {
        id: 'rca-create',
        moduleId: 'rca',
        title: 'Creare un RCA Assessment',
        icon: <FileText className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Un RCA Assessment rappresenta un analisi completa di un evento specifico. Si utilizza quando e necessario
              comprendere in modo strutturato le cause di un evento avverso clinico, di un errore di terapia farmacologica,
              di un problema organizzativo rilevante, di una non conformita o di un near miss ad alto potenziale di rischio.
            </p>
            <h3 className="text-lg font-semibold text-gray-800">Procedura operativa</h3>
            <NumberedSteps
              steps={[
                { title: 'Accedi alla Dashboard RCA', description: 'Entra nella macro-area di analisi reattiva e apri la dashboard RCA.' },
                { title: 'Clicca su Nuovo Assessment', description: 'Avvia la creazione di un nuovo caso RCA.' },
                { title: 'Compila i dati principali', description: 'Inserisci titolo, descrizione, tipo evento, severita, data, area coinvolta e contesto.' },
                { title: 'Avvia il processo di analisi', description: 'Dopo il salvataggio, accedi al dettaglio assessment e procedi con evento, Ishikawa, 5 Whys, cause, azioni e report.' },
              ]}
            />
            <InfoBox title="Lifecycle assessment" variant="tip">
              Ogni assessment evolve attraverso raccolta dati, analisi causale, validazione delle cause, pianificazione azioni,
              reportistica e monitoraggio.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'rca-event',
        moduleId: 'rca',
        title: 'Evento e raccolta dati',
        icon: <ClipboardList className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              La fase iniziale di raccolta dati e fondamentale per garantire la qualita dell analisi. L obiettivo e costruire
              una base informativa completa e oggettiva, evitando interpretazioni premature o attribuzioni individuali non supportate.
            </p>
            <h3 className="text-lg font-semibold text-gray-800">Informazioni da registrare</h3>
            <BulletList
              items={[
                'Descrizione dettagliata dell evento, con sequenza temporale e fatti osservabili.',
                'Data, ora, contesto clinico e unita operativa coinvolta.',
                'Tipo di evento: incidente, near miss, non conformita, reclamo o altro.',
                'Severita dell evento: bassa, media, alta o critica.',
                'Eventuali azioni di contenimento immediato gia attuate.',
              ]}
            />
            <InfoBox title="Qualita del dato">
              La raccolta oggettiva dei dati permette di distinguere i fatti dalle ipotesi e migliora la robustezza metodologica
              delle fasi successive.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'rca-ishikawa',
        moduleId: 'rca',
        title: 'Diagramma di Ishikawa',
        icon: <Network className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Il diagramma di Ishikawa rappresenta graficamente le possibili cause di un evento e aiuta il team a organizzare
              il ragionamento in categorie. Nel modulo RCA, le categorie attive vengono selezionate o personalizzate e le cause
              vengono aggiunte all interno dei relativi rami.
            </p>
            <h3 className="text-lg font-semibold text-gray-800">Categorie causali</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {['Organizzazione', 'Persone', 'Processi / Procedure', 'Tecnologie / Attrezzature', 'Ambiente', 'Farmaci / Materiali', 'Controlli / Monitoraggio'].map((category) => (
                <div key={category} className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  {category}
                </div>
              ))}
            </div>
            <h3 className="text-lg font-semibold text-gray-800">Causa candidata</h3>
            <p className="text-gray-700 leading-relaxed">
              Una causa marcata come <Badge color="red">Candidata Root Cause</Badge> non e ancora confermata, ma rappresenta
              un elemento critico da approfondire. Da una causa candidata e possibile avviare una 5 Whys oppure creare azioni
              correttive collegate.
            </p>
            <InfoBox title="Collegamento metodologico" variant="tip">
              Ishikawa serve a generare e ordinare ipotesi causali; 5 Whys serve ad approfondirle; le azioni correttive traducono
              l esito in interventi operativi.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'rca-five-whys',
        moduleId: 'rca',
        title: 'Analisi 5 Whys',
        icon: <Target className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Il metodo dei <strong>5 Whys</strong> consente di approfondire una causa candidata attraverso una sequenza di domande
              "Perche?". L obiettivo e risalire progressivamente dalle cause superficiali a quelle profonde, documentando il ragionamento
              in modo trasparente.
            </p>
            <NumberedSteps
              steps={[
                { title: 'Seleziona una causa candidata', description: 'La 5 Whys parte da una causa gia identificata nel diagramma di Ishikawa.' },
                { title: 'Inserisci uno o piu Perche', description: 'Ogni risposta deve spiegare il livello causale precedente e restare coerente con i dati raccolti.' },
                { title: 'Valuta la catena causale', description: 'Quando la catena e sufficientemente chiara, assegna un esito metodologico alla causa.' },
                { title: 'Aggiungi una nota', description: 'La nota metodologica documenta perche la causa e stata confermata o esclusa.' },
              ]}
            />
            <MiniTable
              columns={['Esito', 'Significato']}
              rows={[
                [<Badge color="red">Candidata Root Cause</Badge>, 'Analisi non ancora conclusa o causa ancora da approfondire.'],
                [<Badge color="green">Root Cause confermata</Badge>, 'Causa primaria o determinante confermata dall analisi.'],
                [<Badge color="slate">Non confermata</Badge>, 'Ipotesi non supportata dalla catena causale o dai dati disponibili.'],
              ]}
            />
          </div>
        ),
      },
      {
        id: 'rca-causes',
        moduleId: 'rca',
        title: 'Cause e Root Cause',
        icon: <AlertTriangle className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              La tab Cause fornisce una vista riepilogativa di tutte le cause identificate nell assessment, con categoria,
              fonte, stato Root Cause, numero di azioni collegate e presenza di analisi 5 Whys.
            </p>
            <MiniTable
              columns={['Stato', 'Uso metodologico']}
              rows={[
                ['candidate', 'Causa candidata da approfondire o ancora non conclusa.'],
                ['confirmed', 'Root Cause confermata dopo analisi metodologica.'],
                ['not_confirmed', 'Causa candidata esclusa come Root Cause.'],
              ]}
            />
            <InfoBox title="Tracciabilita">
              La relazione tra causa, esito metodologico, 5 Whys e azioni correttive consente di mantenere coerenza tra analisi
              causale e interventi di miglioramento.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'rca-actions',
        moduleId: 'rca',
        title: 'Azioni Correttive RCA',
        icon: <ClipboardCheck className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Le azioni correttive rappresentano la fase operativa della RCA. Servono a ridurre il rischio di recidiva,
              migliorare i processi e aumentare la sicurezza del paziente.
            </p>
            <MiniTable
              columns={['Campo', 'Descrizione']}
              rows={[
                ['Descrizione', 'Intervento correttivo da realizzare.'],
                ['Responsabile', 'Persona o funzione incaricata dell implementazione.'],
                ['Scadenza', 'Data entro cui completare o rivalutare l azione.'],
                ['Priorita', 'Low, medium, high o critical.'],
                ['Stato', 'planned, in_progress o completed.'],
              ]}
            />
            <div className="flex flex-wrap gap-2">
              <Badge color="sky">Pianificata</Badge>
              <Badge color="amber">In corso</Badge>
              <Badge color="green">Completata</Badge>
            </div>
            <InfoBox title="Nota metodologica" variant="tip">
              Le azioni possono essere associate sia a cause candidate sia a Root Cause confermate, ma assumono maggiore rilevanza
              quando sono collegate a cause confermate.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'rca-dashboard',
        moduleId: 'rca',
        title: 'Dashboard RCA',
        icon: <BarChart3 className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              La dashboard RCA fornisce una visione sintetica e operativa del sistema di analisi reattiva.
            </p>
            <BulletList
              items={[
                'Numero totale di assessment RCA e distribuzione per stato.',
                'Eventi per severita: low, medium, high, critical.',
                'Cause identificate, cause candidate e Root Cause confermate.',
                'Analisi 5 Whys avviate e avanzamento del workflow.',
                'Azioni correttive pianificate, in corso, completate e scadute.',
                'Accesso rapido agli assessment recenti.',
              ]}
            />
          </div>
        ),
      },
      {
        id: 'rca-report',
        moduleId: 'rca',
        title: 'Statistiche e report',
        icon: <FileText className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              La tab Statistiche e report integra dati analitici e reportistica strutturata. Il valore principale e fornire
              un documento clinicamente interpretabile, utile per audit, revisione interna e gestione del rischio clinico.
            </p>
            <BulletList
              items={[
                'Riepilogo evento con dati essenziali, severita e contesto.',
                'Metodologia RCA applicata, con distinzione tra Ishikawa, 5 Whys e azioni.',
                'Diagramma Ishikawa visuale e sintesi delle categorie causali.',
                'Cause candidate, esiti 5 Whys e Root Cause confermate o non confermate.',
                'Piano di azione correttivo e sezione di monitoraggio.',
              ]}
            />
            <InfoBox title="Valore per audit clinico">
              Il report consente di ricostruire il razionale dell analisi, dimostrare la tracciabilita delle decisioni e
              documentare gli interventi programmati o completati.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'rca-export',
        moduleId: 'rca',
        title: 'Export dati',
        icon: <Download className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Il modulo RCA supporta formati di esportazione diversi, pensati per documentazione, audit e riuso analitico.
            </p>
            <MiniTable
              columns={['Formato', 'Utilizzo']}
              rows={[
                ['PDF', 'Report documentale completo, strutturato e stampabile. Include evento, metodologia, diagramma Ishikawa, cause, 5 Whys, azioni e monitoraggio.'],
                ['Excel', 'Dataset analitico per elaborazioni, audit, filtri e archiviazione tabellare.'],
                ['PNG', 'Esportazione grafica del diagramma di Ishikawa per presentazioni o allegati di report.'],
              ]}
            />
          </div>
        ),
      },
      {
        id: 'rca-faq',
        moduleId: 'rca',
        title: 'FAQ RCA',
        icon: <HelpCircle className="w-5 h-5" />,
        content: faqList(rcaFaqs),
      },
    ]

    const gapSections: GuideSection[] = [
      {
        id: 'gap-intro',
        moduleId: 'gap',
        title: 'Introduzione Gap Analysis',
        icon: <BookOpen className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              La <strong>Gap Analysis</strong> e una metodologia di valutazione strutturata che confronta lo stato attuale
              di un processo con uno stato atteso di riferimento. Nel contesto sanitario e farmaceutico consente di verificare
              la conformita a requisiti interni, standard organizzativi, procedure operative, norme cogenti e buone pratiche.
            </p>
            <InfoBox title="Obiettivo Gap Analysis">
              L obiettivo e identificare scostamenti documentati tra cio che avviene nella pratica e cio che dovrebbe avvenire,
              attribuire una priorita al gap e trasformare le criticita in azioni correttive verificabili.
            </InfoBox>
            <BulletList
              items={[
                'Costruire una libreria riutilizzabile di macro-processi, Domini/Sezioni e Attivita/Requisiti.',
                'Collegare norme e riferimenti agli specifici requisiti valutabili.',
                'Valutare stato attuale, target atteso, conformita, priorita e note operative.',
                'Pianificare azioni correttive con date, responsabili, avanzamento e verifica di efficacia.',
              ]}
            />
          </div>
        ),
      },
      {
        id: 'gap-library',
        moduleId: 'gap',
        title: 'Libreria processi',
        icon: <Network className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              La libreria Gap e organizzata come struttura riutilizzabile. Un processo rappresenta un macro-flusso valutabile;
              ogni processo contiene Domini/Sezioni e ogni Dominio/Sezione contiene Attivita/Requisiti.
            </p>
            <MiniTable
              columns={['Livello', 'Significato', 'Esempio']}
              rows={[
                ['Processo', 'Macro-processo o flusso operativo valutabile.', 'Gestione farmaci antiblastici'],
                ['Dominio/Sezione', 'Fase, sottoambito o area funzionale del processo.', 'Allestimento'],
                ['Contesto operativo', 'Ambiente o setting in cui il requisito viene applicato.', 'UFA, reparto, magazzino'],
                ['Attivita/Requisito', 'Azione, controllo o requisito concreto da valutare.', 'Preparazione in cappa biologica'],
              ]}
            />
            <InfoBox title="Target atteso di riferimento" variant="warning">
              Ogni nuova Attivita/Requisito deve avere un target atteso di riferimento. Il target appartiene alla libreria
              e viene mostrato in sola lettura durante l assessment.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'gap-standards',
        moduleId: 'gap',
        title: 'Catalogo Norme',
        icon: <BookMarked className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Il Catalogo Norme raccoglie i riferimenti normativi o documentali collegabili alle Attivita/Requisiti.
              Le norme possono essere consultate in lista completa o raggruppate per ambito di applicazione.
            </p>
            <MiniTable
              columns={['Campo', 'Uso']}
              rows={[
                ['Codice', 'Identificativo sintetico della norma o del documento.'],
                ['Nome e versione', 'Titolo del riferimento e versione applicabile.'],
                ['Ente emittente', 'Organizzazione, societa scientifica o autorita che ha emesso il riferimento.'],
                ['Ambito di applicazione', 'Area operativa a cui si riferisce, ad esempio allestimento o sperimentazioni.'],
                ['Norma cogente', 'Flag che evidenzia riferimenti obbligatori o vincolanti.'],
              ]}
            />
            <InfoBox title="Norme create durante assessment" variant="tip">
              Una norma creata dal pannello di valutazione puo essere salvata nel Catalogo Norme personale oppure mantenuta
              solo nello specifico assessment.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'gap-create',
        moduleId: 'gap',
        title: 'Creare un assessment Gap',
        icon: <FileText className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Un assessment Gap viene creato selezionando uno o piu macro-processi dalla libreria. Le Attivita/Requisiti
              dei processi selezionati generano automaticamente le valutazioni assessment-specifiche.
            </p>
            <NumberedSteps
              steps={[
                { title: 'Compila i dati generali', description: 'Inserisci titolo, struttura, reparto, assessor, data e descrizione del perimetro.' },
                { title: 'Seleziona i processi', description: 'Scegli i macro-processi da includere. Ogni processo porta con se Domini/Sezioni e Attivita/Requisiti.' },
                { title: 'Verifica la preview', description: 'Controlla il numero di Domini/Sezioni e Attivita/Requisiti prima della creazione.' },
                { title: 'Crea l assessment', description: 'Il sistema genera una valutazione per ogni Attivita/Requisito selezionata.' },
              ]}
            />
            <InfoBox title="Arricchimento durante la valutazione" variant="tip">
              Nel dettaglio assessment puoi aggiungere nuovi Domini/Sezioni o Attivita/Requisiti e scegliere se salvarli
              nella libreria personale o limitarli allo specifico assessment.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'gap-evaluation',
        moduleId: 'gap',
        title: 'Valutazione e criticita',
        icon: <ClipboardCheck className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              La tab Valutazione e la console operativa dell assessment. Ogni riga rappresenta una Attivita/Requisito
              e puo essere espansa per compilare i dati della valutazione.
            </p>
            <MiniTable
              columns={['Campo', 'Descrizione']}
              rows={[
                ['Stato attuale', 'Situazione osservata durante la valutazione.'],
                ['Target atteso', 'Stato atteso di riferimento proveniente dalla libreria.'],
                ['Gap rilevato', 'Descrizione dello scostamento tra stato attuale e target.'],
                ['Conformita', 'Non valutata, conforme, parzialmente conforme o non conforme.'],
                ['Priorita rischio', 'Low, medium o high in base alla rilevanza del gap.'],
                ['Note', 'Evidenze, osservazioni o riferimenti operativi.'],
              ]}
            />
            <InfoBox title="Definizione di criticita">
              Una valutazione e considerata criticita quando lo stato di conformita e <strong>non conforme</strong> o
              <strong> parzialmente conforme</strong>. Il testo del gap descrive lo scostamento, ma non determina da solo
              la criticita.
            </InfoBox>
            <BulletList
              items={[
                'Usa i filtri rapidi per visualizzare tutte le attivita, quelle da valutare, le criticita o le alte priorita.',
                'Il filtro Con norme cogenti evidenzia requisiti collegati a riferimenti obbligatori.',
                'Il filtro Solo assessment mostra elementi creati nello specifico assessment e non salvati in libreria.',
              ]}
            />
          </div>
        ),
      },
      {
        id: 'gap-actions',
        moduleId: 'gap',
        title: 'Azioni correttive Gap',
        icon: <CheckCircle2 className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Le azioni correttive Gap sono collegate a valutazioni non conformi o parzialmente conformi. Possono essere
              create rapidamente dalla riga di valutazione oppure gestite nella tab Azioni correttive.
            </p>
            <MiniTable
              columns={['Elemento', 'Descrizione']}
              rows={[
                ['Responsabile/i', 'Persona, team o funzione responsabile dell intervento.'],
                ['Priorita', 'Low, medium, high o critical.'],
                ['Stato', 'not_started, planned, in_progress, blocked, completed, verified o closed.'],
                ['Progress', 'Percentuale di avanzamento usata anche per il Diagramma di GANTT.'],
                ['Date pianificate', 'Inizio e fine pianificata dell intervento.'],
                ['Verifica efficacia', 'Esito documentato dopo il completamento dell azione.'],
              ]}
            />
            <InfoBox title="Verifica di efficacia">
              Dopo il completamento, l azione entra in verifica. L esito puo essere efficace, parzialmente efficace o inefficace.
              Se l esito e inefficace, l azione torna operativamente in corso e deve essere rivalutata.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'gap-dashboard',
        moduleId: 'gap',
        title: 'Dashboard Gap',
        icon: <BarChart3 className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              La dashboard Gap sintetizza lo stato complessivo degli assessment, delle criticita e delle azioni correttive.
              E pensata come vista operativa, non come report completo.
            </p>
            <BulletList
              items={[
                'Assessment totali e compliance media.',
                'Gap aperti e gap ad alta priorita.',
                'Azioni aperte, azioni scadute e verifiche pending.',
                'Distribuzioni grafiche per conformita, priorita, stato azioni ed esiti di verifica.',
                'Liste operative con ultimi assessment, gap prioritari, azioni scadute e verifiche da completare.',
              ]}
            />
          </div>
        ),
      },
      {
        id: 'gap-report',
        moduleId: 'gap',
        title: 'Statistiche e report',
        icon: <PieChart className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              La tab Statistiche e report presenta una vista analitica dello specifico assessment. Non sostituisce la
              console di valutazione, ma interpreta i dati compilati e prepara il contenuto per il report documentale.
            </p>
            <BulletList
              items={[
                'Compliance per Dominio/Sezione e distribuzione degli stati di conformita.',
                'Priorita dei gap e focus sui gap ad alta priorita.',
                'Stato delle azioni correttive ed esiti della verifica efficacia.',
                'Diagramma di GANTT delle azioni con date pianificate, avanzamento e milestone di verifica.',
                'Note metodologiche dell analisi e sintesi interpretativa.',
              ]}
            />
          </div>
        ),
      },
      {
        id: 'gap-export',
        moduleId: 'gap',
        title: 'Export dati',
        icon: <Download className="w-5 h-5" />,
        content: (
          <div className="space-y-5">
            <p className="text-gray-700 leading-relaxed">
              Gli export Gap permettono di documentare l assessment e riutilizzare i dati per audit, riunioni operative
              o analisi successive.
            </p>
            <MiniTable
              columns={['Formato', 'Contenuto']}
              rows={[
                ['PDF', 'Report documentale con dati assessment, KPI, grafici, valutazioni, criticita, azioni, norme e firma finale.'],
                ['Excel', 'Workbook con riepilogo, valutazioni, criticita, azioni e norme collegate.'],
                ['PNG', 'Esportazione dei grafici principali, inclusi distribuzioni e Diagramma di GANTT.'],
              ]}
            />
            <InfoBox title="Uso del report PDF" variant="tip">
              Il report PDF e pensato per audit e conservazione documentale. I grafici includono percentuali o valori leggibili
              anche quando vengono esportati come immagini statiche.
            </InfoBox>
          </div>
        ),
      },
      {
        id: 'gap-faq',
        moduleId: 'gap',
        title: 'FAQ Gap Analysis',
        icon: <HelpCircle className="w-5 h-5" />,
        content: faqList(gapFaqs),
      },
    ]

    return [
      {
        id: 'general',
        title: 'Introduzione',
        subtitle: 'Contesto generale',
        color: 'slate',
        sections: generalSections,
      },
      {
        id: 'fmea',
        title: 'Modulo FMEA',
        subtitle: 'Analisi proattiva',
        color: 'sky',
        sections: fmeaSections,
      },
      {
        id: 'rca',
        title: 'Modulo RCA',
        subtitle: 'Analisi reattiva',
        color: 'amber',
        sections: rcaSections,
      },
      {
        id: 'gap',
        title: 'Modulo GAP',
        subtitle: 'Gap Analysis',
        color: 'teal',
        sections: gapSections,
      },
    ]
  }, [expandedFaq])

  const allSections = modules.flatMap((module) => module.sections)
  const active = allSections.find((section) => section.id === activeSection) || allSections[0]

  const toggleModule = (moduleId: GuideModuleId) => {
    setExpandedModules((current) => ({ ...current, [moduleId]: !current[moduleId] }))
  }

  const moduleHeaderColor = (module: GuideModule) => {
    if (module.color === 'sky') return 'text-sky-700 bg-sky-50'
    if (module.color === 'amber') return 'text-amber-700 bg-amber-50'
    if (module.color === 'teal') return 'text-teal-700 bg-teal-50'
    return 'text-slate-700 bg-slate-50'
  }

  return (
    <div className="clinical-page">
        <PageHeader
          title="Guida Utente"
          description="Manuale operativo modulare per FMEA, RCA, Gap Analysis e futuri moduli di gestione del rischio sanitario."
          icon={<BookOpen className="h-5 w-5" />}
        />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
          <aside>
            <nav className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:sticky lg:top-8">
              {modules.map((module) => (
                <div key={module.id} className="mb-2 last:mb-0">
                  <button
                    type="button"
                    onClick={() => toggleModule(module.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-left transition ${moduleHeaderColor(module)}`}
                  >
                    <span>
                      <span className="block text-sm font-semibold">{module.title}</span>
                      <span className="block text-xs opacity-75">{module.subtitle}</span>
                    </span>
                    {expandedModules[module.id] ? (
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 flex-shrink-0" />
                    )}
                  </button>

                  {expandedModules[module.id] && (
                    <div className="mt-1 space-y-1">
                      {module.sections.map((section) => (
                        <button
                          key={section.id}
                          type="button"
                          onClick={() => setActiveSection(section.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition ${
                            activeSection === section.id
                              ? 'bg-sky-50 text-sky-700'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className={activeSection === section.id ? 'text-sky-600' : 'text-gray-400'}>
                            {section.icon}
                          </span>
                          <span className="text-sm font-medium">{section.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
          </aside>

          <main>
            <Card elevated>
              <CardContent className="p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                <span className="text-sky-700">{active.icon}</span>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{active.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {modules.find((module) => module.id === active.moduleId)?.title}
                  </p>
                </div>
              </div>
              {active.content}
              </CardContent>
            </Card>
          </main>
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>PhaRMA T v1.0 - © 2026 Dott. Daniele Leonardi Vinci, PharmD</p>
        </div>
      </div>
  )
}
