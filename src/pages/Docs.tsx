import React, { useState } from 'react'

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

import { 
  BookOpen, 
  Rocket, 
  FileText, 
  AlertTriangle, 
  BarChart3, 
  CheckCircle2, 
  PieChart, 
  Download,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Info,
  Lightbulb
} from 'lucide-react'

interface Section {
  id: string
  title: string
  icon: React.ReactNode
  content: React.ReactNode
}

export default function Docs() {
  const [activeSection, setActiveSection] = useState('intro')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const sections: Section[] = [
    {
      id: 'intro',
      title: 'Introduzione',
      icon: <Rocket className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            <strong>PhaRMA T</strong> (Pharmacy Risk Management Assessment Tool) è uno strumento 
            professionale per la gestione del rischio in ambito farmaceutico, basato sulla 
            metodologia <strong>FMEA</strong> (Failure Mode and Effects Analysis).
          </p>
          
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sky-900">Cos'è la FMEA?</h4>
                <p className="text-sky-800 text-sm mt-1">
                  La FMEA è una metodologia sistematica per identificare e valutare i potenziali 
                  modi di guasto di un processo, valutando ogni rischio secondo tre parametri: 
                  Severità, Probabilità e Rilevabilità.
                </p>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mt-6">Funzionalità principali</h3>
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Creazione guidata di assessment del rischio</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Catalogo di centinaia di rischi pre-configurati</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Calcolo automatico del RPN (Risk Priority Number)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Visualizzazione con Matrice 5×5 e Grafico di Pareto</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Gestione delle azioni correttive</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Export professionale in PDF ed Excel</span>
            </li>
          </ul>
        </div>
      )
    },
    {
      id: 'assessment',
      title: 'Creare un Assessment',
      icon: <FileText className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Un <strong>assessment</strong> è una valutazione del rischio completa per la tua struttura. 
            Puoi creare più assessment per valutare aree diverse o periodi differenti.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mt-6">Come creare un nuovo assessment</h3>
          
          <ol className="space-y-4 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-semibold text-sm">1</span>
              <div>
                <strong>Vai alla Dashboard</strong>
                <p className="text-sm text-gray-600 mt-1">Dalla pagina principale, clicca su "Nuovo Assessment"</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-semibold text-sm">2</span>
              <div>
                <strong>Inserisci i dettagli</strong>
                <p className="text-sm text-gray-600 mt-1">Compila titolo e descrizione dell'assessment (es. "Valutazione Rischi Q1 2025")</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-semibold text-sm">3</span>
              <div>
                <strong>Seleziona le aree</strong>
                <p className="text-sm text-gray-600 mt-1">Scegli le aree da valutare: Approvvigionamento, Stoccaggio, Allestimento, ecc.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center font-semibold text-sm">4</span>
              <div>
                <strong>Conferma la creazione</strong>
                <p className="text-sm text-gray-600 mt-1">Clicca "Crea Assessment" per iniziare ad aggiungere i rischi</p>
              </div>
            </li>
          </ol>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900">Suggerimento</h4>
                <p className="text-amber-800 text-sm mt-1">
                  Nella sezione Impostazioni puoi configurare il nome della tua struttura, 
                  che verrà utilizzato nei report PDF.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'risks',
      title: 'Aggiungere Rischi',
      icon: <AlertTriangle className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Una volta creato l'assessment, puoi aggiungere i rischi da valutare. 
            Hai due opzioni: selezionare dal catalogo o creare rischi personalizzati.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mt-6">Rischi da catalogo</h3>
          <p className="text-gray-700">
            Il catalogo contiene <strong>centinaia di rischi</strong> pre-configurati, organizzati per area:
          </p>
          
          <div className="grid grid-cols-2 gap-2 mt-3">
            {[
              'Approvvigionamento',
              'Stoccaggio', 
              'Allestimento',
              'Distribuzione',
              'Somministrazione',
              'Monitoraggio',
              'Formazione',
              'Tecnologia'
            ].map(area => (
              <div key={area} className="bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
                {area}
              </div>
            ))}
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mt-6">Rischi personalizzati</h3>
          <p className="text-gray-700">
            Se il rischio che cerchi non è nel catalogo, puoi crearne uno personalizzato:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-700 mt-2">
            <li>Clicca su "Aggiungi Rischio Personalizzato"</li>
            <li>Inserisci nome e descrizione del rischio</li>
            <li>Seleziona la categoria di appartenenza</li>
            <li>Procedi con la valutazione FMEA</li>
          </ol>
        </div>
      )
    },
    {
      id: 'fmea',
      title: 'Valutazione FMEA',
      icon: <BarChart3 className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Ogni rischio viene valutato secondo tre parametri FMEA. Il prodotto di questi 
            tre valori determina il <strong>RPN</strong> (Risk Priority Number).
          </p>

          <div className="space-y-4 mt-6">
            {/* Severità */}
            <div className="border border-red-200 rounded-lg overflow-hidden">
              <div className="bg-red-50 px-4 py-2 border-b border-red-200">
                <h4 className="font-semibold text-red-800">Severità (S) - Gravità delle conseguenze</h4>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="py-1 font-medium w-12">1</td><td className="py-1 text-gray-600">Minima - Nessun danno o trascurabile</td></tr>
                    <tr><td className="py-1 font-medium">2</td><td className="py-1 text-gray-600">Bassa - Danno lieve, recuperabile</td></tr>
                    <tr><td className="py-1 font-medium">3</td><td className="py-1 text-gray-600">Moderata - Richiede intervento</td></tr>
                    <tr><td className="py-1 font-medium">4</td><td className="py-1 text-gray-600">Alta - Danno grave, potenziale pericolo</td></tr>
                    <tr><td className="py-1 font-medium">5</td><td className="py-1 text-gray-600">Catastrofica - Danno irreversibile</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Probabilità */}
            <div className="border border-yellow-200 rounded-lg overflow-hidden">
              <div className="bg-yellow-50 px-4 py-2 border-b border-yellow-200">
                <h4 className="font-semibold text-yellow-800">Probabilità (P) - Frequenza di accadimento</h4>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="py-1 font-medium w-12">1</td><td className="py-1 text-gray-600">Rara - Evento eccezionale (&lt;1/anno)</td></tr>
                    <tr><td className="py-1 font-medium">2</td><td className="py-1 text-gray-600">Improbabile - Evento raro (1-2/anno)</td></tr>
                    <tr><td className="py-1 font-medium">3</td><td className="py-1 text-gray-600">Occasionale - Evento mensile</td></tr>
                    <tr><td className="py-1 font-medium">4</td><td className="py-1 text-gray-600">Probabile - Evento settimanale</td></tr>
                    <tr><td className="py-1 font-medium">5</td><td className="py-1 text-gray-600">Frequente - Evento giornaliero</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rilevabilità */}
            <div className="border border-green-200 rounded-lg overflow-hidden">
              <div className="bg-green-50 px-4 py-2 border-b border-green-200">
                <h4 className="font-semibold text-green-800">Rilevabilità (D) - Capacità di individuazione</h4>
              </div>
              <div className="p-4">
                <table className="w-full text-sm">
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="py-1 font-medium w-12">1</td><td className="py-1 text-gray-600">Certa - Rilevazione automatica e sicura</td></tr>
                    <tr><td className="py-1 font-medium">2</td><td className="py-1 text-gray-600">Alta - Rilevazione molto probabile</td></tr>
                    <tr><td className="py-1 font-medium">3</td><td className="py-1 text-gray-600">Moderata - Possibile con controlli</td></tr>
                    <tr><td className="py-1 font-medium">4</td><td className="py-1 text-gray-600">Bassa - Rilevazione difficile</td></tr>
                    <tr><td className="py-1 font-medium">5</td><td className="py-1 text-gray-600">Nulla - Quasi impossibile</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mt-6">Calcolo RPN e Classificazione</h3>
          <p className="text-gray-700">
            <strong>RPN = S × P × D</strong> (range 1-125)
          </p>
          
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-red-100 border border-red-300 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-red-700">≥ 50</div>
              <div className="text-sm font-medium text-red-800">ALTA</div>
              <div className="text-xs text-red-600 mt-1">Intervento immediato</div>
            </div>
            <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-yellow-700">20-49</div>
              <div className="text-sm font-medium text-yellow-800">MEDIA</div>
              <div className="text-xs text-yellow-600 mt-1">Azione programmata</div>
            </div>
            <div className="bg-green-100 border border-green-300 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-700">&lt; 20</div>
              <div className="text-sm font-medium text-green-800">BASSA</div>
              <div className="text-xs text-green-600 mt-1">Monitoraggio</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'actions',
      title: 'Azioni Correttive',
      icon: <CheckCircle2 className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            Per ogni rischio identificato, puoi pianificare una o più <strong>azioni correttive</strong> 
            per mitigare il rischio e ridurre il RPN.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mt-6">Come aggiungere un'azione correttiva</h3>
          
          <ol className="space-y-3 text-gray-700">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold text-sm">1</span>
              <div>
                <strong>Apri il dettaglio del rischio</strong>
                <p className="text-sm text-gray-600 mt-1">Clicca sul rischio per cui vuoi aggiungere un'azione</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold text-sm">2</span>
              <div>
                <strong>Clicca "Aggiungi Azione"</strong>
                <p className="text-sm text-gray-600 mt-1">Si aprirà il form per inserire i dettagli</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold text-sm">3</span>
              <div>
                <strong>Compila i campi</strong>
                <p className="text-sm text-gray-600 mt-1">Descrizione, responsabile, scadenza e note</p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-7 h-7 bg-green-100 text-green-700 rounded-full flex items-center justify-center font-semibold text-sm">4</span>
              <div>
                <strong>Monitora lo stato</strong>
                <p className="text-sm text-gray-600 mt-1">Pianificata → In corso → Completata</p>
              </div>
            </li>
          </ol>

          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mt-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sky-900">Stati delle azioni</h4>
                <div className="mt-2 space-y-1 text-sm">
                  <p><span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span><strong>Pianificata:</strong> Azione identificata, da avviare</p>
                  <p><span className="inline-block w-3 h-3 bg-yellow-500 rounded-full mr-2"></span><strong>In corso:</strong> Implementazione in atto</p>
                  <p><span className="inline-block w-3 h-3 bg-green-500 rounded-full mr-2"></span><strong>Completata:</strong> Azione conclusa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'charts',
      title: 'Grafici',
      icon: <PieChart className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            PhaRMA T offre due visualizzazioni grafiche per analizzare i rischi identificati.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mt-6">Matrice di Rischio 5×5</h3>
          <p className="text-gray-700">
            La matrice visualizza i rischi in base a <strong>Severità</strong> (asse Y) e 
            <strong> Probabilità</strong> (asse X). I colori indicano il livello di rischio:
          </p>
          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-sm text-gray-600">Alto (S×P ≥ 15)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-sm text-gray-600">Medio (8-14)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Basso (&lt;8)</span>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-gray-800 mt-6">Grafico di Pareto</h3>
          <p className="text-gray-700">
            Il grafico di Pareto ordina i rischi per RPN decrescente e mostra la 
            <strong> percentuale cumulativa</strong>. Secondo il principio 80/20, 
            concentrandosi sui primi rischi si ottiene il massimo impatto.
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 mt-3">
            <li>Barre colorate per classe di rischio</li>
            <li>Linea arancione per la % cumulativa</li>
            <li>Filtri: Top 10, Top 20, Tutti</li>
          </ul>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
            <div className="flex gap-3">
              <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-amber-900">Export PNG</h4>
                <p className="text-amber-800 text-sm mt-1">
                  Entrambi i grafici possono essere esportati come immagine PNG 
                  cliccando il pulsante "Esporta PNG" o "PNG".
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'export',
      title: 'Export PDF ed Excel',
      icon: <Download className="w-5 h-5" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700 leading-relaxed">
            PhaRMA T permette di esportare l'intero assessment in formati professionali 
            per la documentazione e la condivisione.
          </p>

          <h3 className="text-lg font-semibold text-gray-800 mt-6">Report PDF</h3>
          <p className="text-gray-700">
            Il report PDF è un documento professionale multi-pagina che include:
          </p>
          <ul className="space-y-2 text-gray-700 mt-3">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Copertina</strong> - Titolo, struttura, date, statistiche</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Executive Summary</strong> - Panoramica e indicatori chiave</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Metodologia FMEA</strong> - Scale di valutazione</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Dettaglio Rischi</strong> - Tabelle per categoria</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Analisi di Pareto</strong> - Rischi prioritari</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span><strong>Raccomandazioni</strong> - Azioni correttive e piano</span>
            </li>
          </ul>

          <h3 className="text-lg font-semibold text-gray-800 mt-6">Export Excel</h3>
          <p className="text-gray-700">
            Il file Excel contiene tre fogli:
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 mt-3">
            <li><strong>Info</strong> - Dettagli assessment e statistiche</li>
            <li><strong>Rischi</strong> - Elenco completo con tutti i parametri</li>
            <li><strong>Azioni Correttive</strong> - Piano delle azioni</li>
          </ul>

          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mt-6">
            <div className="flex gap-3">
              <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-sky-900">Come esportare</h4>
                <p className="text-sky-800 text-sm mt-1">
                  Dalla pagina dell'assessment, clicca su "Esporta PDF" o "Esporta Excel" 
                  nella barra degli strumenti in alto.
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: <HelpCircle className="w-5 h-5" />,
      content: (
        <div className="space-y-3">
          {[
            {
              id: 'faq1',
              q: 'Posso modificare un rischio dopo averlo valutato?',
              a: 'Sì, puoi sempre modificare i punteggi S, P, D di un rischio. Il RPN e la classe verranno ricalcolati automaticamente.'
            },
            {
              id: 'faq2',
              q: 'Come elimino un rischio dall\'assessment?',
              a: 'Apri il dettaglio del rischio e clicca sul pulsante "Elimina". L\'azione è irreversibile.'
            },
            {
              id: 'faq3',
              q: 'Posso creare più assessment?',
              a: 'Sì, puoi creare quanti assessment vuoi. Ogni assessment è indipendente e può coprire aree o periodi diversi.'
            },
            {
              id: 'faq4',
              q: 'I miei dati sono al sicuro?',
              a: 'Sì, i dati sono memorizzati su server sicuri (Supabase) con crittografia. Ogni utente vede solo i propri assessment.'
            },
            {
              id: 'faq5',
              q: 'Posso usare PhaRMA T su tablet o smartphone?',
              a: 'Sì, l\'interfaccia è responsive e si adatta a tutti i dispositivi, anche se l\'esperienza ottimale è su desktop.'
            },
            {
              id: 'faq6',
              q: 'Come imposto il nome della mia struttura?',
              a: 'Vai su Impostazioni dal menu laterale e compila il campo "Nome Struttura". Verrà usato nei report PDF.'
            },
            {
              id: 'faq7',
              q: 'Cosa succede se elimino il mio account?',
              a: 'Tutti i tuoi dati (assessment, rischi, azioni) verranno eliminati definitivamente entro 30 giorni.'
            }
          ].map(faq => (
            <div key={faq.id} className="border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition"
              >
                <span className="font-medium text-gray-800">{faq.q}</span>
                {expandedFaq === faq.id ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {expandedFaq === faq.id && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                  <p className="text-gray-700">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="w-8 h-8 text-sky-600" />
            <h1 className="text-3xl font-bold text-gray-800">Guida Utente</h1>
          </div>
          <p className="text-gray-600">
            Tutto quello che devi sapere per utilizzare PhaRMA T al meglio
          </p>
        </div>

        <div className="flex gap-8">
          {/* Sidebar navigazione */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-xl shadow-sm border border-gray-100 p-2 sticky top-8">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition ${
                    activeSection === section.id
                      ? 'bg-sky-50 text-sky-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className={activeSection === section.id ? 'text-sky-600' : 'text-gray-400'}>
                    {section.icon}
                  </span>
                  <span className="font-medium">{section.title}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenuto */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              {sections.map(section => (
                <div
                  key={section.id}
                  className={activeSection === section.id ? 'block' : 'hidden'}
                >
                  <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
                    <span className="text-sky-600">{section.icon}</span>
                    <h2 className="text-2xl font-bold text-gray-800">{section.title}</h2>
                  </div>
                  {section.content}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>PhaRMA T v1.0 - © 2025 Dott. Daniele Leonardi Vinci, PharmD</p>
        </div>
      </div>
    </div>
  )
}
