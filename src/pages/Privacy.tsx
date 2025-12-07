import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Privacy() {
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Ultimo aggiornamento: Dicembre 2025</p>

          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Titolare del Trattamento</h2>
              <p>
                Il Titolare del trattamento dei dati personali è il <strong>Dott. Daniele Leonardi Vinci</strong>.
              </p>
              <p className="mt-2">
                Per qualsiasi richiesta relativa ai tuoi dati personali, puoi contattare il Titolare 
                tramite l'indirizzo email indicato nell'applicazione.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Dati Raccolti</h2>
              <p>L'applicazione PhaRMA T raccoglie i seguenti dati:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Dati di registrazione:</strong> indirizzo email e password (criptata)</li>
                <li><strong>Dati di utilizzo:</strong> assessment creati, rischi identificati, azioni correttive</li>
                <li><strong>Dati tecnici:</strong> cookie tecnici necessari per l'autenticazione</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Finalità del Trattamento</h2>
              <p>I dati sono trattati esclusivamente per:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Permettere la registrazione e l'accesso all'applicazione</li>
                <li>Erogare il servizio di gestione del rischio farmaceutico</li>
                <li>Salvare e recuperare i tuoi assessment</li>
              </ul>
              <p className="mt-2">
                I dati <strong>non vengono</strong> venduti, condivisi con terze parti per finalità 
                commerciali, né utilizzati per profilazione o marketing.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Base Giuridica</h2>
              <p>
                Il trattamento dei dati è basato sul <strong>consenso</strong> espresso al momento 
                della registrazione e sulla <strong>necessità contrattuale</strong> per l'erogazione 
                del servizio (Art. 6 GDPR).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Conservazione dei Dati</h2>
              <p>
                I dati sono conservati per tutta la durata dell'utilizzo del servizio. 
                In caso di cancellazione dell'account, tutti i dati associati verranno 
                eliminati entro 30 giorni.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Dove sono i Dati</h2>
              <p>
                I dati sono memorizzati su server <strong>Supabase</strong> situati nell'Unione Europea, 
                in conformità con il GDPR. L'applicazione è ospitata su <strong>Vercel</strong>.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">7. I Tuoi Diritti</h2>
              <p>Ai sensi del GDPR, hai diritto di:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li><strong>Accesso:</strong> ottenere conferma dei dati trattati</li>
                <li><strong>Rettifica:</strong> correggere dati inesatti</li>
                <li><strong>Cancellazione:</strong> richiedere l'eliminazione dei tuoi dati</li>
                <li><strong>Portabilità:</strong> ricevere i tuoi dati in formato strutturato</li>
                <li><strong>Opposizione:</strong> opporti al trattamento</li>
              </ul>
              <p className="mt-2">
                Per esercitare questi diritti, contatta il Titolare del trattamento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Cookie</h2>
              <p>
                L'applicazione utilizza esclusivamente <strong>cookie tecnici</strong> necessari 
                per l'autenticazione e il corretto funzionamento del servizio. 
                Non vengono utilizzati cookie di profilazione o di terze parti per finalità pubblicitarie.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Modifiche alla Privacy Policy</h2>
              <p>
                Il Titolare si riserva il diritto di modificare questa Privacy Policy. 
                Eventuali modifiche saranno comunicate tramite l'applicazione.
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