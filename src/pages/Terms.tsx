import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Terms() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Indietro
        </button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Termini di Servizio</h1>
          <p className="text-gray-500 mb-8">Ultimo aggiornamento: Dicembre 2025</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Accettazione dei Termini</h2>
              <p>
                Utilizzando l'applicazione PhaRMA T (Pharmacy Risk Management Assessment Tool), 
                accetti integralmente i presenti Termini di Servizio. Se non accetti questi termini, 
                ti preghiamo di non utilizzare l'applicazione.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Descrizione del Servizio</h2>
              <p>
                PhaRMA T è uno strumento per la gestione e valutazione del rischio in ambito farmaceutico, 
                basato sulla metodologia FMEA (Failure Mode and Effects Analysis). 
                L'applicazione permette di:
              </p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Creare e gestire assessment di rischio</li>
                <li>Identificare e valutare rischi (Severità, Probabilità, Rilevabilità)</li>
                <li>Calcolare l'indice RPN (Risk Priority Number)</li>
                <li>Pianificare azioni correttive</li>
                <li>Esportare report in formato PDF e Excel</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Uso Consentito</h2>
              <p>L'applicazione è destinata a:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Professionisti del settore farmaceutico e sanitario</li>
                <li>Attività di formazione e ricerca</li>
                <li>Uso interno presso strutture sanitarie</li>
              </ul>
              <p className="mt-2">
                È vietato utilizzare l'applicazione per scopi illegali o non autorizzati.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Account Utente</h2>
              <p>
                Per utilizzare l'applicazione è necessario creare un account. 
                Sei responsabile della riservatezza delle tue credenziali di accesso 
                e di tutte le attività svolte tramite il tuo account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Proprietà Intellettuale</h2>
              <p>
                L'applicazione PhaRMA T, inclusi il codice sorgente, il design, i loghi, 
                i testi e tutti i contenuti, sono di proprietà esclusiva del 
                <strong> Dott. Daniele Leonardi Vinci</strong> e sono protetti dalle leggi 
                sul diritto d'autore e sulla proprietà intellettuale.
              </p>
              <p className="mt-2">
                È vietato copiare, modificare, distribuire, vendere o creare opere derivate 
                dall'applicazione senza autorizzazione scritta del proprietario.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Limitazione di Responsabilità</h2>
              <p>
                L'applicazione è fornita "così com'è" senza garanzie di alcun tipo. 
                Il Titolare non garantisce che il servizio sia privo di errori o interruzioni.
              </p>
              <p className="mt-2">
                <strong>Importante:</strong> PhaRMA T è uno strumento di supporto alla gestione del rischio. 
                Le valutazioni e le decisioni finali rimangono di esclusiva responsabilità dell'utente 
                e dei professionisti competenti. L'applicazione non sostituisce il giudizio professionale 
                né le procedure aziendali vigenti.
              </p>
              <p className="mt-2">
                Il Titolare non è responsabile per danni diretti, indiretti, incidentali o consequenziali 
                derivanti dall'uso o dall'impossibilità di utilizzare l'applicazione.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Disponibilità del Servizio</h2>
              <p>
                Il Titolare si impegna a mantenere l'applicazione disponibile, ma non garantisce 
                un servizio ininterrotto. Potranno verificarsi interruzioni per manutenzione, 
                aggiornamenti o cause di forza maggiore.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Modifiche ai Termini</h2>
              <p>
                Il Titolare si riserva il diritto di modificare questi Termini di Servizio in qualsiasi momento. 
                Le modifiche saranno effettive dalla pubblicazione nell'applicazione. 
                L'uso continuato del servizio dopo le modifiche costituisce accettazione dei nuovi termini.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Legge Applicabile</h2>
              <p>
                I presenti Termini sono regolati dalla legge italiana. Per qualsiasi controversia 
                sarà competente il Foro del luogo di residenza del Titolare.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">10. Contatti</h2>
              <p>
                Per domande o chiarimenti sui presenti Termini di Servizio, 
                contatta il Titolare tramite l'indirizzo email daniele.leo93@gmail.com.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center text-gray-500 text-sm">
          © 2025 Dott. Daniele Leonardi Vinci. Tutti i diritti riservati.
        </div>
      </div>
    </div>
  )
}