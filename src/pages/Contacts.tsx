import { Mail, MessageSquare, UserRound } from 'lucide-react'

export default function Contacts() {
  const email = 'daniele.leo93@gmail.com'
  const subject = '[PhaRMA T] {tipo segnalazione} - {titolo}'
  const bodyTemplate = `Mittente:\n\n\nDescrizione:\n`
  const mailtoHref = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyTemplate)}`

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Contatti e segnalazioni</h1>
        <p className="text-gray-500 mt-1">
          Riferimenti per bug, malfunzionamenti, suggerimenti e richieste di modifica.
        </p>
      </div>

      <div className="space-y-6">
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-sky-100 flex items-center justify-center shrink-0">
              <UserRound className="w-6 h-6 text-sky-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Ideazione e sviluppo</h2>
              <p className="text-gray-600 mt-3 leading-relaxed">
                PhaRMA T è stato ideato e sviluppato dal Dott. Daniele Leonardi Vinci,
                Dirigente Farmacista presso A.O.O.R. Villa Sofia - Cervello di Palermo e
                Coordinatore dell'Area Scientifica Culturale Rischio Clinico SIFO per il
                mandato 2025-2028.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                <MessageSquare className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Invio segnalazioni</h2>
                <p className="text-gray-600 mt-3 leading-relaxed">
                  Per segnalare bug, malfunzionamenti, suggerimenti di miglioramento o
                  richieste di modifica, utilizza invia una mail all'indirizzo:
                </p>
                <a
                  href={mailtoHref}
                  className="inline-flex items-center gap-2 mt-4 text-sky-700 hover:text-sky-800 font-semibold"
                >
                  <Mail className="w-4 h-4" />
                  {email}
                </a>
              </div>
            </div>

            <a
              href={mailtoHref}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-lg font-medium hover:bg-sky-700 transition"
            >
              <Mail className="w-4 h-4" />
              Scrivi email
            </a>
          </div>
        </section>

        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-gray-800">Formato consigliato</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Oggetto</p>
              <p className="font-mono text-sm text-gray-800 mt-2 break-words">
                [PhaRMA T] {'{tipo segnalazione}'} - {'{titolo}'}
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Corpo</p>
              <pre className="font-mono text-sm text-gray-800 mt-2 whitespace-pre-wrap">
{`Mittente:


Descrizione:`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
